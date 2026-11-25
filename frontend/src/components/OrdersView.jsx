import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/useAuth.js";
import { apiUrl, fetchWithRetry } from "../api.js";
import { STATUS_LABELS, formatDate, orderNumber } from "../orders.js";

function OrdersView({ admin = false }) {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  // Cada vez que este número cambia, el efecto vuelve a cargar los pedidos
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function loadOrders() {
      try {
        const path = admin ? "/api/orders" : "/api/orders/mine";
        const response = await fetchWithRetry(path, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar los pedidos");
        }
        if (!ignore) {
          setOrders(data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [admin, token, refreshKey]);

  async function changeStatus(orderId, status) {
    const action = status === "cancelled" ? "cancelar" : "marcar como enviado";
    if (!window.confirm(`¿Seguro que quieres ${action} este pedido?`)) return;

    setBusyId(orderId);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/orders/${orderId}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el pedido");
      }
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h2>{admin ? "Pedidos de la tienda" : "Mis pedidos"}</h2>

      {loading && <p>Cargando pedidos...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p>Todavía no hay pedidos.</p>
      )}

      {orders.map((order) => (
        <article key={order._id} className="order">
          <div className="order-head">
            <Link to={`/pedidos/${order._id}`} className="order-number">
              Pedido {orderNumber(order)}
            </Link>
            <span>{formatDate(order.createdAt)}</span>
            {admin && <span>{order.user?.email ?? "Usuario eliminado"}</span>}
            <span className={`status ${order.status}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          <ul className="order-items">
            {order.items.map((item) => (
              <li key={item.card}>
                {item.quantity} × {item.name} · {item.unitPrice.toFixed(2)} € /
                ud.
              </li>
            ))}
          </ul>

          <div className="order-footer">
            <p className="price">Total: {order.total.toFixed(2)} €</p>
            <Link to={`/pedidos/${order._id}`} className="button-link">
              Ver detalle
            </Link>
          </div>

          {order.status === "cancelled" && (
            <p className="hint">
              Pedido cancelado: las cartas han vuelto al stock.
            </p>
          )}

          {admin && order.status === "pending" && (
            <div className="card-actions">
              <button
                type="button"
                onClick={() => changeStatus(order._id, "shipped")}
                disabled={busyId === order._id}
              >
                Marcar como enviado
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => changeStatus(order._id, "cancelled")}
                disabled={busyId === order._id}
              >
                Cancelar pedido
              </button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

export default OrdersView;
