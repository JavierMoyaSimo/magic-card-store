import OrdersView from "../components/OrdersView.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function OrdersPage() {
  usePageTitle("Mis pedidos");

  return <OrdersView />;
}

export default OrdersPage;
