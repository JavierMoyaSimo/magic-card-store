import { Navigate, Route, Routes } from "react-router";
import Layout from "./layout/Layout.jsx";
import AdminLayout from "./layout/AdminLayout.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";
import RequireAdmin from "./routes/RequireAdmin.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import CardPage from "./pages/CardPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import AdminCardsPage from "./pages/AdminCardsPage.jsx";
import AdminOrdersPage from "./pages/AdminOrdersPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

function App() {
  return (
    <Routes>
      {/* Ruta de diseño: cabecera y pie comunes. Las demás se dibujan en su <Outlet /> */}
      <Route element={<Layout />}>
        <Route index element={<CatalogPage />} />
        <Route path="cartas/:id" element={<CardPage />} />
        <Route path="carrito" element={<CartPage />} />

        {/* Rutas que exigen sesión */}
        <Route element={<RequireAuth />}>
          <Route path="pedidos" element={<OrdersPage />} />

          {/* Y dentro de ellas, las que exigen además ser administrador */}
          <Route element={<RequireAdmin />}>
            {/* Rutas anidadas: AdminLayout pone el marco y sus hijas se dibujan en su <Outlet /> */}
            <Route path="admin" element={<AdminLayout />}>
              {/* Ruta índice: lo que se ve en /admin. replace evita quedar atrapado con el botón Atrás */}
              <Route index element={<Navigate to="cartas" replace />} />
              <Route path="cartas" element={<AdminCardsPage />} />
              <Route path="pedidos" element={<AdminOrdersPage />} />
            </Route>
          </Route>
        </Route>

        {/* El comodín: cualquier dirección que no coincida con las anteriores */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
