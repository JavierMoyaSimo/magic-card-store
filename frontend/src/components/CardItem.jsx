import { useState } from "react";
import { useAuth } from "../auth/useAuth.js";

function CardItem({ card, onChanged }) {
  const { token, isAdmin } = useAuth();
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
      const response = await fetch(`/api/cards/${card._id}`, {
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
      const response = await fetch(`/api/cards/${card._id}`, {
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
    <article className="card">
      {card.imageUrl && <img src={card.imageUrl} alt={card.name} />}
      <h3>{card.name}</h3>
      <p>{card.setName}</p>

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
          <p>Estado: {card.condition}</p>
          <p className="price">{card.price.toFixed(2)} €</p>
          <p>Stock: {card.stock}</p>
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
    </article>
  );
}

export default CardItem;
