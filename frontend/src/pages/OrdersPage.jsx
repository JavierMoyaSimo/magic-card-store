import { useLocation } from "react-router";
import OrdersView from "../components/OrdersView.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function OrdersPage() {
  const { state } = useLocation();
  usePageTitle("Mis pedidos");

  return (
    <>
      {state?.orderPlaced && (
        <p className="success">
          ¡Pedido realizado con éxito! Aquí puedes ver su estado.
        </p>
      )}
      <OrdersView />
    </>
  );
}

export default OrdersPage;
