import { useEffect, useState } from "react";
import CardList from "./components/CardList.jsx";
import AddCardForm from "./components/AddCardForm.jsx";

function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Cada vez que este número cambia, el efecto vuelve a cargar las cartas
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Evita que una respuesta antigua pise a una más reciente
    let ignore = false;

    async function loadCards() {
      try {
        const response = await fetch("/api/cards");
        if (!response.ok) {
          throw new Error("No se pudieron cargar las cartas");
        }
        const data = await response.json();
        if (!ignore) {
          setCards(data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadCards();

    // Función de limpieza: se ejecuta antes de repetir el efecto o al quitar el componente
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  function reloadCards() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="container">
      <h1>Magic Card Store</h1>
      <AddCardForm onCardAdded={reloadCards} />
      <CardList cards={cards} loading={loading} error={error} />
    </div>
  );
}

export default App;
