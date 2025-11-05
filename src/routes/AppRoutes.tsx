import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../screens/client/HomePage";
import { ProductPage } from "../screens/client/ProductPage";
import { LoginPage } from "../screens/client/LoginPage";
import { RegisterPage } from "../screens/client/RegisterPage";
import { AdminApp } from "../admin/AdminApp";
import { AuthGuard } from "../components/auth/AuthGuard";
import { SellerRoutes } from "./SellerRoutes"; // import routes riêng cho seller

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Public pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Seller routes */}
        <Route path="/seller/*" element={<SellerRoutes />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
