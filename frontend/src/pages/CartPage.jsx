import { useNavigate, useOutletContext } from "react-router";
import CartView from "../components/CartView.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function CartPage() {
  const navigate = useNavigate();
  // El diseño común le pasa la función para abrir la ventana de inicio de sesión
  const { openLogin } = useOutletContext();
  usePageTitle("Carrito");

  return (
    <CartView
      // useNavigate permite navegar desde el código; state viaja con la navegación
      onOrderPlaced={() =>
        navigate("/pedidos", { state: { orderPlaced: true } })
      }
      onNeedLogin={openLogin}
      onBrowse={() => navigate("/")}
    />
  );
}

export default CartPage;
