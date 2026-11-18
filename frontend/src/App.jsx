import { useEffect, useRef, useState } from "react";
import CardList from "./components/CardList.jsx";
import AddCardForm from "./components/AddCardForm.jsx";
import AuthPanel from "./components/AuthPanel.jsx";
import CartView from "./components/CartView.jsx";
import OrdersView from "./components/OrdersView.jsx";
import FilterBar from "./components/FilterBar.jsx";
import Pagination from "./components/Pagination.jsx";
import FeaturedCard from "./components/FeaturedCard.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import CartToast from "./components/CartToast.jsx";
import CardDetail from "./components/CardDetail.jsx";
import { useAuth } from "./auth/useAuth.js";
import { useCart } from "./cart/useCart.js";
import { fetchWithRetry } from "./api.js";
import {
  DEFAULT_FILTERS,
  PAGE_SIZE,
  buildParams,
  readFiltersFromUrl,
} from "./filters.js";

// Quien prefiere menos animaciones recibe un desplazamiento instantáneo
function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

function App() {
  const { user, isAdmin, logout } = useAuth();
  const { lastAdded } = useCart();

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
  // true mientras se reintenta porque el servidor gratuito de Render está despertando
  const [waking, setWaking] = useState(false);
  // Los filtros se leen de la dirección al abrir la página
  const [filters, setFilters] = useState(readFiltersFromUrl);
  // Cada vez que este número cambia, el efecto vuelve a cargar las cartas
  const [refreshKey, setRefreshKey] = useState(0);

  // Carta que hay que mostrar y resaltar tras pulsar "Ver en el catálogo"
  const [highlightId, setHighlightId] = useState(null);
  // Carta abierta en la ventana de detalle
  const [selectedCard, setSelectedCard] = useState(null);
  // Referencia a la zona del catálogo (filtros + resultados), para poder bajar hasta ella
  const catalogRef = useRef(null);

  // Pide las cartas cada vez que cambian los filtros o hay que recargar
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

  // Mantiene la dirección del navegador al día con los filtros (se puede copiar y compartir)
  useEffect(() => {
    const query = buildParams(filters).toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", url);
  }, [filters]);

  // Cuando la carta pedida ya está en pantalla, bajamos hasta ella y la resaltamos unos segundos
  useEffect(() => {
    if (!highlightId) return;

    const element = document.getElementById(`card-${highlightId}`);
    if (!element) return; // todavía no ha llegado de la API

    element.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    const timer = setTimeout(() => setHighlightId(null), 2500);

    return () => clearTimeout(timer);
  }, [highlightId, cards]);

  function reloadCards() {
    setRefreshKey((current) => current + 1);
  }

  // Botón "Reintentar" cuando la carga falla del todo
  function retryLoad() {
    setError(null);
    setLoading(true);
    setRefreshKey((current) => current + 1);
  }

  // Al cambiar cualquier filtro volvemos a la página 1, salvo que el cambio sea de página
  function updateFilters(changes) {
    setHighlightId(null);
    setFilters((current) => ({ ...current, page: 1, ...changes }));
  }

  function resetFilters() {
    setHighlightId(null);
    setFilters({ ...DEFAULT_FILTERS });
  }

  function changePage(page) {
    updateFilters({ page });
    catalogRef.current?.scrollIntoView({
      behavior: scrollBehavior(),
      block: "start",
    });
  }

  // "Ver en el catálogo": limpia TODOS los filtros, busca la carta por su nombre y baja hasta ella
  function showCardInCatalog(card) {
    setFilters({ ...DEFAULT_FILTERS, search: card.name });
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

  function goTo(nextView) {
    setView(nextView);
    setNotice(null);
    // Al volver al catálogo lo actualizamos: el stock pudo cambiar
    if (nextView === "catalog") reloadCards();
  }

  // Al pulsar el título: catálogo y arriba del todo
  function handleHome() {
    goTo("catalog");
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
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

  // Si la carta abierta también está en la lista, usamos esa copia, que es la más reciente
  const detailCard = selectedCard
    ? (cards.find((card) => card._id === selectedCard._id) ?? selectedCard)
    : null;

  // Si la sesión se cierra o caduca, volvemos al catálogo
  let currentView = view;
  if ((view === "orders" || view === "admin-orders") && !user)
    currentView = "catalog";
  if (view === "admin-orders" && !isAdmin) currentView = "catalog";

  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>

      <SiteHeader
        currentView={currentView}
        onNavigate={goTo}
        onHome={handleHome}
        onOpenLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
      />

      <main id="main" className="container">
        {showAuth && !user && <AuthPanel onClose={() => setShowAuth(false)} />}

        {currentView === "catalog" && (
          <>
            <FeaturedCard
              onSelect={showCardInCatalog}
              onOpen={setSelectedCard}
            />

            {isAdmin && <AddCardForm onCardAdded={reloadCards} />}

            <div ref={catalogRef} className="catalog-section">
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
                waking={waking}
                hasFilters={hasFilters}
                highlightId={highlightId}
                onChanged={reloadCards}
                onRetry={retryLoad}
                onOpen={setSelectedCard}
              />

              <Pagination
                page={pageInfo.page}
                totalPages={pageInfo.totalPages}
                onPageChange={changePage}
              />
            </div>
          </>
        )}

        {currentView === "cart" && (
          <CartView
            onOrderPlaced={handleOrderPlaced}
            onReloadCards={reloadCards}
            onNeedLogin={() => setShowAuth(true)}
            onBrowse={() => goTo("catalog")}
          />
        )}

        {currentView === "orders" && (
          <>
            {notice && <p className="success">{notice}</p>}
            <OrdersView key="mine" />
          </>
        )}

        {currentView === "admin-orders" && <OrdersView key="admin" admin />}
        {detailCard && (
          <CardDetail
            key={detailCard._id}
            card={detailCard}
            onClose={() => setSelectedCard(null)}
            onViewCart={() => {
              setSelectedCard(null);
              goTo("cart");
            }}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <p>
            Datos e imágenes de las cartas:{" "}
            <a href="https://scryfall.com" target="_blank" rel="noreferrer">
              Scryfall
            </a>
            . <em>Magic: The Gathering</em> es una marca de Wizards of the
            Coast. Este es un proyecto de aficionados, no oficial y sin
            afiliación con Wizards of the Coast ni con Scryfall.
          </p>
        </div>
      </footer>

      {/* Aviso de "añadida al carrito": una key nueva por cada carta añadida lo vuelve a mostrar */}
      {lastAdded && (
        <CartToast
          key={lastAdded.key}
          name={lastAdded.name}
          onViewCart={() => goTo("cart")}
        />
      )}
    </>
  );
}

export default App;
