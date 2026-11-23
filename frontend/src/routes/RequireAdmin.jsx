import { Link, Outlet, useOutletContext } from "react-router";
import { useAuth } from "../auth/useAuth.js";

// Ruta solo para administradores (se usa dentro de RequireAuth)
function RequireAdmin() {
  const { isAdmin } = useAuth();
  const outletContext = useOutletContext();

  if (!isAdmin) {
    return (
      <section className="panel">
        <h2>Sin permisos</h2>
        <p className="hint">Esta zona es solo para administradores.</p>
        <Link to="/" className="button-link">
          Volver al catálogo
        </Link>
      </section>
    );
  }

  return <Outlet context={outletContext} />;
}

export default RequireAdmin;
