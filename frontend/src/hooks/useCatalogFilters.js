import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { buildParams, parseFilters } from "../filters.js";

// La dirección (?type=creature&colors=U...) es la única fuente de verdad de los filtros
export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  // Cambiar un filtro vuelve a la página 1.
  // Por defecto REEMPLAZA la entrada del historial (para no crear una por cada cambio);
  // con { push: true } añade una nueva, y así el botón Atrás vuelve al estado anterior.
  function updateFilters(changes, { push = false } = {}) {
    setSearchParams(buildParams({ ...filters, page: 1, ...changes }), {
      replace: !push,
    });
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return { filters, updateFilters, resetFilters };
}
