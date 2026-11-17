import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon } from "./Icons.jsx";

function CartToast({ name, onViewCart }) {
  const [visible, setVisible] = useState(true);

  // Se oculta solo a los 3,5 segundos
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  // createPortal lo dibuja directamente dentro de <body>, fuera del resto de la página:
  // así ningún contenedor ni el pie pueden afectar a su posición
  return createPortal(
    <div className="toast" role="status">
      <CheckIcon size={18} />
      <span>
        <strong>{name}</strong> añadida al carrito
      </span>
      <button
        type="button"
        className="toast-action"
        onClick={() => {
          setVisible(false);
          onViewCart();
        }}
      >
        Ver carrito
      </button>
    </div>,
    document.body,
  );
}

export default CartToast;
