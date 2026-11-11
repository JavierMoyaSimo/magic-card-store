// Devuelve los números a mostrar: siempre la primera, la última y las vecinas de la actual.
// Entre saltos mete un hueco que se dibuja como "…"
function getPageItems(page, totalPages) {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b);

  const items = [];
  pages.forEach((number, index) => {
    if (index > 0 && number - pages[index - 1] > 1) {
      items.push(`gap-${number}`);
    }
    items.push(number);
  });
  return items;
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </button>

      {getPageItems(page, totalPages).map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            className={item === page ? "active" : ""}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="gap">
            …
          </span>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Siguiente
      </button>
    </nav>
  );
}

export default Pagination;
