// Busca los símbolos entre llaves, como {2}, {U} o {W/U}
const SYMBOL_PATTERN = /\{([^}]+)\}/g;

// Elige el color del círculo según el símbolo
function symbolClass(code) {
  if (["W", "U", "B", "R", "G"].includes(code)) return `sym-${code}`;
  if (code === "C") return "sym-C";
  if (/^\d+$/.test(code)) return "sym-generic";
  return "sym-other";
}

// Recibe un texto y devuelve ese mismo texto con cada símbolo convertido en un círculo
function ManaText({ text }) {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(SYMBOL_PATTERN)) {
    // El texto normal que hay antes del símbolo
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

    parts.push(
      <span
        key={match.index}
        className={`mana-symbol ${symbolClass(match[1])}`}
        title={match[0]}
      >
        {match[1].replace("/", "")}
      </span>,
    );

    lastIndex = match.index + match[0].length;
  }

  // El texto que queda después del último símbolo
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <>{parts}</>;
}

export default ManaText;
