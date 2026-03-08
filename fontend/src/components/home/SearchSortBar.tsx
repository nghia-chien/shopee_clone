import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SearchSortBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  // Detect current path to determine base URL
  const pathname = location.pathname;
  const isCategory = pathname.startsWith("/category/");
  const categorySlug = isCategory ? pathname.split("/category/")[1] : null;
  const basePath = isCategory ? `/category/${categorySlug}` : "/search";

  const currentSort = params.get("sort") || "newest";
  const currentOrder = params.get("order") || "desc";

  const applySort = (sort: string, order?: "asc" | "desc") => {
    const p = new URLSearchParams(location.search);
    p.set("sort", sort);
    if (order) p.set("order", order);
    else p.delete("order");
    navigate(`${basePath}?${p.toString()}`);
  };

  const togglePrice = () => {
    if (currentSort === "price") {
      const next = currentOrder === "asc" ? "desc" : "asc";
      applySort("price", next);
    } else {
      applySort("price", "asc");
    }
  };

  return (
    <div className="bg-white rounded-sm shadow-sm mb-4">
      <div className="flex items-center gap-3 px-4 py-[20px]">
        <span className="text-gray-700 font-medium">Sắp xếp theo</span>

        <button
          className={`px-3 py-[2px] rounded 
            ${currentSort === "newest" ? "bg-orange-500 text-white" : "text-gray-700"}
          `}
          onClick={() => applySort("newest")}
        >
          Mới Nhất
        </button>

        <button
          className={`px-3 py-[2px] rounded 
            ${currentSort === "rating_desc" ? "bg-orange-500 text-white" : "text-gray-700"}
          `}
          onClick={() => applySort("rating_desc")}
        >
          Bán Chạy
        </button>

        <button
          className={`px-3 py-[2px] rounded flex items-center gap-1
            ${currentSort === "price" ? "bg-orange-500 text-white" : "text-gray-700"}
          `}
          onClick={togglePrice}
        >
          Giá
          {currentSort === "price" ? (
            currentOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          ) : (
            <ChevronDown size={16} className="opacity-40" />
          )}
        </button>
      </div>
    </div>
  );
}
