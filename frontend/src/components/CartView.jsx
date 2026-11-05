import { useState } from "react";
import { useAuth } from "../auth/useAuth.js";
import { useCart } from "../cart/useCart.js";
import { apiUrl } from "../api.js";

function CartView({ onOrderPlaced, onReloadCards, onNeedLogin }) {
  const { user, token } = useAuth();
  const { items, total, setQuantity, removeItem, clearCart } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleCheckout() {
    if (!user) {
      onNeedLogin();
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Solo enviamos identificadores y cantidades: el precio lo calcula el servidor
        body: JSON.stringify({
          items: items.map((item) => ({
            cardId: item.cardId,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el pedido");
      }

      clearCart();
      onOrderPlaced();
    } catch (err) {
      setError(err.message);
      onReloadCards(); // el stock pudo cambiar: actualizamos el catálogo
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Tu carrito</h2>

      {items.length === 0 ? (
        <p>El carrito está vacío.</p>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.cardId} className="cart-row">
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} />}

                <div className="cart-info">
                  <strong>{item.name}</strong>
                  <span>{item.setName}</span>
                  <span>{item.price.toFixed(2)} € / ud.</span>
                </div>

                <label>
                  Cantidad
                  <input
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.cardId, e.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="danger"
                  onClick={() => removeItem(item.cardId)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>

          <p className="cart-total">
            Total: <strong>{total.toFixed(2)} €</strong>
          </p>

          <p className="hint">
            Esta tienda es una demostración: los pedidos no tienen pago real. El
            servidor confirma el precio final al hacer el pedido.
          </p>

          {!user && (
            <p className="hint">
              Necesitas iniciar sesión para confirmar el pedido.
            </p>
          )}

          <div className="card-actions">
            <button type="button" onClick={handleCheckout} disabled={busy}>
              {busy
                ? "Procesando..."
                : user
                  ? "Confirmar pedido"
                  : "Iniciar sesión para pedir"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={clearCart}
              disabled={busy}
            >
              Vaciar carrito
            </button>
          </div>

          {error && <p className="error">{error}</p>}
        </>
      )}
    </section>
  );
}

export default CartView;
