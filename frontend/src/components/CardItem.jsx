import { Link } from "react-router";
import { useCart } from "../cart/useCart.js";

function CardItem({ card, highlighted = false }) {
  const { items, addItem } = useCart();
  const inCart = items.find((item) => item.cardId === card._id)?.quantity ?? 0;
  // Lo que queda disponible para ti: el stock real menos lo que ya llevas en el carrito
  const available = Math.max(0, card.stock - inCart);

  return (
    <article
      id={`card-${card._id}`}
      className={`card${highlighted ? " highlight" : ""}`}
    >
      {/* Parte de arriba: imagen y nombre. Ambos llevan a la ficha de la carta */}
      <div className="card-top">
        {card.imageUrl && (
          <Link
            to={`/cartas/${card._id}`}
            className="card-open"
            tabIndex={-1}
            aria-hidden="true"
          >
            <img src={card.imageUrl} alt={card.name} loading="lazy" />
          </Link>
        )}
        <h3>
          <Link
            to={`/cartas/${card._id}`}
            className="card-title-button"
            title={card.name}
          >
            <span className="card-title-text">{card.name}</span>
          </Link>
        </h3>
        <p className="card-set" title={card.setName}>
          {card.setName}
        </p>
      </div>

      {/* Parte de abajo: precio, stock y botón, pegada al fondo de la tarjeta */}
      <div className="card-bottom">
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
      </div>
    </article>
  );
}

export default CardItem;
