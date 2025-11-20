import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/auth";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { exchangeSellerToken } from "../../api/sellerapi/seller";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/userapi/client"; // hoặc hàm gọi fetch riêng bạn dùng
import  SearchBar  from "../home/SearchBar";

interface Product {
  id: string;
  title: string;
  price: number;
  images?: string[];
  seller?: { id: string; name: string }; // Thêm seller
}


export const Header: React.FC = () => {
  const { user, token, logout } = useAuthStore();
  const setSellerAuth = useSellerAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(9);
  
  // --- Search states ---
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
// --- Responsive keyword visibility ---
  useEffect(() => {
  const updateCount = () => {
    if (window.innerWidth < 560) setVisibleCount(0);  
    else if (window.innerWidth < 750) setVisibleCount(3);     // sm
    else if (window.innerWidth < 1024) setVisibleCount(5);
    else if (window.innerWidth < 1245) setVisibleCount(7); // md
    else setVisibleCount(9);                              // lg+
  };

    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

// --- Cart count ---
  const { data: cartCount = 0 } = useQuery({
      queryKey: ["cart-count"],
      queryFn: async () => {
        if (!token) return 0;
        const res = await api<{ count: number }>("/cart/count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.count;
      },
      enabled: !!token,
    });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Removed seller exchange flow in header for simpler navigation

  const handleSearch = (query: string, sellerId?: string) => {
  if (!query) return;

  if (sellerId) {
    // Nếu có sellerId => navigate đến shop page
    navigate(`/shop/${sellerId}`);
  } else {
    // Nếu không => navigate đến trang search sản phẩm
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  setSuggestions([]);
  setSearchText(query);
};


  // --- Live search with debounce ---
  useEffect(() => {
  const handler = setTimeout(async () => {
    if (!searchText.trim()) return setSuggestions([]);
    try {
      const res = await api<{ items: Product[] }>(`/products/search?q=${searchText}`);
      setSuggestions(res.items.slice(0, 5));
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

  const topKeywords = [
    t("home.keyword_shirt"),
    t("home.keyword_phone"),
    t("home.keyword_shoes"),
    t("home.keyword_bag"),
    t("home.keyword_headphones"),
    t("home.keyword_watch"),
    t("home.keyword_dress"),
    t("home.keyword_sandals"),
    t("home.see_more"),
    t("home.recently_notification")
  ];

  return (
    <header className="bg-gradient shadow-sm w-full overflow-visible z-50 relative py-4 md:py-3 sm:py-2">
      {/* TOP NAV BAR */}
      <nav className= "text-white text-sm md:text-xs flex items-center mx-auto  bg-transparent w-full overflow-visible -mt-3 px-3" >
            <div className="flex gap-4  overflow-visible items-center mr-auto">
              <button className="inline-flex items-center text-white text-sm hover:text-gray-200 focus:outline-none focus:ring-0 border-none shadow-none" 
                onClick={() => navigate('/seller/login')}>{t("home.seller_channel")}
              </button>             
              
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center cursor-pointer hover:text-gray-200 transition focus:outline-none focus:ring-0"
                >
                  {t("home.download_app")}
                </button>

                <div
                  className="absolute hidden group-hover:flex flex-col items-center
                            right-0 top-full mt-1 bg-white text-black 
                            border border-gray-300 rounded-lg shadow-md
                            min-w-[160px] p-3 z-[9999]"
                >

                  {/* QR Code phóng to + giữ tỉ lệ */}
                  <img
                    src="/qr.png"
                    alt="QR Code"
                    className="w-30 h-auto  rounded object-contain"
                  />

                  {/* Hai icon căn sát 2 bên bằng đúng chiều rộng QR */}
                  <div className="w-full flex items-center justify-between mt-2">
                    <img
                      src="/appstore.png"
                      alt="appstore"
                      className="w-[48%] h-auto object-contain"
                    />

                    <img
                      src="/googleplay.png"
                      alt="googleplay"
                      className="w-[48%] h-auto object-contain"
                    />
                  </div>
                </div>
              </div>


              <div className="flex items-center gap-2">
                <span>{t("home.connect")}</span>
              </div>
            </div>            
            <div className="flex gap-4 items-center">
              {user ? (
                <div className="relative group">
                  <button type="button" className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-200 transition focus:outline-none focus:ring-0">
                    <span className="material-symbols-outlined text-base ">notifications</span>{t("home.notification")}
                  </button>
                  <div className="absolute hidden group-hover:block right-0 top-full mt-1 bg-white text-black rounded shadow-md min-w-[160px] z-[9999]">
                    <div className="px-3 py-1 text-left hover:bg-gray-200 cursor-pointer">{t("home.recently_notification")}</div>
                    <div className="px-3 py-1 hover:bg-gray-200 cursor-pointer" onClick={() => navigate("/account")}>{t("home.see_more")}</div>
                  </div>
                </div>
              ) : (
                <button type="button" className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-200 transition focus:outline-none focus:ring-0" 
                  onClick={() => navigate('/login')}>
                  <span className="material-symbols-outlined text-base ">notifications</span>{t("home.notification")}
                </button>
              )}
              <button className="px-3 py-1 rounded hover:bg-white/20 text-white text-sm flex items-center gap-1 focus:outline-none focus:ring-0"><span className="material-symbols-outlined text-base"> help
              </span> {t("home.support")}</button>

              {/* Language hover dropdown */}
              <div className="relative group">
                <button type="button" className="inline-flex items-center cursor-pointer hover:text-gray-200 transition focus:outline-none focus:ring-0 shadow-none focus:shadow-none">
                  <span className="material-symbols-outlined text-base">language</span>
                  <span className="ml-1">{i18n.language === "vi" ? "Tiếng Việt" : "English"}</span>
                  <span className="ml-1">▾</span>
                </button>

                {/* Dropdown: no gap to avoid mouse leaving group */}
                <div className="absolute hidden group-hover:block right-0 top-full z-[9999]">
                  <div className="relative bg-white text-black rounded-md shadow-lg border border-gray-200 min-w-[200px] w-[220px] overflow-visible">
                    <div role="button" className="w-full text-left px-4 py-2 hover:bg-gray-100 font-medium text-orange-600" onClick={() => i18n.changeLanguage("vi")}>Tiếng Việt</div>
                    <div role="button" className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => i18n.changeLanguage("en")}>English</div>
                  </div>
                </div>
              </div>

              {/* User hover dropdown */}
              {user ? (
                <div className="relative group">
                  <button type="button" className="cursor-pointer hover:text-gray-200 focus:outline-none focus:ring-0">{user.name}</button>
                  
                  {/* Dropdown: remove gap and move arrow inside */}
                  <div className="absolute hidden group-hover:block right-0 top-full z-[9999]">
                    <div className="relative bg-white text-black rounded shadow-md min-w-[180px] border border-gray-200">
                      <div className="px-3 py-2 text-left hover:bg-gray-100 cursor-pointer"
                        onClick={() => navigate("/user/profile")}>{t("home.my_account")}
                      </div>
                      <div className="px-3 py-2 text-left hover:bg-gray-100 cursor-pointer"
                        onClick={() => navigate("/orders")}>{t("home.my_orders")}
                      </div>
                      <div className="px-3 py-2 text-left hover:bg-gray-100 cursor-pointer text-red-600"
                        onClick={handleLogout}>{t("home.logout")}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded bg-white text-orange-600 hover:bg-gray-100 text-sm focus:outline-none focus:ring-0"
                    onClick={() => navigate("/register")} > {t("home.register")}
                  </button>
                  <button  className="px-3 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-sm focus:outline-none focus:ring-0"
                    onClick={() => navigate("/login")} > {t("home.login")}
                  </button>
                </div>
              )}
            </div>
      </nav>

      {/* MAIN HEADER */}
      <div className="container px-6 py-4 flex justify-between items-center gap-8">
        {/* Logo */}
        <div
          className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition -mt-3 ml-[6px]"
          onClick={() => navigate("/")}
        >
          <img src="/shopee_icon_w.png" alt="Cart" className="w-8 h-8 object-contain align-middle"/>
          <span className="text-3xl text-white">Shopee</span>
        </div>

        {/* Search */}
        <SearchBar placeholder="Tìm sản phẩm hoặc shop..." />


        {/* Cart */}
        <button
          className="relative p-2 bg-transparent hover:opacity-80 transition"
          onClick={() => navigate("/cart")}
        >
          <img src="/cart.png" alt="Cart" className="w-8 h-8 object-contain"/>
          <span className="absolute -top-1 -right-1 bg-white text-orange-500 text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {cartCount}
          </span>

        </button>
      </div>
    </header>
  );
};
