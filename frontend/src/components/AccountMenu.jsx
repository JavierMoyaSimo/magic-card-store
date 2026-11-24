import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth.js";
import { ChevronIcon, UserIcon } from "./Icons.jsx";

function AccountMenu({ onOpenLogin, onLogout }) {
  const { user, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  // Mientras el menú está abierto, se cierra con un clic fuera o con la tecla Escape
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Sin sesión: un icono que abre la ventana de inicio de sesión
  if (!user) {
    return (
      <button
        type="button"
        className="header-icon-button"
        onClick={onOpenLogin}
        aria-label="Iniciar sesión"
      >
        <UserIcon />
        <span className="icon-label">Entrar</span>
      </button>
    );
  }

  const isAccountArea =
    pathname.startsWith("/pedidos") || pathname.startsWith("/admin");

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`header-icon-button${isAccountArea ? " active" : ""}`}
        aria-expanded={open}
        aria-controls="account-menu-panel"
        aria-label="Mi cuenta"
        onClick={() => setOpen((current) => !current)}
      >
        <UserIcon />
        <span className="icon-label account-email">{user.email}</span>
        <ChevronIcon size={16} className="icon-label" />
      </button>

      {open && (
        <div className="menu" id="account-menu-panel">
          <div className="menu-header">
            <span className="menu-email">{user.email}</span>
            {isAdmin && <span className="badge">admin</span>}
          </div>

          <Link to="/pedidos" onClick={() => setOpen(false)}>
            Mis pedidos
          </Link>

          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)}>
              Panel de administración
            </Link>
          )}

          <button
            type="button"
            className="menu-danger"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
