import OrdersView from "../components/OrdersView.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function AdminOrdersPage() {
  usePageTitle("Pedidos de la tienda");

  return <OrdersView admin />;
}

export default AdminOrdersPage;
