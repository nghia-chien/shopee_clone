import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../screens/client/HomePage";
import { ProductPage } from "../screens/client/ProductPage";
import { LoginPage } from "../screens/client/LoginPage";
import { RegisterPage } from "../screens/client/RegisterPage";
import SearchResultsPage from "../screens/client/SearchResultsPage";
import ShopPage from "../screens/client/ShopPage";
import { SellerRoutes } from "./SellerRoutes"; // import routes riêng cho seller
import { CartPage } from "../screens/client/CartPage";
import CheckoutPage from "../screens/client/CheckoutPage";
import  OrdersPage  from "../screens/client/OrdersPage";
import  CategoryPage  from "../screens/client/CategoryPage";
import  AccountPage  from "../screens/client/AccountPage";
import  FlashSalePage  from "../screens/client/FlashSalePage";
import ScrollToTop from "../components/home/ScrollToTop";
import  {UserLayout}  from "../components/layout/UserLayout";
import {AuthGuard} from  "../components/auth/AuthGuard";
import VoucherPage from "../screens/client/VoucherPage";
import ComplaintsPage from "../screens/client/Complaints";
import { RefineApp } from "../admin/RefineApp";
import EventPage from "../screens/client/EventPage";
import TestPage from "../screens/client/xyz";
export function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected + layout */}
        <Route
          element={
            <AuthGuard>
              <UserLayout />
            </AuthGuard>
          }
        >
          {/* Các page yêu cầu login */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* User pages */}
          <Route path="/user/profile" element={<AccountPage />} />
          <Route path="/user/vouchers" element={<VoucherPage />} />
          <Route path="/user/complaints" element={<ComplaintsPage />} />
          <Route path="/user/orders" element={<OrdersPage />} />
        </Route>

        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/shop/:seller_id" element={<ShopPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/flash-sale" element={<FlashSalePage />} />
        <Route path="/event" element={<EventPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/test" element={<TestPage />} />

        {/* Seller */}
        <Route path="/seller/*" element={<SellerRoutes />} />

        {/* Admin */}
        <Route path="/admin/*" element={<RefineApp />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

