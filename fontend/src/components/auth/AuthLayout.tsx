import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PromotionalBanner } from './PromotionalBanner';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AuthLayout({ children, title = "Đăng nhập" }: AuthLayoutProps) {
  return (
    <div className=" bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 w-full">
        <div className="w-full px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
            <img src="/shopee_icon_o.png" alt="Shopee" className="w-12 h-12 object-contain" />
              <span className="text-xl font-bold text-[#ee4d2d]">Shopee</span>
              <span className="text-lg text-gray-600">{title}</span>
            </div>
            <Link to="/help" className="text-red-500 hover:text-red-600 text-sm">
              Bạn cần giúp đỡ?
            </Link>
          </div>
        </div>
      </header>


{/* Main Content */}
            <main className="flex-1 bg-[#ee4d2d]">
        <div className="w-full px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-8rem)]">
            
            {/* Left Side - Logo + Title + Slogan */}
            <div className="hidden lg:flex flex-col justify-center items-center text-center gap-4 px-4">
              <img src="/shopee_icon_w.png" alt="Shopee" className="w-32 h-32 object-contain" />
              <h1 className="text-4xl font-bold text-white">Shopee</h1>
              <p className="text-lg text-white max-w-xs">
                Nền tảng thương mại điện tử yêu thích ở Đông Nam Á và Đài Loan
              </p>
            </div>

            {/* Right Side - Form / Children */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>



{/* Footer */}
      <footer className="bg-white text-black py-12 w-full">
        <div className="w-full px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-left">
            {/* Customer Service */}
            <div>
              <h3 className="text-sm font-semibold mb-4">DỊCH VỤ KHÁCH HÀNG</h3>
              <ul className="space-y-2 text-xs">
                {[
                  "Trung Tâm Trợ Giúp Shopee",
                  "Shopee Blog",
                  "Shopee Mall",
                  "Hướng Dẫn Mua Hàng",
                  "Hướng Dẫn Bán Hàng",
                  "Shopee Xu",
                  "Đơn Hàng",
                  "Trả Hàng Hoàn Tiền",
                  "Liên Hệ Shopee",
                  "Chính Sách Bảo Hành",
                ].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-orange-500">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shopee Vietnam */}
            <div>
              <h3 className="text-sm font-semibold mb-4">SHOPEE VIỆT NAM</h3>
              <ul className="space-y-2 text-xs">
                {[
                  "Về Shopee",
                  "Tuyển Dụng",
                  "Điều Khoản Shopee",
                  "Chính Sách Bảo Mật",
                  "Shopee Mall",
                  "Kênh Người Bán",
                  "Flash Sale",
                  "Tiếp Thị Liên Kết",
                  "Liên Hệ Truyền Thông",
                ].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-orange-500">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment + Shipping in one column */}
            <div className="grid grid-cols-2 gap-8">
            {/* Payment Methods */}
            <div>
              <h3 className="text-sm font-semibold mb-4">THANH TOÁN</h3>
              <div className="flex flex-wrap gap-2">
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">VISA</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">MC</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-800">JCB</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">AE</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">SPay</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">SPayLater</span>
                </div>
              </div>
            </div>

            {/* Shipping Partners */}
            <div>
              <h3 className="text-sm font-semibold mb-4">ĐƠN VỊ VẬN CHUYỂN</h3>
              <div className="flex flex-wrap gap-2">
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">SPX</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">VT</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">J&T</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">Grab</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">Ninja</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">Be</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">Aha</span>
                </div>
              </div>
            </div>
            </div>


            {/* Follow Shopee - vertical icons with labels */}
            <div>
              <h3 className="text-sm font-semibold mb-4">THEO DÕI SHOPEE</h3>
              <div className="flex flex-col space-y-3">
                <a href="#" className="flex items-center space-x-2 hover:text-orange-500">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-xs">Facebook</span>
                </a>

                <a href="#" className="flex items-center space-x-2 hover:text-orange-500">
                  <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
                    </svg>
                  </div>
                  <span className="text-xs">Instagram</span>
                </a>

                <a href="#" className="flex items-center space-x-2 hover:text-orange-500">
                  <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z"/>
                    </svg>
                  </div>
                  <span className="text-xs">LinkedIn</span>
                </a>
              </div>
            </div>

            {/* Download App - QR and stores inline */}
            <div>
              <h3 className="text-sm font-semibold mb-4">TẢI ỨNG DỤNG SHOPEE</h3>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-600">QR</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="w-24 h-8 bg-black rounded flex items-center justify-center">
                    <span className="text-xs text-white">App Store</span>
                  </div>
                  <div className="w-24 h-8 bg-black rounded flex items-center justify-center">
                    <span className="text-xs text-white">Google Play</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-300">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs text-gray-500">
                © 2025 Shopee. Tất cả các quyền được bảo lưu.
              </p>
              <div className="mt-4 md:mt-0">
                <span className="text-xs text-gray-500 mr-4">Quốc gia & Khu vực:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Singapore",
                    "Indonesia",
                    "Thái Lan",
                    "Malaysia",
                    "Việt Nam",
                    "Philippines",
                    "Brazil",
                    "México",
                    "Colombia",
                    "Chile",
                    "Đài Loan",
                  ].map((country) => (
                    <a key={country} href="#" className="text-xs text-gray-500 hover:text-orange-500">
                      {country}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
