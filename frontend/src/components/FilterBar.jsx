import {
  COLOR_OPTIONS,
  MANA_OPTIONS,
  SORT_OPTIONS,
  TYPE_OPTIONS,
} from "../filters.js";

function FilterBar({ filters, hasFilters, onChange, onReset }) {
  // Añade el color si no estaba seleccionado, o lo quita si ya lo estaba
  function toggleColor(code) {
    const colors = filters.colors.includes(code)
      ? filters.colors.filter((current) => current !== code)
      : [...filters.colors, code];
    onChange({ colors });
  }

  return (
    <section className="filter-bar" aria-label="Filtros del catálogo">
      <input
        type="search"
        className="search-input"
        placeholder="Buscar en la tienda por nombre..."
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
      />

      <div className="filter-row">
        <label>
          Tipo
          <select
            value={filters.type}
            onChange={(e) => onChange({ type: e.target.value })}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Coste de maná
          <select
            value={filters.manaValue}
            onChange={(e) => onChange({ manaValue: e.target.value })}
          >
            {MANA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ordenar por
          <select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="color-filter">
        <span>Color</span>

        <div className="color-chips">
          {COLOR_OPTIONS.map(({ code, label }) => {
            const active = filters.colors.includes(code);
            return (
              <button
                key={code}
                type="button"
                className={`mana mana-${code}${active ? " active" : ""}`}
                aria-pressed={active}
                aria-label={label}
                title={label}
                onClick={() => toggleColor(code)}
              >
                {code}
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <button type="button" className="link-button" onClick={onReset}>
            Limpiar filtros
          </button>
        )}
      </div>
    </section>
  );
}

export default FilterBar;
