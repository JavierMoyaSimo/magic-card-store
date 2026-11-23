import CardItem from "./CardItem.jsx";

function CardList({
  cards,
  loading,
  error,
  waking,
  hasFilters,
  highlightId,
  onChanged,
  onRetry,
}) {
  if (loading) {
    return waking ? (
      <div className="notice-box" role="status">
        <span className="spinner" aria-hidden="true" />
        <div>
          <p>
            <strong>El servidor se está despertando…</strong>
          </p>
          <p className="hint">
            Esta demostración usa un plan gratuito que se duerme tras un rato
            sin uso. La primera carga puede tardar hasta un minuto. Reintentamos
            automáticamente.
          </p>
        </div>
      </div>
    ) : (
      <p>Cargando cartas...</p>
    );
  }

  if (error) {
    return (
      <div className="notice-box">
        <div>
          <p className="error">{error}</p>
          <button type="button" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

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
        <CardItem
          key={card._id}
          card={card}
          onChanged={onChanged}
          highlighted={card._id === highlightId}
        />
      ))}
    </div>
  );
}

export default CardList;
