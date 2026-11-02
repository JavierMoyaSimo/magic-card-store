import { useEffect, useState } from "react";
import CardList from "./components/CardList.jsx";
import AddCardForm from "./components/AddCardForm.jsx";

function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  // Cada vez que este número cambia, el efecto vuelve a cargar las cartas
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Evita que una respuesta antigua pise a una más reciente
    let ignore = false;

    async function loadCards() {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());

        const response = await fetch(`/api/cards?${params}`);
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

    return () => {
      ignore = true;
    };
  }, [refreshKey, search]);

  function reloadCards() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="container">
      <h1>Magic Card Store</h1>
      <AddCardForm onCardAdded={reloadCards} />

      <input
        type="search"
        className="search-input"
        placeholder="Buscar en la tienda por nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <CardList
        cards={cards}
        loading={loading}
        error={error}
        search={search}
        onChanged={reloadCards}
      />
    </div>
  );
}

export default App;
