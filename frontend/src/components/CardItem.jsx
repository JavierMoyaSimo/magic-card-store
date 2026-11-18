import { useState } from "react";
import { useAuth } from "../auth/useAuth.js";
import { useCart } from "../cart/useCart.js";
import { apiUrl } from "../api.js";

function CardItem({ card, onChanged, onOpen, highlighted = false }) {
  const { token, isAdmin } = useAuth();
  const { items, addItem } = useCart();
  const inCart = items.find((item) => item.cardId === card._id)?.quantity ?? 0; // Lo que queda disponible para ti: el stock real menos lo que ya llevas en el carrito
  const available = Math.max(0, card.stock - inCart);

  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(String(card.price));
  const [stock, setStock] = useState(String(card.stock));
  const [condition, setCondition] = useState(card.condition);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Al empezar a editar, partimos de los valores actuales de la carta
  function startEditing() {
    setPrice(String(card.price));
    setStock(String(card.stock));
    setCondition(card.condition);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/cards/${card._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price: Number(price),
          stock: Number(stock),
          condition,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar");
      }

      setIsEditing(false);
      onChanged(); // avisa a App para que recargue la lista
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    // confirm() muestra una ventana de Aceptar / Cancelar del navegador
    if (!window.confirm(`¿Eliminar "${card.name}" de la tienda?`)) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/cards/${card._id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo eliminar");
      }
      onChanged();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <article
      id={`card-${card._id}`}
      className={`card${highlighted ? " highlight" : ""}`}
    >
      {/* Parte de arriba: imagen y nombre. Ambos abren el detalle */}
      <div className="card-top">
        {card.imageUrl && (
          <button
            type="button"
            className="card-open"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => onOpen(card)}
          >
            <img src={card.imageUrl} alt={card.name} loading="lazy" />
          </button>
        )}
        <h3>
          <button
            type="button"
            className="card-title-button"
            title={card.name}
            onClick={() => onOpen(card)}
          >
            <span className="card-title-text">{card.name}</span>
          </button>
        </h3>
        <p className="card-set" title={card.setName}>
          {card.setName}
        </p>
      </div>

      {/* Parte de abajo: precio, stock y botones, pegada al fondo de la tarjeta */}
      <div className="card-bottom">
        {isEditing ? (
          <form className="edit-form" onSubmit={handleSave}>
            <label>
              Precio (€)
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </label>
            <label>
              Estado
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="NM">NM</option>
                <option value="LP">LP</option>
                <option value="MP">MP</option>
                <option value="HP">HP</option>
                <option value="DMG">DMG</option>
              </select>
            </label>
            <div className="card-actions">
              <button type="submit" disabled={busy}>
                {busy ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setIsEditing(false)}
                disabled={busy}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="card-meta">
              <p className="price">{card.price.toFixed(2)} €</p>
              <span className="card-condition" title="Estado de conservación">
                {card.condition}
              </span>
            </div>

            <p className="card-stock">
              {card.stock > 0 ? `Disponibles: ${available}` : "Sin stock"}
              {inCart > 0 && (
                <span className="in-cart"> · {inCart} en tu carrito</span>
              )}
            </p>

            {card.stock > 0 ? (
              <button
                type="button"
                className="add-to-cart"
                onClick={() => addItem(card)}
                disabled={available === 0}
              >
                {available === 0 ? "Máximo en el carrito" : "Añadir al carrito"}
              </button>
            ) : (
              <p className="out-of-stock">Agotada</p>
            )}

            {isAdmin && (
              <div className="card-actions">
                <button type="button" onClick={startEditing} disabled={busy}>
                  Editar
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={handleDelete}
                  disabled={busy}
                >
                  Eliminar
                </button>
              </div>
            )}
          </>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </article>
  );
}

export default CardItem;
