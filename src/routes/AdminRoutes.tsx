// AdminRoutes.tsx
import { CategoryPage } from "../screens/admin/CategoryPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLogin } from "../components/admin/AdminLogin";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminGuard } from "../components/admin/AdminGuard";
import { AdminDashboard } from "../screens/admin/AdminDashboard";
import { AdminUsers } from "../screens/admin/AdminUsers";
import { AdminSellers } from "../screens/admin/AdminSellers";
import { AdminVoucher } from "../screens/admin/AdminVoucher";
import { ShopSettings } from "../screens/admin/ShopSettings";

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/*"
        element={
          <AdminGuard>
            <AdminLayout>
              <Routes>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/products" element={<div className="p-6"><h1 className="text-2xl font-bold">Quản Lý Sản Phẩm</h1><p className="text-gray-600 mt-2">Tính năng đang được phát triển...</p></div>} />
                <Route path="/sellers" element={<AdminSellers />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/orders" element={<div className="p-6"><h1 className="text-2xl font-bold">Quản Lý Đơn Hàng</h1><p className="text-gray-600 mt-2">Tính năng đang được phát triển...</p></div>} />
                <Route path="/analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Thống Kê</h1><p className="text-gray-600 mt-2">Tính năng đang được phát triển...</p></div>} />
                <Route path="/settings" element={<ShopSettings />} />
                <Route path="/vouchers" element={<AdminVoucher />} />
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </AdminGuard>
        }
      />
    </Routes>
  );
}
