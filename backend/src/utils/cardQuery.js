const CARD_TYPES = [
  "creature",
  "land",
  "instant",
  "sorcery",
  "artifact",
  "enchantment",
  "planeswalker",
];

// W blanco, U azul, B negro, R rojo, G verde, C incolora
const COLOR_CODES = ["W", "U", "B", "R", "G", "C"];

const SORTS = {
  name: { name: 1 },
  "price-asc": { price: 1, name: 1 },
  "price-desc": { price: -1, name: 1 },
  "mana-asc": { manaValue: 1, name: 1 },
  newest: { createdAt: -1 },
};

// Escapa los símbolos especiales para poder usar el texto del usuario en una búsqueda segura
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPositiveInt(value, fallback, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(number, max);
}

// Convierte los parámetros de la dirección (?type=creature&colors=U,B...) en una consulta de MongoDB
export function buildCardQuery(query = {}) {
  const { search, type, colors, manaValue, sort } = query;
  const filter = {};

  // Solo aceptamos texto: así nadie puede colar operadores de MongoDB como ?search[$ne]=
  if (typeof search === "string" && search.trim()) {
    filter.name = { $regex: escapeRegex(search.trim()), $options: "i" };
  }

  // \b marca el límite de una palabra: "land" no coincide con "Island"
  if (typeof type === "string" && CARD_TYPES.includes(type.toLowerCase())) {
    filter.typeLine = { $regex: `\\b${type.toLowerCase()}\\b`, $options: "i" };
  }

  if (typeof colors === "string") {
    const wanted = colors
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter((code) => COLOR_CODES.includes(code));

    if (wanted.length > 0) {
      const conditions = [];
      const realColors = wanted.filter((code) => code !== "C");

      if (realColors.length > 0)
        conditions.push({ colors: { $in: realColors } });
      if (wanted.includes("C")) conditions.push({ colors: { $size: 0 } });

      filter.$or = conditions;
    }
  }

  if (typeof manaValue === "string" && manaValue.trim() !== "") {
    const value = Number(manaValue);
    if (Number.isInteger(value) && value >= 0) {
      // El 7 significa "7 o más"
      filter.manaValue = value >= 7 ? { $gte: 7 } : value;
    }
  }

  const sortSpec =
    typeof sort === "string" && Object.hasOwn(SORTS, sort)
      ? SORTS[sort]
      : SORTS.name;

  return {
    filter,
    sort: sortSpec,
    page: toPositiveInt(query.page, 1, 100000),
    limit: toPositiveInt(query.limit, 12, 50),
  };
}
