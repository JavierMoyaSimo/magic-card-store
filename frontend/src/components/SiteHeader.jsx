import { Link, NavLink } from "react-router";
import AccountMenu from "./AccountMenu.jsx";
import { CartIcon } from "./Icons.jsx";
import { useCart } from "../cart/useCart.js";

function SiteHeader({ onOpenLogin, onLogout }) {
  const { count } = useCart();

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <h1>
            <Link to="/">Magic Card Store</Link>
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
          <AccountMenu onOpenLogin={onOpenLogin} onLogout={onLogout} />

          {/* NavLink añade solo aria-current="page" y nos dice si es la página actual */}
          <NavLink
            to="/carrito"
            className={({ isActive }) =>
              `header-icon-button${isActive ? " active" : ""}`
            }
            aria-label={`Carrito: ${count} ${count === 1 ? "artículo" : "artículos"}`}
          >
            <CartIcon />
            {/* key={count}: al cambiar el número, React recrea el globo y se repite la animación */}
            {count > 0 && (
              <span key={count} className="cart-badge" aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
