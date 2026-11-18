import { useEffect, useState } from "react";
import { fetchWithRetry } from "../api.js";
import CardDetail from "./CardDetail.jsx";

function CardDetailLoader({ id, knownCard, onClose, onViewCart, onNotFound }) {
  // Resultado de pedir la carta al servidor, junto con el id al que corresponde
  const [fetched, setFetched] = useState({ id: null, card: null });
  const hasKnownCard = Boolean(knownCard);

  useEffect(() => {
    if (hasKnownCard) return; // ya la tenemos en la lista: no hace falta pedirla

    let ignore = false;
    const controller = new AbortController();

    async function loadCard() {
      try {
        const response = await fetchWithRetry(`/api/cards/${id}`, {
          signal: controller.signal,
        });
        if (ignore) return;

        if (!response.ok) {
          onNotFound();
          return;
        }

        const data = await response.json();
        if (!ignore) setFetched({ id, card: data });
      } catch {
        if (!ignore) onNotFound();
      }
    }

    loadCard();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id, hasKnownCard, onNotFound]);

  // La de la lista tiene prioridad (es la más reciente); si no, la que pedimos al servidor
  const card = knownCard ?? (fetched.id === id ? fetched.card : null);
  if (!card) return null;

  return <CardDetail card={card} onClose={onClose} onViewCart={onViewCart} />;
}

export default CardDetailLoader;
