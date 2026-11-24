import { NavLink, Outlet, useOutletContext } from "react-router";

const tabClass = ({ isActive }) => `tab${isActive ? " active" : ""}`;

function AdminLayout() {
  // Reenviamos a las páginas hijas el contexto que viene del diseño común
  const outletContext = useOutletContext();

  return (
    <section>
      <h2 className="admin-title">Panel de administración</h2>

      <nav className="tabs" aria-label="Secciones de administración">
        {/* Rutas relativas: estando dentro de /admin, «cartas» significa /admin/cartas */}
        <NavLink to="cartas" className={tabClass}>
          Cartas
        </NavLink>
        <NavLink to="pedidos" className={tabClass}>
          Pedidos
        </NavLink>
      </nav>

      <Outlet context={outletContext} />
    </section>
  );
}

export default AdminLayout;
