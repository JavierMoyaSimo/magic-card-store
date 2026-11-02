function CardList({ cards, loading, error }) {
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
