import { useEffect, useState } from "react";

function CardList() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCards() {
      try {
        const response = await fetch("/api/cards");
        if (!response.ok) {
          throw new Error("No se pudieron cargar las cartas");
        }
        const data = await response.json();
        setCards(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCards();
  }, []);

  if (loading) return <p>Cargando cartas...</p>;
  if (error) return <p className="error">{error}</p>;
  if (cards.length === 0) return <p>Todavía no hay cartas en la tienda.</p>;

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <article key={card._id} className="card">
          {card.imageUrl && <img src={card.imageUrl} alt={card.name} />}
          <h3>{card.name}</h3>
          <p>
            {card.setName} · {card.condition}
          </p>
          <p className="price">{card.price.toFixed(2)} €</p>
          <p>Stock: {card.stock}</p>
        </article>
      ))}
    </div>
  );
}

export default CardList;
