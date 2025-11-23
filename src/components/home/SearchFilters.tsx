import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SearchFilters() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const [minPrice, setMinPrice] = useState(params.get("price_min") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("price_max") || "");

  const applyParam = (key: string, value?: string) => {
    const p = new URLSearchParams(location.search);
    if (!value) p.delete(key);
    else p.set(key, value);
    navigate(`/search?${p.toString()}`);
  };

  const applyPrice = () => {
    const p = new URLSearchParams(location.search);
    const min = minPrice.trim();
    const max = maxPrice.trim();
    
    if (min && !isNaN(Number(min)) && Number(min) >= 0) {
      p.set("price_min", min);
    } else {
      p.delete("price_min");
    }

    if (max && !isNaN(Number(max)) && Number(max) >= 0) {
      p.set("price_max", max);
    } else {
      p.delete("price_max");
    }

    // Validate: min should be <= max
    if (min && max && Number(min) > Number(max)) {
      alert("Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa");
      return;
    }

    navigate(`/search?${p.toString()}`);
  };

  const resetAll = () => navigate(`/search?q=${params.get("q") || ""}`);

  return (
    <aside className="w-64  p-4 space-y-4 h-fit text-sm">
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <h2 className="font-medium text-base">BỘ LỌC TÌM KIẾM</h2>
      </div>
      
      {/* LOẠI SHOP */}
      <div className="space-y-2 pb-4 border-b">
        <h3 className="font-medium">Loại Shop</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={params.get("shop_type") === "mall"}
            onChange={() => applyParam("shop_type", params.get("shop_type") === "mall" ? "" : "mall")}
          />
          <span>Shopee Mall</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={params.get("shop_type") === "like"}
            onChange={() => applyParam("shop_type", params.get("shop_type") === "like" ? "" : "like")}
          />
          <span>Shop Yêu thích</span>
        </label>
      </div>

      {/* KHOẢNG GIÁ */}
      <div className="space-y-3 pb-4 border-b">
        <h3 className="font-medium">Khoảng Giá</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="border border-gray-300 rounded px-2 py-1.5 w-full text-xs"
            placeholder="đ TỪ"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            className="border border-gray-300 rounded px-2 py-1.5 w-full text-xs"
            placeholder="đ ĐẾN"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <button
          onClick={applyPrice}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded uppercase font-medium"
        >
          ÁP DỤNG
        </button>
      </div>

      {/* ĐÁNH GIÁ */}
      <div className="space-y-2 pb-4 border-b">
        <h3 className="font-medium">Đánh Giá</h3>
        {[5, 4, 3, 2, 1, 0].map((s) => (
          <button
            key={s}
            onClick={() => {
              const currentRating = params.get("rating");
              applyParam("rating", currentRating === String(s) ? "" : String(s));
            }}
            className="flex items-center gap-1 w-full hover:text-orange-500"
          >
            {[...Array(s)].map((_, i) => (
              <span key={i} className="text-yellow-400">★</span>
            ))}
            {[...Array(5-s)].map((_, i) => (
              <span key={i} className="text-gray-300">★</span>
            ))}
            <span className="ml-1 text-xs">trở lên</span>
          </button>
        ))}
        <button className="text-blue-600 hover:underline">Thêm ›</button>
      </div>

      {/* DỊCH VỤ & KHUYẾN MÃI */}
      <div className="space-y-2 pb-4 border-b">
        <h3 className="font-medium">Dịch Vụ & Khuyến Mãi</h3>
        {[
          { key: "voucher_product", label: "Đang Flash Sale" },
          { key: "voucher_platform", label: "Hàng có sẵn" },
          { key: "voucher_saved", label: "Bạn có shop voucher" },
          { key: "voucher_gi_cung_re", label: "Gì Cũng Rẻ" },
        ].map((opt) => (
          <label key={opt.key} className="flex gap-2 items-center">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={params.get(opt.key) === "1"}
              onChange={() =>
                applyParam(opt.key, params.get(opt.key) === "1" ? "" : "1")
              }
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* XÓA TẤT CẢ */}
      <button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded uppercase font-medium"
        onClick={resetAll}
      >
        XÓA TẤT CẢ
      </button>
    </aside>
  );
}
