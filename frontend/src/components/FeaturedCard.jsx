import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchWithRetry } from "../api.js";

const STORAGE_KEY = "magic-store-featured";
const MAX_AGE_MS = 30 * 60 * 1000; // la carta guardada vale 30 minutos

// Comprueba que lo guardado tiene la forma esperada (podría ser antiguo o estar alterado)
function isValidCard(card) {
  return (
    card !== null &&
    typeof card === "object" &&
    typeof card._id === "string" &&
    typeof card.name === "string" &&
    typeof card.imageUrl === "string" &&
    card.imageUrl.startsWith("https://") &&
    typeof card.price === "number"
  );
}

function readCachedCard() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      saved &&
      Date.now() - saved.savedAt < MAX_AGE_MS &&
      isValidCard(saved.card)
    ) {
      return saved.card;
    }
  } catch {
    // Si no se puede leer, seguimos como si no hubiera nada guardado
  }
  return null;
}

function saveCard(card) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ card, savedAt: Date.now() }),
    );
  } catch {
    // Sin almacenamiento, la sección funciona igual, solo que sin caché
  }
}

function clearCard() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que hacer
  }
}

function FeaturedCard({ onSelect }) {
  // La carta guardada en la visita anterior se pinta al instante, sin esperar al servidor
  const [card, setCard] = useState(readCachedCard);
  // "loading": sin carta que enseñar y esperando al servidor; "ready": hay carta; "empty": no hay
  const [status, setStatus] = useState(card ? "ready" : "loading");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // Si la imagen ya estaba en la caché del navegador, se marca como cargada al instante, sin animación
  const imageRef = useCallback((element) => {
    if (element?.complete && element.naturalWidth > 0) setImageLoaded(true);
  }, []);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function loadFeatured() {
      try {
        // Si el servidor estaba dormido, reintenta en silencio hasta que despierte
        const response = await fetchWithRetry("/api/cards/featured", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Respuesta no válida");
        const data = await response.json();
        if (ignore) return;

        // La tienda no tiene cartas disponibles: ocultamos la sección y olvidamos la guardada
        if (data === null) {
          clearCard();
          setCard(null);
          setStatus("empty");
          return;
        }
        if (!isValidCard(data)) throw new Error("Datos inesperados");

        // Guardamos esta carta para la PRÓXIMA visita y descargamos ya su imagen,
        // de modo que la próxima vez esté en la caché del navegador
        saveCard(data);
        new Image().src = data.imageUrl;

        // Solo la mostramos ahora si no había ninguna: así la carta visible no cambia de golpe
        setCard((current) => current ?? data);
        setStatus("ready");
      } catch {
        if (!ignore)
          setStatus((current) => (current === "ready" ? current : "empty"));
      }
    }

    loadFeatured();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  if (status === "empty") return null;

  // Esqueleto: ocupa el mismo espacio que la sección real, para que la página no se mueva al cargar
  if (!card) {
    return (
      <section className="hero" aria-label="Carta destacada" aria-busy="true">
        <div className="hero-card-frame skeleton" />
        <div className="hero-info-skeleton">
          <span className="skeleton skeleton-line short" />
          <span className="skeleton skeleton-line title" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line button" />
        </div>
      </section>
    );
  }

  return (
    <section className="hero" aria-label="Carta destacada">
      {/* La imagen completa, sin modificar: así se ve también el artista y el copyright */}
      <div
        className={`hero-card-frame${imageLoaded || imageFailed ? "" : " skeleton"}`}
      >
        {imageFailed ? (
          <span className="hero-card-fallback">Imagen no disponible</span>
        ) : (
          <img
            ref={imageRef}
            className={`hero-card${imageLoaded ? " loaded" : ""}`}
            src={card.imageUrl}
            alt={card.name}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className="hero-info">
        <p className="eyebrow">Carta destacada</p>
        <h2>{card.name}</h2>
        <p className="hero-set">
          {card.setName} · {card.typeLine}
        </p>
        <p className="price">{card.price.toFixed(2)} €</p>
        <div className="hero-actions">
          <button type="button" onClick={() => onSelect(card)}>
            Ver en el catálogo
          </button>
          <Link to={`/cartas/${card._id}`} className="button-link">
            Ver detalle
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedCard;
