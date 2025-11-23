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
// import { ChatPage } from "../screens/client/ChatPage";
import  FlashSalePage  from "../screens/client/FlashSalePage";
import ScrollToTop from "../components/home/ScrollToTop";
import  {UserLayout}  from "../components/layout/UserLayout";
import {AuthGuard} from  "../components/auth/AuthGuard";
import VoucherPage from "../screens/client/VoucherPage";
import ComplaintsPage from "../screens/client/Complaints";
import { RefineApp } from "../admin/RefineApp";
export function AppRoutes() {
  return (
    <BrowserRouter>
    <ScrollToTop />
      <Routes>
        
        {/* Client routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Public pages */}
        <Route
          element={
            <AuthGuard>
              <Route path="or" element={<OrdersPage />} />
            </AuthGuard>
          }
        >
          {/* <Route path="chat" element={<ChatPage />} /> */}
          <Route path="account" element={<OrdersPage />} />
        </Route>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/flash-sale" element={<FlashSalePage />} />

        
        
        <Route path="/*" element={<RefineApp />} />
        <Route path="/category/:slug" element={<CategoryPage />} />

        <Route path="/shop/:seller_id" element={<ShopPage />} />

        {/* Seller routes */}
        <Route path="/seller/*" element={<SellerRoutes />} />
        <Route path="/search" element={<SearchResultsPage />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* account */}
        
        <Route
          element={
            <AuthGuard>
              <UserLayout/> 
            </AuthGuard>
          }
        >
          {/* <Route path="chat" element={<ChatPage />} /> */}
          <Route path="orders" element={<OrdersPage />} />
          <Route path="/account" element={<UserLayout />} />
        </Route>
        <Route path="/user" element={<UserLayout />}>           
            <Route path="orders" element={<OrdersPage />} />
            <Route path="profile" element={<AccountPage />} />
            {/* <Route path="chat" element={<ChatPage />} /> */}
            <Route path="vouchers" element={<VoucherPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            {/* {<Route path="notifications" element={<NotificationsPage />} /> */}
          </Route>
      </Routes>
    </BrowserRouter>
  );
}
