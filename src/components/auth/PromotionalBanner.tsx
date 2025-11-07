export function PromotionalBanner() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-16 h-16 border-2 border-yellow-400 transform rotate-45"></div>
        <div className="absolute top-20 right-20 w-12 h-12 border-2 border-yellow-400 transform rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-14 h-14 border-2 border-yellow-400 transform rotate-45"></div>
        <div className="absolute bottom-10 right-10 w-10 h-10 border-2 border-yellow-400 transform rotate-45"></div>
      </div>

      {/* Main Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15V9h4v6H8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-8">
        <div className="text-6xl font-bold mb-2">10+10</div>
        <div className="text-2xl font-bold uppercase tracking-wide">ĐẠI TIỆC THƯƠNG HIỆU</div>
      </div>

      {/* Promotional Banners */}
      <div className="space-y-4 w-full max-w-md">
        {/* Shopee VIP */}
        <div className="bg-blue-600 rounded-lg p-4 text-center">
          <div className="text-lg font-bold mb-1">Shopee VIP</div>
          <div className="text-sm font-semibold mb-1">TRIỆU PHÚ VOUCHER</div>
          <div className="text-sm">GIẢM ĐẾN 20% MỖI NGÀY</div>
        </div>

        {/* Voucher Xtra */}
        <div className="bg-orange-500 rounded-lg p-4 text-center">
          <div className="text-lg font-bold mb-1">VOUCHER XTRA</div>
          <div className="text-sm font-semibold mb-1">GIẢM ĐẾN 10 TRIỆU ĐỒNG</div>
        </div>

        {/* Shopee Mall */}
        <div className="bg-blue-600 rounded-lg p-4 text-center">
          <div className="text-lg font-bold mb-1">Shopee Mall</div>
          <div className="text-sm font-semibold">GIẢM ĐẾN 50%</div>
        </div>
      </div>

      {/* Super Fast Super Cheap Banner */}
      <div className="mt-6 bg-red-700 rounded-lg px-6 py-3">
        <div className="text-lg font-bold text-center">SIÊU NHANH SIÊU RẺ</div>
      </div>

      {/* Date Range */}
      <div className="mt-6 text-2xl font-bold">26.9 - 12.10</div>

      {/* Decorative Icons */}
      <div className="absolute top-10 left-10">
        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="absolute top-20 right-10">
        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-20 left-10">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-10 right-10">
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="absolute bottom-4 left-4 right-4 text-xs text-center opacity-75">
        (**) Xem thêm Điều Khoản & Điều Kiện Shopee...
      </div>
    </div>
  );
}