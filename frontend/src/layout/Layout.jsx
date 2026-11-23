import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import SiteHeader from "../components/SiteHeader.jsx";
import AuthPanel from "../components/AuthPanel.jsx";
import CartToast from "../components/CartToast.jsx";
import { useAuth } from "../auth/useAuth.js";
import { useCart } from "../cart/useCart.js";

// En una aplicación de una sola página, el navegador no sube solo al cambiar de pantalla
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Layout() {
  const { user, logout } = useAuth();
  const { lastAdded } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showAuth, setShowAuth] = useState(false);

  const openLogin = () => setShowAuth(true);

  // Al cerrar sesión, si estabas en una zona privada, volvemos al inicio
  function handleLogout() {
    logout();
    if (pathname.startsWith("/pedidos") || pathname.startsWith("/admin"))
      navigate("/");
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>

      <ScrollToTop />

      <SiteHeader onOpenLogin={openLogin} onLogout={handleLogout} />

      <main id="main" className="container">
        {showAuth && !user && <AuthPanel onClose={() => setShowAuth(false)} />}

        {/* Aquí se dibuja la página de la ruta actual. El contexto se lo pasa a las páginas */}
        <Outlet context={{ openLogin }} />
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

      {lastAdded && (
        <CartToast
          key={lastAdded.key}
          name={lastAdded.name}
          onViewCart={() => navigate("/carrito")}
        />
      )}
    </>
  );
}

export default Layout;
