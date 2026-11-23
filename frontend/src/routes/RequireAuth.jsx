import { Outlet, useOutletContext } from "react-router";
import { useAuth } from "../auth/useAuth.js";

// Ruta protegida: solo deja pasar a quien ha iniciado sesión
function RequireAuth() {
  const { user, token } = useAuth();
  const outletContext = useOutletContext();

  // Hay un token guardado, pero el servidor aún no ha confirmado la sesión (puede estar despertando)
  if (!user && token) {
    return <p className="notice-line">Comprobando tu sesión…</p>;
  }

  // Sin sesión: no redirigimos, enseñamos aquí mismo cómo entrar. Al iniciar sesión, aparece el contenido
  if (!user) {
    return (
      <section className="panel">
        <h2>Inicia sesión</h2>
        <p className="hint">Necesitas una cuenta para ver esta página.</p>
        <button type="button" onClick={outletContext.openLogin}>
          Iniciar sesión
        </button>
      </section>
    );
  }

  // Un Outlet dentro de otro no hereda el contexto: hay que volver a pasarlo
  return <Outlet context={outletContext} />;
}

export default RequireAuth;
