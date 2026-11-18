import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart/useCart.js";
import ManaText from "./ManaText.jsx";

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

function CardDetail({ card, onClose, onViewCart }) {
  const dialogRef = useRef(null);
  const { items, addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lo que queda disponible para ti: el stock real menos lo que ya llevas en el carrito
  const inCart = items.find((item) => item.cardId === card._id)?.quantity ?? 0;
  const available = Math.max(0, card.stock - inCart);

  // Al aparecer, se abre como ventana modal
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

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

  function closeDialog() {
    dialogRef.current?.close();
  }

  // Un clic sobre el fondo oscuro (fuera del cuadro) cierra la ventana
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) closeDialog();
  }

  function handleAdd() {
    addItem(card);
    setAdded(true);
  }

  // Enlace directo a esta carta: solo lleva su identificador, sin filtros
  const shareUrl = `${window.location.origin}${window.location.pathname}?card=${card._id}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // Si el navegador no permite copiar, mostramos el enlace para copiarlo a mano
      window.prompt("Copia el enlace de la carta:", shareUrl);
    }
  }
  return (
    <dialog
      ref={dialogRef}
      className="detail-dialog"
      aria-labelledby="detail-title"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="detail-body">
        <button
          type="button"
          className="detail-close"
          aria-label="Cerrar"
          onClick={closeDialog}
        >
          ×
        </button>

        <div className="detail-image">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} />
          ) : (
            <div className="detail-no-image">Sin imagen</div>
          )}
        </div>

        <div className="detail-info">
          <h2 id="detail-title">{card.name}</h2>

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
                <button
                  type="button"
                  className="secondary"
                  onClick={onViewCart}
                >
                  Ver carrito
                </button>
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
    </dialog>
  );
}

export default CardDetail;
