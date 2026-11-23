import { Link } from "react-router";
import { usePageTitle } from "../hooks/usePageTitle.js";

function NotFoundPage({ message = "La página que buscas no existe." }) {
  usePageTitle("Página no encontrada");

  return (
    <section className="panel">
      <h2>Página no encontrada</h2>
      <p>{message}</p>
      <Link to="/" className="button-link">
        Volver al catálogo
      </Link>
    </section>
  );
}

export default NotFoundPage;
