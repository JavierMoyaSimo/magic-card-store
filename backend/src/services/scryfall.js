const BASE_URL = "https://api.scryfall.com";

// Scryfall pide identificarte (User-Agent) e indicar qué formato aceptas (Accept)
const HEADERS = {
  "User-Agent":
    "MagicCardStore/1.0 (https://github.com/JavierMoyaSimo/magic-card-store)",
  Accept: "application/json;q=0.9,*/*;q=0.8",
};

// Función auxiliar: hace la petición y lanza un error claro si algo falla
async function scryfallGet(path) {
  const response = await fetch(`${BASE_URL}${path}`, { headers: HEADERS });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.details || "Error al consultar Scryfall");
    error.status = response.status;
    throw error;
  }
  return data;
}

// Scryfall devuelve muchísimos datos; nos quedamos solo con los que necesitamos
function simplifyCard(card) {
  // Las cartas de doble cara guardan sus datos dentro de card_faces
  const firstFace = card.card_faces?.[0];

  return {
    scryfallId: card.id,
    name: card.name,
    setCode: card.set,
    setName: card.set_name,
    collectorNumber: card.collector_number,
    typeLine: card.type_line,
    manaCost: card.mana_cost ?? firstFace?.mana_cost ?? "",
    oracleText: card.oracle_text ?? firstFace?.oracle_text ?? "",
    rarity: card.rarity,
    imageUrl: card.image_uris?.normal ?? firstFace?.image_uris?.normal ?? null,
  };
}

// Busca una carta por nombre. "fuzzy" tolera errores de escritura.
export async function findCardByName(name) {
  const data = await scryfallGet(
    `/cards/named?fuzzy=${encodeURIComponent(name)}`,
  );
  return simplifyCard(data);
}

// Sugiere nombres de cartas a partir de unas letras
export async function autocompleteCardName(query) {
  const data = await scryfallGet(
    `/cards/autocomplete?q=${encodeURIComponent(query)}`,
  );
  return data.data;
}
