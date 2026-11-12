import { useEffect, useState } from "react";
import CardList from "./components/CardList.jsx";
import AddCardForm from "./components/AddCardForm.jsx";
import AuthPanel from "./components/AuthPanel.jsx";
import CartView from "./components/CartView.jsx";
import OrdersView from "./components/OrdersView.jsx";
import FilterBar from "./components/FilterBar.jsx";
import Pagination from "./components/Pagination.jsx";
import FeaturedCard from "./components/FeaturedCard.jsx";
import { useAuth } from "./auth/useAuth.js";
import { useCart } from "./cart/useCart.js";
import { apiUrl } from "./api.js";
import {
  DEFAULT_FILTERS,
  PAGE_SIZE,
  buildParams,
  readFiltersFromUrl,
} from "./filters.js";

function App() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();

  // Pantalla actual: "catalog", "cart", "orders" o "admin-orders"
  const [view, setView] = useState("catalog");
  const [showAuth, setShowAuth] = useState(false);
  const [notice, setNotice] = useState(null);

  const [cards, setCards] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Los filtros se leen de la dirección al abrir la página
  const [filters, setFilters] = useState(readFiltersFromUrl);
  // Cada vez que este número cambia, el efecto vuelve a cargar las cartas
  const [refreshKey, setRefreshKey] = useState(0);

  // Pide las cartas cada vez que cambian los filtros o hay que recargar
  useEffect(() => {
    // Evita que una respuesta antigua pise a una más reciente
    let ignore = false;

    async function loadCards() {
      try {
        const params = buildParams(filters);
        params.set("limit", String(PAGE_SIZE));

        const response = await fetch(apiUrl(`/api/cards?${params}`));
        if (!response.ok) {
          throw new Error("No se pudieron cargar las cartas");
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
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadCards();

    return () => {
      ignore = true;
    };
  }, [filters, refreshKey]);

  // Mantiene la dirección del navegador al día con los filtros (se puede copiar y compartir)
  useEffect(() => {
    const query = buildParams(filters).toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", url);
  }, [filters]);

  function reloadCards() {
    setRefreshKey((current) => current + 1);
  }

  // Al cambiar cualquier filtro volvemos a la página 1, salvo que el cambio sea de página
  function updateFilters(changes) {
    setFilters((current) => ({ ...current, page: 1, ...changes }));
  }

  function resetFilters() {
    setFilters({ ...DEFAULT_FILTERS });
  }

  function changePage(page) {
    updateFilters({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hasFilters =
    filters.search.trim() !== "" ||
    filters.type !== "" ||
    filters.colors.length > 0 ||
    filters.manaValue !== "";

  function goTo(nextView) {
    setView(nextView);
    setNotice(null);
    // Al volver al catálogo lo actualizamos: el stock pudo cambiar
    if (nextView === "catalog") reloadCards();
  }

  function handleOrderPlaced() {
    reloadCards();
    setNotice("¡Pedido realizado con éxito! Aquí puedes ver su estado.");
    setView("orders");
  }

  function handleLogout() {
    logout();
    goTo("catalog");
  }

  // Si la sesión se cierra o caduca, volvemos al catálogo
  let currentView = view;
  if ((view === "orders" || view === "admin-orders") && !user)
    currentView = "catalog";
  if (view === "admin-orders" && !isAdmin) currentView = "catalog";

  return (
    <div className="container">
      <header className="app-header">
        <div className="brand">
          <h1>Magic Card Store</h1>
          <div className="mana-pips" aria-hidden="true">
            <span className="pip pip-W" />
            <span className="pip pip-U" />
            <span className="pip pip-B" />
            <span className="pip pip-R" />
            <span className="pip pip-G" />
          </div>
        </div>

        <div className="auth-area">
          {user ? (
            <>
              <span>
                {user.email}
                {isAdmin && <span className="badge">admin</span>}
              </span>
              <button type="button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setShowAuth(true)}>
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      <nav className="main-nav">
        <button
          type="button"
          className={currentView === "catalog" ? "active" : ""}
          onClick={() => goTo("catalog")}
        >
          Catálogo
        </button>
        <button
          type="button"
          className={currentView === "cart" ? "active" : ""}
          onClick={() => goTo("cart")}
        >
          Carrito ({count})
        </button>
        {user && (
          <button
            type="button"
            className={currentView === "orders" ? "active" : ""}
            onClick={() => goTo("orders")}
          >
            Mis pedidos
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            className={currentView === "admin-orders" ? "active" : ""}
            onClick={() => goTo("admin-orders")}
          >
            Pedidos de la tienda
          </button>
        )}
      </nav>

      {showAuth && !user && <AuthPanel onClose={() => setShowAuth(false)} />}

      {currentView === "catalog" && (
        <>
          <FeaturedCard onSelect={(name) => updateFilters({ search: name })} />
          {isAdmin && <AddCardForm onCardAdded={reloadCards} />}

          <FilterBar
            filters={filters}
            hasFilters={hasFilters}
            onChange={updateFilters}
            onReset={resetFilters}
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
            hasFilters={hasFilters}
            onChanged={reloadCards}
          />

          <Pagination
            page={pageInfo.page}
            totalPages={pageInfo.totalPages}
            onPageChange={changePage}
          />
        </>
      )}

      {currentView === "cart" && (
        <CartView
          onOrderPlaced={handleOrderPlaced}
          onReloadCards={reloadCards}
          onNeedLogin={() => setShowAuth(true)}
        />
      )}

      {currentView === "orders" && (
        <>
          {notice && <p className="success">{notice}</p>}
          <OrdersView key="mine" />
        </>
      )}

      {currentView === "admin-orders" && <OrdersView key="admin" admin />}
      <footer className="app-footer">
        <p>
          Datos e imágenes de las cartas:{" "}
          <a href="https://scryfall.com" target="_blank" rel="noreferrer">
            Scryfall
          </a>
          . <em>Magic: The Gathering</em> es una marca de Wizards of the Coast.
          Este es un proyecto de aficionados, no oficial y sin afiliación con
          Wizards of the Coast ni con Scryfall.
        </p>
      </footer>
    </div>
  );
}

export default App;
