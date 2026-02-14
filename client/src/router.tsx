
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { HomePage } from "./pages/Home";
import { ProductDetailPage } from "./pages/ProductDetail";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { OrderSuccessPage } from "./pages/OrderSuccess";
import { NotFoundPage } from "./pages/NotFound";
import { LoginPage } from "./pages/Login";
import { SignupPage } from "./pages/Signup";
import { MyOrdersPage } from "./pages/MyOrders";
import { RequireAuth } from "./auth/RequireAuth";
import { RequireAdmin } from "./auth/RequireAdmin";
import { AdminDashboardPage } from "./pages/admin/AdminDashboard";
import { AdminOrdersPage } from "./pages/admin/AdminOrders";
import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetail";
import { AdminProductsPage } from "./pages/admin/AdminProducts";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "product/:id", element: <ProductDetailPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "my-orders", element: (
          <RequireAuth>
            <MyOrdersPage />
          </RequireAuth>
        ) },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "order/:id", element: <OrderSuccessPage /> },

      // Admin
      { path: "admin", element: (
          <RequireAdmin>
            <AdminDashboardPage />
          </RequireAdmin>
        ) },
      { path: "admin/orders", element: (
          <RequireAdmin>
            <AdminOrdersPage />
          </RequireAdmin>
        ) },
      { path: "admin/orders/:id", element: (
          <RequireAdmin>
            <AdminOrderDetailPage />
          </RequireAdmin>
        ) },
      { path: "admin/products", element: (
          <RequireAdmin>
            <AdminProductsPage />
          </RequireAdmin>
        ) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
