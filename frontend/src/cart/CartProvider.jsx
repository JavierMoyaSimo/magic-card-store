import { useState } from "react";
import { CartContext } from "./CartContext.js";

const STORAGE_KEY = "magic-store-cart";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Si el navegador no deja guardar, el carrito sigue funcionando mientras la página esté abierta
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  // Última carta añadida: la usa el aviso "Añadida al carrito"
  const [lastAdded, setLastAdded] = useState(null);

  // Cambia el carrito en pantalla y lo guarda en el navegador
  function update(nextItems) {
    setItems(nextItems);
    saveCart(nextItems);
  }

  function addItem(card) {
    const existing = items.find((item) => item.cardId === card._id);

    if (existing) {
      if (existing.quantity >= card.stock) return; // nunca más unidades que stock
      update(
        items.map((item) =>
          item.cardId === card._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                stock: card.stock,
                price: card.price,
              }
            : item,
        ),
      );
      setLastAdded({ name: card.name, key: Date.now() });
    } else if (card.stock >= 1) {
      update([
        ...items,
        {
          cardId: card._id,
          name: card.name,
          setName: card.setName,
          imageUrl: card.imageUrl,
          price: card.price,
          stock: card.stock,
          quantity: 1,
        },
      ]);
      setLastAdded({ name: card.name, key: Date.now() });
    }
  }

  function setQuantity(cardId, value) {
    const quantity = Math.floor(Number(value));
    if (!Number.isFinite(quantity) || quantity < 1) return;

    update(
      items.map((item) =>
        item.cardId === cardId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item,
      ),
    );
  }

  function removeItem(cardId) {
    update(items.filter((item) => item.cardId !== cardId));
  }

  function clearCart() {
    update([]);
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  // Calculamos en céntimos para evitar errores de decimales
  const total =
    items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0,
    ) / 100;

  const value = {
    items,
    count,
    total,
    lastAdded,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
