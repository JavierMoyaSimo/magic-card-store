import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth.js";

function AddCardForm({ onCardAdded }) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [selectedName, setSelectedName] = useState("");
  // Guardamos las sugerencias junto con el texto al que corresponden
  const [suggestionData, setSuggestionData] = useState({
    query: "",
    items: [],
  });
  const [preview, setPreview] = useState(null);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(1);
  const [condition, setCondition] = useState("NM");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }
  const [identifying, setIdentifying] = useState(false);

  // Valores calculados al pintar (no necesitan estado propio)
  const query = name.trim();
  const canSuggest = query.length >= 2 && query !== selectedName;
  const suggestions =
    canSuggest && suggestionData.query === query ? suggestionData.items : [];

  // Autocompletado: pide sugerencias 300 ms después de que dejes de teclear
  useEffect(() => {
    if (!canSuggest) return;

    let ignore = false;

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/scryfall/autocomplete?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!ignore) setSuggestionData({ query, items: data });
      } catch {
        if (!ignore) setSuggestionData({ query, items: [] });
      }
    }, 300);

    // Función de limpieza: se ejecuta antes de la siguiente búsqueda
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query, canSuggest, token]);

  function handleNameChange(event) {
    setName(event.target.value);
    setSelectedName("");
    setPreview(null);
    setMessage(null);
  }

  async function selectSuggestion(suggestion) {
    setName(suggestion);
    setSelectedName(suggestion);

    // Pedimos la carta completa para enseñar su imagen
    try {
      const response = await fetch(
        `/api/scryfall/search?name=${encodeURIComponent(suggestion)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) setPreview(await response.json());
    } catch {
      setPreview(null);
    }
  }

  async function handlePhoto(event) {
    const file = event.target.files[0];
    event.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;

    setIdentifying(true);
    setMessage(null);

    try {
      // FormData es el formato para enviar archivos
      const formData = new FormData();
      formData.append("image", file);

      // No añadimos el header Content-Type: el navegador lo pone solo
      const response = await fetch("/api/identify", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo identificar la carta");
      }

      setName(data.card.name);
      setSelectedName(data.card.name);
      setPreview(data.card);
      setMessage({
        type: "ok",
        text: `Carta identificada: ${data.card.name} (confianza: ${data.confidence}). Comprueba que es la correcta.`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIdentifying(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault(); // evita que el navegador recargue la página
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price: Number(price),
          stock: Number(stock),
          condition,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo añadir la carta");
      }

      setMessage({ type: "ok", text: `${data.name} añadida a la tienda` });
      onCardAdded(); // avisa a App para que recargue la lista

      // Vaciamos el formulario
      setName("");
      setSelectedName("");
      setPreview(null);
      setPrice("");
      setStock(1);
      setCondition("NM");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2>Añadir carta</h2>

      <div className="autocomplete">
        <label>
          Nombre de la carta
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Escribe, por ejemplo: lightn"
            autoComplete="off"
            required
          />
        </label>

        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="photo-upload">
        O sube una foto de la carta
        <input
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          disabled={identifying}
        />
      </label>
      {identifying && <p>Identificando la carta con Claude...</p>}

      {preview?.imageUrl && (
        <img className="preview" src={preview.imageUrl} alt={preview.name} />
      )}

      <div className="form-row">
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
            <option value="NM">NM (casi nueva)</option>
            <option value="LP">LP (poco jugada)</option>
            <option value="MP">MP (jugada)</option>
            <option value="HP">HP (muy jugada)</option>
            <option value="DMG">DMG (dañada)</option>
          </select>
        </label>
      </div>

      <button type="submit" disabled={saving}>
        {saving ? "Guardando..." : "Añadir a la tienda"}
      </button>

      {message && (
        <p className={message.type === "ok" ? "success" : "error"}>
          {message.text}
        </p>
      )}
    </form>
  );
}

export default AddCardForm;
