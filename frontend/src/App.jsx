import { useEffect, useState } from "react";
import CardList from "./components/CardList.jsx";
import AddCardForm from "./components/AddCardForm.jsx";
import AuthPanel from "./components/AuthPanel.jsx";
import CartView from "./components/CartView.jsx";
import OrdersView from "./components/OrdersView.jsx";
import { useAuth } from "./auth/useAuth.js";
import { useCart } from "./cart/useCart.js";
import { apiUrl } from "./api.js";

function App() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();

  // Pantalla actual: "catalog", "cart", "orders" o "admin-orders"
  const [view, setView] = useState("catalog");
  const [showAuth, setShowAuth] = useState(false);
  const [notice, setNotice] = useState(null);

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  // Cada vez que este número cambia, el efecto vuelve a cargar las cartas
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Evita que una respuesta antigua pise a una más reciente
    let ignore = false;

    async function loadCards() {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());

        const response = await fetch(apiUrl(`/api/cards?${params}`));
        if (!response.ok) {
          throw new Error("No se pudieron cargar las cartas");
        }
        const data = await response.json();
        if (!ignore) {
          setCards(data);
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
  }, [refreshKey, search]);

  function reloadCards() {
    setRefreshKey((current) => current + 1);
  }

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
        <h1>Magic Card Store</h1>

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
          {isAdmin && <AddCardForm onCardAdded={reloadCards} />}

          <input
            type="search"
            className="search-input"
            placeholder="Buscar en la tienda por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <CardList
            cards={cards}
            loading={loading}
            error={error}
            search={search}
            onChanged={reloadCards}
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
    </div>
  );
}

export default App;
