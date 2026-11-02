import CardItem from "./CardItem.jsx";

function CardList({ cards, loading, error, search, onChanged }) {
  if (loading) return <p>Cargando cartas...</p>;
  if (error) return <p className="error">{error}</p>;

  if (cards.length === 0) {
    return search.trim() ? (
      <p>No hay cartas que coincidan con "{search}".</p>
    ) : (
      <p>Todavía no hay cartas en la tienda.</p>
    );
  }

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <CardItem key={card._id} card={card} onChanged={onChanged} />
      ))}
    </div>
  );
}

export default CardList;
