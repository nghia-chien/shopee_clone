import { Routes, Route, Navigate } from "react-router-dom";
import { SellerRegister } from "../components/seller/SellerRegister";
import  SellerLogin  from '../components/seller/SellerLogin';
import { SellerDashboard } from "../screens/seller/SellerDashboard";
import { SellerHome } from "../screens/seller/SellerHome";
import { SellerUploadPage } from "../screens/seller/SellerUploadPage";
import { SellerAuthGuard } from "../components/seller/AuthGuard";
export function SellerRoutes() {
  return (
    <Routes>
      <Route path="home" element={<SellerHome />} />
      <Route path="register" element={<SellerRegister />} />
      <Route path="login" element={<SellerLogin />} />
      <Route path="dashboard" element={<SellerDashboard />} />
      <Route path="upload" element={<SellerUploadPage />} />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}

