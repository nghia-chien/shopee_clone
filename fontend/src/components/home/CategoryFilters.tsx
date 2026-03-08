import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface CategoryFiltersProps {
  categorySlug: string;
}

export default function CategoryFilters({ categorySlug }: CategoryFiltersProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const [minPrice, setMinPrice] = useState(params.get("price_min") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("price_max") || "");

  const applyParam = (key: string, value?: string) => {
    const p = new URLSearchParams(location.search);
    if (!value) p.delete(key);
    else p.set(key, value);
    navigate(`/category/${categorySlug}?${p.toString()}`);
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

    navigate(`/category/${categorySlug}?${p.toString()}`);
  };

  const resetAll = () => navigate(`/category/${categorySlug}`);

  return (
    <aside className="w-64 p-4 space-y-6 h-fit">


      <h2 className="font-semibold text-lg">Bộ lọc tìm kiếm</h2>

      {/* KHOẢNG GIÁ */}
      <div className="space-y-3">
        <h3 className="font-medium">Khoảng giá</h3>

        <div className="flex items-center gap-2">
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <button
          onClick={applyPrice}
          className="w-full bg-orange-500 text-white py-1 rounded"
        >
          Áp dụng
        </button>
      </div>

      {/* ĐÁNH GIÁ */}
      <div className="space-y-2">
        <h3 className="font-medium">Đánh giá</h3>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            onClick={() => {
              const currentRating = params.get("rating");
              applyParam("rating", currentRating === String(s) ? "" : String(s));
            }}
            className={`block text-sm hover:underline ${
              params.get("rating") === String(s) 
                ? "text-orange-500 font-semibold" 
                : "text-blue-600"
            }`}
          >
            Từ {s} sao {params.get("rating") === String(s) && "✓"}
          </button>
        ))}
      </div>

      {/* DỊCH VỤ & KHUYẾN MÃI */}
      <div className="space-y-2">
        <h3 className="font-medium">Dịch vụ & khuyến mãi</h3>

        {[
          { key: "voucher_product", label: "Sản phẩm có voucher riêng" },
          { key: "voucher_platform", label: "Sản phẩm có voucher chung" },
          { key: "voucher_saved", label: "Sản phẩm có voucher shop đã lưu" },
        ].map((opt) => (
          <label key={opt.key} className="flex gap-2 items-center text-sm">
            <input
              type="checkbox"
              checked={params.get(opt.key) === "1"}
              onChange={() =>
                applyParam(opt.key, params.get(opt.key) === "1" ? "" : "1")
              }
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* LOẠI SHOP */}
      <div className="space-y-2">
        <h3 className="font-medium">Loại shop</h3>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="shopType"
            checked={params.get("shop_type") === "mall"}
            onChange={() => applyParam("shop_type", "mall")}
          />
          Shopee Mall
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="shopType"
            checked={params.get("shop_type") === "like"}
            onChange={() => applyParam("shop_type", "like")}
          />
          Shop Yêu thích+
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="shopType"
            checked={!params.get("shop_type") || params.get("shop_type") === ""}
            onChange={() => applyParam("shop_type", "")}
          />
          Tất cả
        </label>
      </div>

      {/* XÓA TẤT CẢ */}
      <button
        className="w-full border border-gray-400 py-1 rounded text-sm"
        onClick={resetAll}
      >
        Xóa tất cả
      </button>
    </aside>
  );
}

