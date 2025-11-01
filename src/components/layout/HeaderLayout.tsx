import type { ReactNode } from "react";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";


interface HomeLayoutProps {
  children?: ReactNode;
}

export function HeaderLayout({ children }: HomeLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = (query: string) => {
    // TODO: Implement search functionality
    // Navigate to /search?q={query}
    console.log("Search:", query);
  };

  const topKeywords = [
    "Áo thun nam", "Điện thoại Samsung", "Giày sneaker", "Túi xách nữ", 
    "Tai nghe bluetooth", "Đồng hồ thông minh", "Váy đầm công sở", "Dép sandal"
  ];





  return (
    <div className="bg-gray-50 ">
      {/* ========================================================================
          HEADER SECTION
          TODO: Extract to separate component <ShopeeHeader />
          - Add sticky header on scroll
          - Add search suggestions dropdown
          - Add cart item count from global state
          - Add notification dropdown
      ======================================================================== */}
      {/* ========================================================================
        HEADER SECTION - Full Width Version
        TODO: Extract <ShopeeHeader />
      ========================================================================= */}
      <header className="bg-gradient shadow-sm w-full">
        {/* TOP BAR */}
        <div className="text-white text-xs">
          <div className="px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
            {/* Left links */}
            <div className="flex gap-4 items-center">
              <span className="cursor-pointer hover:text-gray-200 transition">Kênh Người Bán</span>
              <span className="cursor-pointer hover:text-gray-200 transition">Tải ứng dụng</span>
              <div className="flex items-center gap-2">
                <span>Kết nối</span>
                {/* TODO: Social media icons */}
              </div>
            </div>

            {/* Right menu */}
            <div className="flex gap-4 items-center">
              <span className="cursor-pointer hover:text-gray-200 transition flex items-center gap-1">
                🔔 Thông báo
              </span>
              <span className="cursor-pointer hover:text-gray-200 transition">
                ❓ Hỗ trợ
              </span>
              <span className="cursor-pointer hover:text-gray-200 transition">
                🌐 Tiếng Việt
              </span>

              {user ? (
                <div className="flex items-center gap-2">
                  <span className="cursor-pointer hover:text-gray-200">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-xs underline hover:text-gray-200"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <span
                    className="cursor-pointer hover:text-gray-200"
                    onClick={() => navigate("/register")}
                  >
                    Đăng ký
                  </span>
                  <span>|</span>
                  <span
                    className="cursor-pointer hover:text-gray-200"
                    onClick={() => navigate("/login")}
                  >
                    Đăng nhập
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN HEADER */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-8">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
            onClick={() => navigate("/")}
          >
            <img src="/shopee_icon_w.png" alt="Cart"className="w-8 h-8 object-contain"/>
            <span className="text-3xl text-white">Shopee</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-3xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Shopee bao ship 0Đ - Đăng ký ngay!"
                className="w-full px-4 py-3 pr-24 bg-white  focus:outline-orange focus:ring-2 focus:ring-orange-300"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button
                className="absolute right-1 top-1  px-4 bg-orange-600 hover:bg-orange-700 text-white  transition"
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) handleSearch(input.value);
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {/* Keywords */}
            <div className="flex gap-3 mt-2 text-xs text-white flex-wrap">
              {topKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="cursor-pointer hover:text-gray-200 transition"
                  onClick={() => handleSearch(keyword)}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Cart */}
          <button
            className="relative p-2 bg-transparent hover:opacity-80 transition"
            onClick={() => navigate("/cart")}
          >
            {/* Cart image */}
            <img src="/cart.png" alt="Cart"className="w-8 h-8 object-contain"/>
            {/* Badge số lượng */}
            <span className="absolute -top-1 -right-1 bg-white text-orange-500 text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              0
            </span>
          </button>
                                    
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6"></main>
      <footer className="bg-white border-t mt-12">
    <div className="max-w-7xl mx-auto px-4 py-8">
            {/* ========================================================================
          FOOTER SECTION
          TODO: 
          - Extract to separate component <ShopeeFooter />
          - Add real links to all footer items
          - Add payment method icons
          - Add app download QR codes
          - Add social media links
          - Add business registration info
          - Add copyright and legal info
      ======================================================================== */}
      {/* Main Footer Content - 5 columns */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
        
        {/* Column 1 - Customer Care */}
        <div>
          <h3 className="font-bold mb-4 text-sm text-gray-800">
            CHĂM SÓC KHÁCH HÀNG
          </h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="hover:text-orange-500 cursor-pointer transition">
              Trung Tâm Trợ Giúp
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Shopee Blog
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Shopee Mall
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Hướng Dẫn Mua Hàng
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Hướng Dẫn Bán Hàng
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Thanh Toán
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Shopee Xu
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Vận Chuyển
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Trả Hàng & Hoàn Tiền
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Chăm Sóc Khách Hàng
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Chính Sách Bảo Hành
            </li>
          </ul>
        </div>
        
        {/* Column 2 - About Shopee */}
        <div>
          <h3 className="font-bold mb-4 text-sm text-gray-800">
            VỀ SHOPEE
          </h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="hover:text-orange-500 cursor-pointer transition">
              Giới Thiệu Về Shopee Việt Nam
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Tuyển Dụng
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Điều Khoản Shopee
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Chính Sách Bảo Mật
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Chính Hãng
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Kênh Người Bán
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Flash Sales
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Chương Trình Tiếp Thị Liên Kết
            </li>
            <li className="hover:text-orange-500 cursor-pointer transition">
              Liên Hệ Với Truyền Thông
            </li>
          </ul>
        </div>
        
        {/* Column 3 - Payment Methods */}
        <div>
          <h3 className="font-bold mb-4 text-sm text-gray-800">
            THANH TOÁN
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {/* TODO: Add real payment method logos */}
            {["VISA", "Master", "JCB", "COD", "Shopee", "Momo"].map((method, i) => (
              <div 
                key={i}
                className="h-8 bg-white border border-gray-200 rounded flex items-center justify-center text-xs font-semibold text-gray-600 hover:border-orange-500 transition"
              >
                {method}
              </div>
            ))}
          </div>
          
          <h3 className="font-bold mb-4 text-sm text-gray-800">
            ĐƠN VỊ VẬN CHUYỂN
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {/* TODO: Add real shipping partner logos */}
            {["Shopee", "Giao Hàng", "Nhanh", "Viettel", "VN Post", "J&T"].map((shipper, i) => (
              <div 
                key={i}
                className="h-8 bg-white border border-gray-200 rounded flex items-center justify-center text-xs font-semibold text-gray-600 hover:border-orange-500 transition"
              >
                {shipper}
              </div>
            ))}
          </div>
        </div>
        
        {/* Column 4 - Follow Us */}
        <div>
          <h3 className="font-bold mb-4 text-sm text-gray-800">
            THEO DÕI CHÚNG TÔI TRÊN
          </h3>
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-center gap-2 hover:text-orange-500 cursor-pointer transition">
              <span>📘</span> Facebook
            </li>
            <li className="flex items-center gap-2 hover:text-orange-500 cursor-pointer transition">
              <span>📷</span> Instagram
            </li>
            <li className="flex items-center gap-2 hover:text-orange-500 cursor-pointer transition">
              <span>💼</span> LinkedIn
            </li>
          </ul>
        </div>
        
        {/* Column 5 - App Download */}
        <div>
          <h3 className="font-bold mb-4 text-sm text-gray-800">
            TẢI ỨNG DỤNG SHOPEE NGAY THÔI
          </h3>
          <div className="flex gap-2 mb-4">
            {/* QR Code */}
            <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
              <span className="text-xs text-gray-400">QR Code</span>
            </div>
            
            {/* App Store Buttons */}
            <div className="flex flex-col gap-2">
              <div className="w-24 h-9 bg-black text-white rounded flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition">
                App Store
              </div>
              <div className="w-24 h-9 bg-black text-white rounded flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition">
                Google Play
              </div>
              <div className="w-24 h-9 bg-black text-white rounded flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition">
                AppGallery
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Bottom - Copyright and Legal */}
      <div className="border-t pt-6">
        {/* Region/Country Selector */}
        <div className="flex justify-center gap-4 mb-4 text-xs text-gray-500">
          <span className="hover:text-orange-500 cursor-pointer">
            Shopee Việt Nam
          </span>
          <span>|</span>
          <span className="hover:text-orange-500 cursor-pointer">
            Shopee Singapore
          </span>
          <span>|</span>
          <span className="hover:text-orange-500 cursor-pointer">
            Shopee Malaysia
          </span>
          <span>|</span>
          <span className="hover:text-orange-500 cursor-pointer">
            Shopee Thailand
          </span>
        </div>
        
        {/* Copyright Notice */}
        <div className="text-center text-xs text-gray-500 mb-2">
          <p>© 2025 Shopee. Tất cả các quyền được bảo lưu.</p>
        </div>
        
        {/* Business Registration */}
        <div className="text-center text-xs text-gray-400 mb-4">
          <p>
            Địa chỉ: Tầng 4-5-6, Tòa nhà Capital Place, số 29 đường Liễu Giai, 
            Phường Ngọc Khánh, Quận Ba Đình, Thành phố Hà Nội, Việt Nam. 
            Tổng đài hỗ trợ: 19001221 - Email: cskh@hotro.shopee.vn
          </p>
          <p className="mt-2">
            Chịu Trách Nhiệm Quản Lý Nội Dung: Nguyễn Đức Trí - 
            Điện thoại liên hệ: 024 73081221 (ext 4678)
          </p>
          <p className="mt-2">
            Mã số doanh nghiệp: 0106773786 do Sở Kế hoạch & Đầu tư TP Hà Nội cấp lần đầu ngày 10/02/2015
          </p>
        </div>
        
        {/* Certification Badges */}
        <div className="flex justify-center gap-4">
          {/* TODO: Add real certification images */}
          <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded"></div>
          <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded"></div>
          <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </footer>
      </div>
  );
}