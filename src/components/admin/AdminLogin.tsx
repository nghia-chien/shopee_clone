import React, { useState } from "react";
import { Mail, Lock, Shield, Settings, BarChart3, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from "../../store/AdminAuth";
import { loginAdmin } from "../../api/admin";

export const AdminLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAdminAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const data = await loginAdmin(email, password);
      
      if (data.error) {
        setError(data.error || "Sai email hoặc mật khẩu");
        return;
      }

      if (!data.token || !data.admin) {
        setError("Phản hồi từ server không hợp lệ");
        return;
      }

      // ✅ Lưu auth vào store
      setAuth(data.token, data.admin);

      // ✅ Redirect về trang Dashboard của admin
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Lỗi đăng nhập server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] border-r px-16 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <p className="text-sm text-blue-100">Quản trị hệ thống Shopee Clone</p>
          </div>
        </div>
        <ul className="space-y-4 text-blue-50">
          <li className="flex items-center gap-3">
            <Settings className="w-5 h-5" /> 
            Quản lý toàn bộ hệ thống
          </li>
          <li className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5" /> 
            Theo dõi thống kê và báo cáo
          </li>
          <li className="flex items-center gap-3">
            <Users className="w-5 h-5" /> 
            Quản lý người dùng và seller
          </li>
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-blue-600 font-semibold">Admin Panel</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">Đăng nhập Admin</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-6">
              © 2025 Shopee Clone Admin Panel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

