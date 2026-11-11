import CardItem from "./CardItem.jsx";

function CardList({ cards, loading, error, hasFilters, onChanged }) {
  if (loading) return <p>Cargando cartas...</p>;
  if (error) return <p className="error">{error}</p>;

  if (cards.length === 0) {
    return hasFilters ? (
      <p>No hay cartas que coincidan con los filtros.</p>
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
