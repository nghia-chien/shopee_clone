import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder }: SearchBarProps) {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // --- Search handler ---
  const handleSearch = (query: string, type: "product" | "shop" = "product") => {
    if (!query) return;

    if (type === "shop") {
      navigate(`/search?q=${encodeURIComponent(query)}&type=shop`);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}&type=product`);
    }

    setSearchText(query);
    setSuggestions([]);
  };

  // --- Live search with debounce ---
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchText.trim()) return setSuggestions([]);
      try {
        const res = await api<{ items: string[] }>(`/products/keywords?q=${searchText}`);
        setSuggestions(res.items);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchText]);

  // --- Click outside to close suggestions ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-[500px]" ref={searchRef}>
      <input
        type="text"
        placeholder={placeholder || "Tìm sản phẩm hoặc shop..."}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch(searchText)}
        className="w-full h-10 pl-4 pr-12 rounded-sm border border-gray-300 focus:outline-orange focus:ring-2 focus:ring-orange-300"
      />
      <button
        className="absolute inset-y-0 right-0 px-4 bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center rounded-r-sm"
        onClick={() => handleSearch(searchText)}
      >
        <span className="material-symbols-outlined">
          search
        </span>
      </button>

      {suggestions.length > 0 && (
        <ul className="text-left absolute w-full mt-1 bg-white rounded shadow max-h-60 overflow-auto z-50">
          {/* Gợi ý tìm Shop */}
          <li
            className="px-3 py-2 hover:bg-gray-200 cursor-pointer font-semibold text-orange-500"
            onClick={() => handleSearch(searchText, "shop")}
          >
            Bạn muốn tìm shop "{searchText}"?
          </li>

          {/* Keyword suggestions */}
          {suggestions.map((keyword, idx) => (
            <li
              key={idx}
              className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => handleSearch(keyword)}
            >
              {keyword}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
