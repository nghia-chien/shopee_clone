import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../screens/client/HomePage";
import { ProductPage } from "../screens/client/ProductPage";
import { LoginPage } from "../screens/client/LoginPage";
import { RegisterPage } from "../screens/client/RegisterPage";
import SearchResultsPage from "../screens/client/SearchResultsPage";
import ShopPage from "../screens/client/ShopPage";
import { SellerRoutes } from "./SellerRoutes"; // import routes riêng cho seller
import { CartPage } from "../screens/client/CartPage";
import  OrdersPage  from "../screens/client/OrdersPage";
import  AccountPage  from "../screens/client/AccountPage";
import { ChatPage } from "../screens/client/ChatPage";
import ScrollToTop from "../components/home/ScrollToTop";
import { AdminRoutes } from "./AdminRoutes";
import  {UserLayout}  from "../components/layout/UserLayout";
import {AuthGuard} from  "../components/auth/AuthGuard";
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
        
        
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/category" element={<OrdersPage />} />

        <Route path="/shop/:seller_id" element={<ShopPage />} />

        {/* Seller routes */}
        <Route path="/seller/*" element={<SellerRoutes />} />
        <Route path="/search" element={<SearchResultsPage />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* account */}
        <Route path="/account" element={<UserLayout />} />
        <Route
          element={
            <AuthGuard>
              <UserLayout> 
                
              </UserLayout>
            </AuthGuard>
          }
        >
          <Route path="orders" element={<OrdersPage />} />
      </Route>
      <Route path="/user" element={<UserLayout />}>           
            <Route path="orders" element={<OrdersPage />} />
            <Route path="profile" element={<AccountPage />} />
            {/* {<Route path="notifications" element={<NotificationsPage />} /> */}
          </Route>
      </Routes>
    </BrowserRouter>
  );
}
