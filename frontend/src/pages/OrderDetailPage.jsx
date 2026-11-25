import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { fetchWithRetry } from "../api.js";
import { useAuth } from "../auth/useAuth.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import {
  STATUS_LABELS,
  STATUS_NOTES,
  formatDate,
  orderNumber,
} from "../orders.js";
import NotFoundPage from "./NotFoundPage.jsx";

// Subtotal de una línea, calculado en céntimos para evitar errores de decimales
function lineTotal(item) {
  return (Math.round(item.unitPrice * 100) * item.quantity) / 100;
}

function OrderDetailPage() {
  // useParams lee la parte variable de la dirección: /pedidos/:id
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAdmin } = useAuth();

  // Resultado de pedir el pedido, junto con el id al que corresponde
  const [result, setResult] = useState({
    id: null,
    status: "loading",
    order: null,
  });

  // Un identificador de MongoDB son exactamente 24 caracteres hexadecimales
  const validId = /^[a-f0-9]{24}$/i.test(id ?? "");
  const current =
    result.id === id ? result : { id, status: "loading", order: null };
  const order = current.order;

  usePageTitle(order ? `Pedido ${orderNumber(order)}` : "Pedido");

  useEffect(() => {
    if (!validId) return;

    let ignore = false;
    const controller = new AbortController();

    async function loadOrder() {
      try {
        const response = await fetchWithRetry(`/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (ignore) return;

        // 404: el pedido no existe o no es tuyo (el servidor no distingue entre ambos casos)
        if (response.status === 404) {
          setResult({ id, status: "notFound", order: null });
          return;
        }
        if (!response.ok) throw new Error("Respuesta no válida");

        const data = await response.json();
        if (!ignore) setResult({ id, status: "ready", order: data });
      } catch {
        if (!ignore) setResult({ id, status: "error", order: null });
      }
    }

    loadOrder();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id, validId, token]);

  // "default" es la clave de la primera entrada del historial: si llegaste desde un enlace,
  // no hay página anterior de esta web a la que volver
  function goBack() {
    if (location.key !== "default") navigate(-1);
    else navigate(isAdmin ? "/admin/pedidos" : "/pedidos");
  }

  if (!validId || current.status === "notFound") {
    return <NotFoundPage message="No encontramos ese pedido." />;
  }

  if (current.status === "error") {
    return (
      <section className="panel">
        <h2>No se pudo cargar el pedido</h2>
        <p className="hint">Comprueba tu conexión e inténtalo de nuevo.</p>
        <button type="button" onClick={() => navigate(0)}>
          Reintentar
        </button>
      </section>
    );
  }

  if (!order) return <p>Cargando pedido…</p>;

  // El servidor solo añade el email del cliente cuando quien pregunta es administrador
  const customer = isAdmin ? (order.user?.email ?? "Usuario eliminado") : null;

  return (
    <section className="panel order-detail">
      <button type="button" className="link-button back-link" onClick={goBack}>
        ← Volver
      </button>

      {location.state?.orderPlaced && (
        <p className="success">
          ¡Pedido realizado con éxito! Aquí puedes ver su estado.
        </p>
      )}

      <div className="order-detail-head">
        <h2>Pedido {orderNumber(order)}</h2>
        <span className={`status ${order.status}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <dl className="order-meta">
        <div>
          <dt>Fecha</dt>
          <dd>{formatDate(order.createdAt)}</dd>
        </div>
        {order.status !== "pending" && (
          <div>
            <dt>Última actualización</dt>
            <dd>{formatDate(order.updatedAt)}</dd>
          </div>
        )}
        {customer && (
          <div>
            <dt>Cliente</dt>
            <dd>{customer}</dd>
          </div>
        )}
      </dl>

      <div className="table-wrap">
        <table className="admin-table order-table">
          <thead>
            <tr>
              <th>Carta</th>
              <th>Edición</th>
              <th>Cantidad</th>
              <th>Precio unidad</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.card}>
                <td>
                  <div className="admin-card-cell">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" loading="lazy" />
                    )}
                    {/* Si la carta se borró de la tienda, el enlace lleva a la página de «no encontrada» */}
                    <Link to={`/cartas/${item.card}`}>{item.name}</Link>
                  </div>
                </td>
                <td>{item.setName ?? "—"}</td>
                <td>{item.quantity}</td>
                <td>{item.unitPrice.toFixed(2)} €</td>
                <td>{lineTotal(item).toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="order-total">
        Total: <strong>{order.total.toFixed(2)} €</strong>
      </p>

      <p className="hint">{STATUS_NOTES[order.status]}</p>
    </section>
  );
}

export default OrderDetailPage;
