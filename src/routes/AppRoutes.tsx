import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../screens/client/HomePage";
import { ProductPage } from "../screens/client/ProductPage";
import { LoginPage } from "../screens/client/LoginPage";
import { RegisterPage } from "../screens/client/RegisterPage";
import SearchResultsPage from "../screens/client/SearchResultsPage";
import ShopPage from "../screens/client/ShopPage";
import { AdminApp } from "../admin/AdminApp";
import { AuthGuard } from "../components/auth/AuthGuard";
import { SellerRoutes } from "./SellerRoutes"; // import routes riêng cho seller
import { CartPage } from "../screens/client/CartPage";
import { OrdersPage } from "../screens/client/OrdersPage";
import ScrollToTop from "../components/home/ScrollToTop";


export function AppRoutes() {
  return (
    <BrowserRouter>
    <ScrollToTop />
      <Routes>
        
        {/* Client routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Public pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/shop/:seller_id" element={<ShopPage />} />

        {/* Seller routes */}
        <Route path="/seller/*" element={<SellerRoutes />} />
<Route path="/search" element={<SearchResultsPage />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
