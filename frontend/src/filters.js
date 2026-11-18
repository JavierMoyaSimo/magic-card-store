export const PAGE_SIZE = 4;

export const DEFAULT_FILTERS = {
  search: "",
  type: "",
  colors: [],
  manaValue: "",
  sort: "name",
  page: 1,
};

export const TYPE_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  { value: "creature", label: "Criatura" },
  { value: "land", label: "Tierra" },
  { value: "instant", label: "Instantáneo" },
  { value: "sorcery", label: "Conjuro" },
  { value: "artifact", label: "Artefacto" },
  { value: "enchantment", label: "Encantamiento" },
  { value: "planeswalker", label: "Planeswalker" },
];

export const COLOR_OPTIONS = [
  { code: "W", label: "Blanco" },
  { code: "U", label: "Azul" },
  { code: "B", label: "Negro" },
  { code: "R", label: "Rojo" },
  { code: "G", label: "Verde" },
  { code: "C", label: "Incoloro" },
];

export const MANA_OPTIONS = [
  { value: "", label: "Cualquiera" },
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7 o más" },
];

export const SORT_OPTIONS = [
  { value: "name", label: "Nombre (A-Z)" },
  { value: "price-asc", label: "Precio: de menor a mayor" },
  { value: "price-desc", label: "Precio: de mayor a menor" },
  { value: "mana-asc", label: "Coste de maná" },
  { value: "newest", label: "Más recientes" },
];

// Convierte los filtros en parámetros de dirección (?type=creature&colors=U,B...)
// Solo incluye los que se han cambiado, para que la dirección quede limpia
export function buildParams(filters) {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.type) params.set("type", filters.type);
  if (filters.colors.length > 0) params.set("colors", filters.colors.join(","));
  if (filters.manaValue !== "") params.set("manaValue", filters.manaValue);
  if (filters.sort !== "name") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

// Lee los filtros de la dirección actual, descartando valores que no existan
export function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const page = Number.parseInt(params.get("page"), 10);
  const validColors = COLOR_OPTIONS.map((option) => option.code);

  const type = params.get("type") ?? "";
  const manaValue = params.get("manaValue") ?? "";
  const sort = params.get("sort") ?? "name";

  return {
    search: params.get("search") ?? "",
    type: TYPE_OPTIONS.some((option) => option.value === type) ? type : "",
    colors: (params.get("colors") ?? "")
      .split(",")
      .filter((code) => validColors.includes(code)),
    manaValue: MANA_OPTIONS.some((option) => option.value === manaValue)
      ? manaValue
      : "",
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : "name",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Lee el identificador de la carta de la dirección (?card=...), solo si tiene el formato de MongoDB
export function readCardIdFromUrl() {
  const id = new URLSearchParams(window.location.search).get("card");
  return id && /^[a-f0-9]{24}$/i.test(id) ? id : null;
}
