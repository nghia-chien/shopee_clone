import React from "react";

interface Shop {
  shop_id: string;
  shop_name: string;
  total_products: number;
  avg_rating: number ;
  logo_url?: string; // thêm logo nếu có
}

interface FeaturedShopsProps {
  shops: Shop[];
}

const FeaturedShops: React.FC<FeaturedShopsProps> = ({ shops }) => {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="space-y-4">
        {shops.map((shop) => (
          <div
            key={shop.shop_id}
            className="flex flex-col sm:flex-row items-center justify-between bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            {/* Logo + Thông tin bên trái */}
            <div className="flex items-center w-full sm:w-auto">
              {/* Logo */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden border mr-4">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={shop.shop_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    🏪
                  </div>
                )}
              </div>

              {/* Tên + badge */}
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {shop.shop_name}
                </p>
                <p className="text-sm text-gray-500">{shop.shop_name}</p>

                {/* {shop.is_mall && (
                  <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded mt-1">
                    Shopee Mall
                  </span>
                )} */}
              </div>
            </div>

            {/* Thông tin thống kê */}
            <div className="flex flex-wrap justify-end sm:justify-end text-gray-700 text-sm mt-3 sm:mt-0">
              <div className="flex items-center px-3 border-r">
                <span className="text-orange-500 font-semibold mr-1">
                  {shop.total_products.toLocaleString()}k
                </span>
                Sản Phẩm
              </div>

              <div className="flex items-center px-3 border-r">
                <span className="text-orange-500 font-semibold mr-1">
                  {shop.avg_rating.toFixed(1)}
                </span>
                Đánh Giá
              </div>
              <div className="flex items-center px-3 border-r">
                
              </div>

              {/* <div className="flex items-center px-3 border-r">
                <span className="text-orange-500 font-semibold mr-1">
                  {shop.response_rate}%
                </span>
                Tỉ Lệ Phản Hồi
              </div>

              <div className="flex items-center px-3">
                <span className="text-orange-500 font-semibold mr-1">
                  ⏱
                </span>
                {shop.response_time}
              </div> */}
            

            {/* Nút bên phải */}
            <div className="flex flex-col gap-2 mt-3 sm:mt-0">
              <button className="border text-gray-800 px-4 py-1 rounded hover:bg-gray-100 transition">
                XEM SHOP
              </button>
              <button className="border text-gray-800 px-4 py-1 rounded hover:bg-gray-100 transition">
                THEO DÕI
              </button>
            </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedShops;
