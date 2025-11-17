import { Routes, Route, Navigate } from "react-router-dom";
import { SellerRegister } from "../components/seller/SellerRegister";
import  {SellerLogin}  from '../components/seller/SellerLogin';
import { SellerDashboard } from "../screens/seller/SellerDashboard";
import { SellerHome } from "../screens/seller/SellerHome";
import { SellerUploadPage } from "../screens/seller/SellerUploadPage";
import { SellerOrders } from "../screens/seller/SellerOrders";
import { SellerAnalytics } from "../screens/seller/SellerAnalytics";
import  SellerSettings  from "../screens/seller/SellerSettings";
import { SellerChatPage } from "../screens/seller/SellerChatPage";
import { SellerLayout } from "../components/seller/SellerLayout";
import { SellerAuthGuard } from "../components/seller/AuthGuard";
import { SellerReview } from "../screens/seller/SellerReview";
import { SellerVoucher } from "../screens/seller/SellerVoucher";
export function SellerRoutes() {
  return (
    <Routes>
      {/* Public seller auth pages */}
      <Route path="register" element={<SellerRegister />} />
      <Route path="login" element={<SellerLogin />} />

      {/* Shell layout for seller center (protected) */}
      <Route
        element={
          <SellerAuthGuard>
            <SellerLayout> 
              
            </SellerLayout>
          </SellerAuthGuard>
        }
      >
        <Route path="home" element={<SellerHome />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="upload" element={<SellerUploadPage />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="analytics" element={<SellerAnalytics />} />
        <Route path="settings" element={<SellerSettings />} />
        <Route path="chats" element={<SellerChatPage />} />
        <Route path="reviews" element={<SellerReview />} />
        <Route path="voucher" element={<SellerVoucher />} />
      </Route>
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}

