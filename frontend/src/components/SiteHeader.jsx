import AccountMenu from "./AccountMenu.jsx";
import { CartIcon } from "./Icons.jsx";
import { useCart } from "../cart/useCart.js";

function SiteHeader({
  currentView,
  onNavigate,
  onHome,
  onOpenLogin,
  onLogout,
}) {
  const { count } = useCart();

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <h1>
            <a
              href="/"
              onClick={(event) => {
                event.preventDefault();
                onHome();
              }}
            >
              Magic Card Store
            </a>
          </h1>
          <div className="mana-pips" aria-hidden="true">
            <span className="pip pip-W" />
            <span className="pip pip-U" />
            <span className="pip pip-B" />
            <span className="pip pip-R" />
            <span className="pip pip-G" />
          </div>
        </div>

        <div className="header-actions">
          <AccountMenu
            currentView={currentView}
            onNavigate={onNavigate}
            onOpenLogin={onOpenLogin}
            onLogout={onLogout}
          />

          <button
            type="button"
            className={`header-icon-button${currentView === "cart" ? " active" : ""}`}
            aria-label={`Carrito: ${count} ${count === 1 ? "artículo" : "artículos"}`}
            aria-current={currentView === "cart" ? "page" : undefined}
            onClick={() => onNavigate("cart")}
          >
            <CartIcon />
            {/* key={count}: al cambiar el número, React recrea el globo y se repite la animación */}
            {count > 0 && (
              <span key={count} className="cart-badge" aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
