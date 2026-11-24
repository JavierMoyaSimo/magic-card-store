import { useEffect, useRef, useState } from "react";
import CardList from "../components/CardList.jsx";
import FilterBar from "../components/FilterBar.jsx";
import Pagination from "../components/Pagination.jsx";
import FeaturedCard from "../components/FeaturedCard.jsx";
import { fetchWithRetry } from "../api.js";
import { DEFAULT_FILTERS, PAGE_SIZE, buildParams } from "../filters.js";
import { useCatalogFilters } from "../hooks/useCatalogFilters.js";
import { scrollBehavior } from "../scroll.js";

function CatalogPage() {
  const { filters, updateFilters, resetFilters } = useCatalogFilters();

  const [cards, setCards] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // true mientras se reintenta porque el servidor gratuito de Render está despertando
  const [waking, setWaking] = useState(false);
  // Cada vez que este número cambia, el efecto vuelve a cargar las cartas
  const [refreshKey, setRefreshKey] = useState(0);
  // Carta que hay que mostrar y resaltar tras pulsar "Ver en el catálogo"
  const [highlightId, setHighlightId] = useState(null);
  // Referencia a la zona del catálogo (filtros + resultados), para poder bajar hasta ella
  const catalogRef = useRef(null);

  // Pide las cartas cada vez que cambian los filtros (es decir, la dirección) o hay que recargar
  useEffect(() => {
    // Evita que una respuesta antigua pise a una más reciente
    let ignore = false;
    // Permite cancelar los reintentos pendientes si cambian los filtros
    const controller = new AbortController();

    async function loadCards() {
      try {
        const params = buildParams(filters);
        params.set("limit", String(PAGE_SIZE));

        const response = await fetchWithRetry(
          `/api/cards?${params}`,
          { signal: controller.signal },
          {
            onRetry: () => {
              if (!ignore) setWaking(true);
            },
          },
        );
        if (!response.ok) {
          throw new Error("Respuesta no válida");
        }
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
        if (!ignore) {
          setError(
            "No se pudieron cargar las cartas. Comprueba tu conexión e inténtalo de nuevo.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setWaking(false);
        }
      }
    }

    loadCards();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [filters, refreshKey]);

  // Cuando la carta pedida ya está en pantalla, bajamos hasta ella y la resaltamos unos segundos
  useEffect(() => {
    if (!highlightId) return;

    const element = document.getElementById(`card-${highlightId}`);
    if (!element) return; // todavía no ha llegado de la API

    element.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    const timer = setTimeout(() => setHighlightId(null), 2500);

    return () => clearTimeout(timer);
  }, [highlightId, cards]);

  // Botón "Reintentar" cuando la carga falla del todo
  function retryLoad() {
    setError(null);
    setLoading(true);
    setRefreshKey((current) => current + 1);
  }

  function handleFilterChange(changes) {
    setHighlightId(null);
    updateFilters(changes);
  }

  function handleReset() {
    setHighlightId(null);
    resetFilters();
  }

  // Cada página nueva añade una entrada al historial: el botón Atrás vuelve a la anterior
  function changePage(page) {
    setHighlightId(null);
    updateFilters({ page }, { push: true });
    catalogRef.current?.scrollIntoView({
      behavior: scrollBehavior(),
      block: "start",
    });
  }

  // "Ver en el catálogo": limpia TODOS los filtros, busca la carta por su nombre y baja hasta ella
  function showCardInCatalog(card) {
    updateFilters({ ...DEFAULT_FILTERS, search: card.name }, { push: true });
    setHighlightId(card._id);
    catalogRef.current?.scrollIntoView({
      behavior: scrollBehavior(),
      block: "start",
    });
  }

  const hasFilters =
    filters.search.trim() !== "" ||
    filters.type !== "" ||
    filters.colors.length > 0 ||
    filters.manaValue !== "";

  return (
    <>
      <FeaturedCard onSelect={showCardInCatalog} />

      <div ref={catalogRef} className="catalog-section">
        <FilterBar
          filters={filters}
          hasFilters={hasFilters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        {!loading && !error && (
          <p className="results-count">
            {pageInfo.total} {pageInfo.total === 1 ? "carta" : "cartas"}
          </p>
        )}

        <CardList
          cards={cards}
          loading={loading}
          error={error}
          waking={waking}
          hasFilters={hasFilters}
          highlightId={highlightId}
          onRetry={retryLoad}
        />

        <Pagination
          page={pageInfo.page}
          totalPages={pageInfo.totalPages}
          onPageChange={changePage}
        />
      </div>
    </>
  );
}

export default CatalogPage;
