import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { fetchWithRetry } from "../api.js";
import { useCart } from "../cart/useCart.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import ManaText from "../components/ManaText.jsx";
import NotFoundPage from "./NotFoundPage.jsx";

const RARITY_LABELS = {
  common: "Común",
  uncommon: "Poco común",
  rare: "Rara",
  mythic: "Mítica",
  special: "Especial",
  bonus: "Bonus",
};

const COLOR_NAMES = {
  W: "Blanco",
  U: "Azul",
  B: "Negro",
  R: "Rojo",
  G: "Verde",
};

const CONDITION_LABELS = {
  NM: "Casi nueva (NM)",
  LP: "Poco jugada (LP)",
  MP: "Jugada (MP)",
  HP: "Muy jugada (HP)",
  DMG: "Dañada (DMG)",
};

function colorLabel(colors) {
  if (!colors || colors.length === 0) return "Incolora";
  return colors.map((code) => COLOR_NAMES[code] ?? code).join(", ");
}

function CardPage() {
  // useParams lee la parte variable de la dirección: /cartas/:id
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, addItem } = useCart();

  // Resultado de pedir la carta, junto con el id al que corresponde
  const [result, setResult] = useState({
    id: null,
    status: "loading",
    card: null,
  });
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Un identificador de MongoDB son exactamente 24 caracteres hexadecimales
  const validId = /^[a-f0-9]{24}$/i.test(id ?? "");
  const current =
    result.id === id ? result : { id, status: "loading", card: null };
  const card = current.card;

  usePageTitle(card?.name);

  useEffect(() => {
    if (!validId) return;

    let ignore = false;
    const controller = new AbortController();

    async function loadCard() {
      try {
        const response = await fetchWithRetry(`/api/cards/${id}`, {
          signal: controller.signal,
        });
        if (ignore) return;

        if (response.status === 404) {
          setResult({ id, status: "notFound", card: null });
          return;
        }
        if (!response.ok) throw new Error("Respuesta no válida");

        const data = await response.json();
        if (!ignore) setResult({ id, status: "ready", card: data });
      } catch {
        if (!ignore) setResult({ id, status: "error", card: null });
      }
    }

    loadCard();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id, validId]);

  // El mensaje "Añadida" desaparece solo
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [added]);

  // El mensaje "Enlace copiado" desaparece solo
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  // "default" es la clave de la primera entrada del historial: si llegaste desde un enlace,
  // no hay página anterior de esta web a la que volver, y vamos al catálogo
  function goBack() {
    if (location.key !== "default") navigate(-1);
    else navigate("/");
  }

  function handleAdd() {
    addItem(card);
    setAdded(true);
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}${location.pathname}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Si el navegador no permite copiar, mostramos el enlace para copiarlo a mano
      window.prompt("Copia el enlace de la carta:", url);
    }
  }

  if (!validId || current.status === "notFound") {
    return (
      <NotFoundPage message="No encontramos esa carta. Puede que ya no esté disponible." />
    );
  }

  if (current.status === "error") {
    return (
      <section className="panel">
        <h2>No se pudo cargar la carta</h2>
        <p className="hint">Comprueba tu conexión e inténtalo de nuevo.</p>
        <button type="button" onClick={() => navigate(0)}>
          Reintentar
        </button>
      </section>
    );
  }

  if (!card) return <p>Cargando carta…</p>;

  // Lo que queda disponible para ti: el stock real menos lo que ya llevas en el carrito
  const inCart = items.find((item) => item.cardId === card._id)?.quantity ?? 0;
  const available = Math.max(0, card.stock - inCart);

  return (
    <section className="panel detail-page">
      <button type="button" className="link-button back-link" onClick={goBack}>
        ← Volver
      </button>

      <div className="detail-body">
        <div className="detail-image">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} />
          ) : (
            <div className="detail-no-image">Sin imagen</div>
          )}
        </div>

        <div className="detail-info">
          <h2>{card.name}</h2>

          {card.manaCost && (
            <p className="detail-mana">
              <ManaText text={card.manaCost} />
            </p>
          )}

          <p className="detail-type">{card.typeLine}</p>

          {card.oracleText && (
            <div className="detail-text">
              <ManaText text={card.oracleText} />
            </div>
          )}

          <dl className="detail-facts">
            <div>
              <dt>Edición</dt>
              <dd>
                {card.setName}
                {card.setCode ? ` (${card.setCode.toUpperCase()})` : ""}
              </dd>
            </div>
            <div>
              <dt>Número</dt>
              <dd>{card.collectorNumber || "—"}</dd>
            </div>
            <div>
              <dt>Rareza</dt>
              <dd>{RARITY_LABELS[card.rarity] ?? card.rarity ?? "—"}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{colorLabel(card.colors)}</dd>
            </div>
            <div>
              <dt>Coste de maná</dt>
              <dd>{card.manaValue ?? 0}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{CONDITION_LABELS[card.condition] ?? card.condition}</dd>
            </div>
          </dl>

          <div className="detail-buy">
            <p className="price">{card.price.toFixed(2)} €</p>
            <p className="card-stock">
              {card.stock > 0 ? `Disponibles: ${available}` : "Sin stock"}
              {inCart > 0 && (
                <span className="in-cart"> · {inCart} en tu carrito</span>
              )}
            </p>

            <div className="detail-actions">
              {card.stock > 0 ? (
                <button
                  type="button"
                  className="add-to-cart"
                  onClick={handleAdd}
                  disabled={available === 0}
                >
                  {added
                    ? "Añadida ✓"
                    : available === 0
                      ? "Máximo en el carrito"
                      : "Añadir al carrito"}
                </button>
              ) : (
                <p className="out-of-stock">Agotada</p>
              )}

              {inCart > 0 && (
                <Link to="/carrito" className="button-link">
                  Ver carrito
                </Link>
              )}

              <button
                type="button"
                className="secondary"
                onClick={handleCopyLink}
              >
                {copied ? "Enlace copiado ✓" : "Copiar enlace"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CardPage;
