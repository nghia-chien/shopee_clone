import React from "react";

export const Footer: React.FC = () => {
  return (
    
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
              <img src="/qr.png" alt="QR Code" className="w-full h-full object-cover" />
            </div>
            
            {/* App Store Buttons */}
            <div className="flex flex-col gap-2">
              <a
                href="https://shopee.vn/web"
                target="_blank"
                className="w-24 h-9 bg-white text-black rounded flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition"
              >
                App Store
              </a>

              <a
                href="https://shopee.vn/web"
                target="_blank"
                className="w-24 h-9 bg-white text-black rounded flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition"
              >
                Google Play
              </a>

              <a
                href="https://shopee.vn/web"
                target="_blank"
                className="w-24 h-9 bg-white text-black rounded flex items-center justify-center text-xs cursor-pointer hover:opacity-80 transition"
              >
                AppGallery
              </a>
            </div>

          </div>
        </div>
      </div>
      
      {/* Footer Bottom - Copyright and Legal */}
      <div className="border-t pt-6">
        {/* Region/Country Selector */}
        <div className="flex justify-center gap-4 mb-4 text-xs text-gray-500">
  <a
    href="/"
    className="hover:text-orange-500 cursor-pointer"
  >
    Shopee Việt Nam
  </a>

  <span>|</span>

  <a
    href="https://shopee.sg/"
    target="_blank"
    className="hover:text-orange-500 cursor-pointer"
  >
    Shopee Singapore
  </a>

  <span>|</span>

  <a
    href="https://shopee.com.my/"
    target="_blank"
    className="hover:text-orange-500 cursor-pointer"
  >
    Shopee Malaysia
  </a>

  <span>|</span>

  <a
    href="https://shopee.co.th/"
    target="_blank"
    className="hover:text-orange-500 cursor-pointer"
  >
    Shopee Thailand
  </a>
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

  );
};
