import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/useAuth.js";
import { apiUrl } from "../api.js";

function AdminCardRow({ card, onChanged }) {
  const { token } = useAuth();
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

  async function handleSave() {
    const priceNumber = Number(price);
    const stockNumber = Number(stock);

    // Validamos antes de molestar al servidor (que además lo vuelve a validar)
    if (
      price.trim() === "" ||
      stock.trim() === "" ||
      !Number.isFinite(priceNumber) ||
      priceNumber < 0 ||
      !Number.isInteger(stockNumber) ||
      stockNumber < 0
    ) {
      setError(
        "El precio y el stock deben ser números de 0 o más (el stock, entero).",
      );
      return;
    }

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
          price: priceNumber,
          stock: stockNumber,
          condition,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar");
      }

      setIsEditing(false);
      onChanged(); // avisa a la página para que recargue la tabla
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

  // Enter en un campo guarda los cambios
  function handleKeyDown(event) {
    if (event.key === "Enter") handleSave();
  }

  return (
    <>
      <tr>
        <td>
          <div className="admin-card-cell">
            {card.imageUrl && <img src={card.imageUrl} alt="" loading="lazy" />}
            <Link to={`/cartas/${card._id}`}>{card.name}</Link>
          </div>
        </td>
        <td>{card.setName}</td>

        {isEditing ? (
          <>
            <td>
              <select
                aria-label={`Estado de ${card.name}`}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="NM">NM</option>
                <option value="LP">LP</option>
                <option value="MP">MP</option>
                <option value="HP">HP</option>
                <option value="DMG">DMG</option>
              </select>
            </td>
            <td>
              <input
                type="number"
                min="0"
                step="0.01"
                aria-label={`Precio de ${card.name}`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                step="1"
                aria-label={`Stock de ${card.name}`}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </td>
          </>
        ) : (
          <>
            <td>{card.condition}</td>
            <td>{card.price.toFixed(2)} €</td>
            <td className={card.stock === 0 ? "stock-zero" : ""}>
              {card.stock}
            </td>
          </>
        )}

        <td className="admin-actions">
          {isEditing ? (
            <>
              <button type="button" onClick={handleSave} disabled={busy}>
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
            </>
          ) : (
            <>
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
            </>
          )}
        </td>
      </tr>

      {error && (
        <tr>
          <td colSpan={6} className="error">
            {error}
          </td>
        </tr>
      )}
    </>
  );
}

export default AdminCardRow;
