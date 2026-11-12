import { useEffect, useState } from "react";
import { apiUrl } from "../api.js";

function FeaturedCard({ onSelect }) {
  const [card, setCard] = useState(null);

  // Pide una carta al azar cuando aparece la sección
  useEffect(() => {
    let ignore = false;

    async function loadFeatured() {
      try {
        const response = await fetch(apiUrl("/api/cards/featured"));
        if (!response.ok) return;
        const data = await response.json();
        if (!ignore) setCard(data);
      } catch {
        // Si falla, simplemente no se muestra la sección
      }
    }

    loadFeatured();

    return () => {
      ignore = true;
    };
  }, []);

  if (!card) return null;

  return (
    <section className="hero" aria-label="Carta destacada">
      {/* La imagen completa, sin modificar: así se ve también el artista y el copyright */}
      <img className="hero-card" src={card.imageUrl} alt={card.name} />

      <div className="hero-info">
        <p className="eyebrow">Carta destacada</p>
        <h2>{card.name}</h2>
        <p className="hero-set">
          {card.setName} · {card.typeLine}
        </p>
        <p className="price">{card.price.toFixed(2)} €</p>
        <button type="button" onClick={() => onSelect(card)}>
          Ver en el catálogo
        </button>
      </div>
    </section>
  );
}

export default FeaturedCard;
