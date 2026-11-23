import { useEffect, useRef, useState } from "react";
import {
  COLOR_OPTIONS,
  MANA_OPTIONS,
  SORT_OPTIONS,
  TYPE_OPTIONS,
} from "../filters.js";

function FilterBar({ filters, hasFilters, onChange, onReset }) {
  // El texto del buscador se guarda aparte: así escribir es fluido y llega a la dirección con una espera
  const [searchText, setSearchText] = useState(filters.search);
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  // Guardamos la versión más reciente de onChange sin que reinicie el temporizador en cada pintado
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Si la dirección cambia por otro motivo (limpiar filtros, "Ver en el catálogo"), el campo se actualiza
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearchText(filters.search);
  }

  // Vuelca el texto a la dirección 300 ms después de que dejes de escribir
  useEffect(() => {
    if (searchText === filters.search) return;

    const timer = setTimeout(
      () => onChangeRef.current({ search: searchText }),
      300,
    );
    return () => clearTimeout(timer);
  }, [searchText, filters.search]);

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
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
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
