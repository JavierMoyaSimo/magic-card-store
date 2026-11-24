import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AddCardForm from "../components/AddCardForm.jsx";
import AdminCardRow from "../components/AdminCardRow.jsx";
import Pagination from "../components/Pagination.jsx";
import { fetchWithRetry } from "../api.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

const ADMIN_PAGE_SIZE = 10;

function AdminCardsPage() {
  usePageTitle("Gestionar cartas");

  // El buscador y la página viven en la dirección: /admin/cartas?search=goblin&page=2
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const pageParam = Number.parseInt(searchParams.get("page"), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [cards, setCards] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Cada vez que este número cambia, el efecto vuelve a cargar la tabla
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Evita que una respuesta antigua pise a una más reciente
    let ignore = false;
    const controller = new AbortController();

    async function loadCards() {
      try {
        const params = new URLSearchParams({
          limit: String(ADMIN_PAGE_SIZE),
          page: String(page),
        });
        if (search) params.set("search", search);

        const response = await fetchWithRetry(`/api/cards?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Respuesta no válida");

        const data = await response.json();
        if (!ignore) {
          setCards(data.cards);
          setPageInfo({
            page: data.page,
            totalPages: data.totalPages,
            total: data.total,
          });
          setError(null);
        }
      } catch {
        if (!ignore) setError("No se pudieron cargar las cartas.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadCards();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [search, page, refreshKey]);

  function reload() {
    setRefreshKey((current) => current + 1);
  }

  function handleSearch(event) {
    event.preventDefault();
    const value = String(
      new FormData(event.currentTarget).get("search") ?? "",
    ).trim();
    setSearchParams(value ? { search: value } : {});
  }

  function clearSearch() {
    setSearchParams({});
  }

  // Cada página nueva añade una entrada al historial: el botón Atrás vuelve a la anterior
  function changePage(nextPage) {
    const params = new URLSearchParams(searchParams);
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    setSearchParams(params);
  }

  let content;
  if (loading) {
    content = <p>Cargando cartas...</p>;
  } else if (error) {
    content = <p className="error">{error}</p>;
  } else if (cards.length === 0) {
    content = (
      <p>
        {search
          ? "Ninguna carta coincide con la búsqueda."
          : "Todavía no hay cartas."}
      </p>
    );
  } else {
    content = (
      <>
        <p className="results-count">
          {pageInfo.total} {pageInfo.total === 1 ? "carta" : "cartas"}
        </p>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Carta</th>
                <th>Edición</th>
                <th>Estado</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <AdminCardRow key={card._id} card={card} onChanged={reload} />
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={pageInfo.page}
          totalPages={pageInfo.totalPages}
          onPageChange={changePage}
        />
      </>
    );
  }

  return (
    <>
      <AddCardForm onCardAdded={reload} />

      <section className="panel">
        <h3>Cartas de la tienda</h3>

        {/* Un formulario normal: el buscador se envía al pulsar Enter o el botón */}
        <form className="admin-search" role="search" onSubmit={handleSearch}>
          <input
            type="search"
            name="search"
            key={search}
            defaultValue={search}
            placeholder="Buscar por nombre..."
            aria-label="Buscar carta por nombre"
          />
          <button type="submit">Buscar</button>
          {search && (
            <button type="button" className="secondary" onClick={clearSearch}>
              Limpiar
            </button>
          )}
        </form>

        {content}
      </section>
    </>
  );
}

export default AdminCardsPage;
