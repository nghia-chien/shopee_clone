import React, { useState } from "react";
import { User, Mail, Lock, Phone, Store, Truck, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerSeller } from "../../api/sellerapi/seller";

export const SellerRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || !password || !phone_number) {
      setError("Vui lòng nhập đầy đủ thông tin");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    const res = await registerSeller(name, email, password, phone_number);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    localStorage.setItem("sellerToken", res.token);
    navigate("/seller/home");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-[#ffede5] via-[#fff5f2] to-white border-r px-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#ffe3da] flex items-center justify-center">
            <img src="/shopee_icon_o.png" alt="logo" className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#ee4d2d]">Shopee Seller Center</h2>
            <p className="text-sm text-gray-600">Đồng hành phát triển cùng nhà bán</p>
          </div>
        </div>
        <ul className="space-y-4 text-gray-700">
          <li className="flex items-center gap-3"><Store className="w-5 h-5 text-[#ee4d2d]" /> Quản lý sản phẩm, kho hàng dễ dàng</li>
          <li className="flex items-center gap-3"><Truck className="w-5 h-5 text-[#ee4d2d]" /> Đồng bộ vận chuyển nhanh chóng</li>
          <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-[#ee4d2d]" /> Bảo mật và an toàn giao dịch</li>
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-[#f5f5f5] p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <img src="/shopee_icon_o.png" className="w-6 h-6" />
              <span className="text-[#ee4d2d] font-semibold">Seller Center</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">Đăng ký tài khoản</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#ee4d2d] focus:border-transparent"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#ee4d2d] focus:border-transparent"
                    placeholder="seller@example.com"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone_number}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#ee4d2d] focus:border-transparent"
                    placeholder="(+84) 912 345 678"
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-[#ee4d2d] focus:border-transparent"
                    placeholder="Ít nhất 6 ký tự"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ee4d2d] hover:bg-[#d63d20] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
              </button>

              <p className="text-sm text-gray-600 text-center">
                Đã có tài khoản?{" "}
                <Link to="/seller/login" className="text-[#ee4d2d] hover:underline font-medium">
                  Đăng nhập
                </Link>
              </p>
              <p className="text-xs text-gray-500 text-center">
                Bạn là người mua?{" "}
                <Link to="/register" className="text-[#ee4d2d] hover:underline">
                  Đăng ký người mua
                </Link>
              </p>
            </form>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            © 2025 Shopee Seller Center
          </p>
        </div>
      </div>
    </div>
  );
};
