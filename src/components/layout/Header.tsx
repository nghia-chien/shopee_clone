import React from "react";
import { useAuthStore } from "../../store/auth";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { exchangeSellerToken } from "../../api/seller";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

export const Header: React.FC = () => {
  const { user, token, logout } = useAuthStore();
  const setSellerAuth = useSellerAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Removed seller exchange flow in header for simpler navigation

  const handleSearch = (query: string) => {
    console.log("Search:", query);
  };

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
    <header className="bg-gradient shadow-sm w-full overflow-visible z-50 relative">
      {/* TOP NAV BAR */}
      <nav className= "container navbar w-full overflow-visible" >
        <div className="text-white text-sm overflow-visible ">

          <div className="px-6 lg:px-8 py-1 flex justify-between items-center overflow-visible">

            <div className="flex gap-4 items-center overflow-visible">
              <button className="inline-flex items-center text-white text-sm hover:text-gray-200 focus:outline-none focus:ring-0 border-none shadow-none" onClick={() => navigate('/seller/login')}>{t("home.seller_channel")}</button>
              <button className="inline-flex items-center text-white text-sm hover:text-gray-200 focus:outline-none focus:ring-0 border-none shadow-none" onClick={() => navigate('/seller/register')}>Trở Thành Người Bán</button>
              {user?.isSeller && (
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded">Đã liên kết</span>
              )}
              
              <div className="relative group">
              <button type="button" className="inline-flex items-center cursor-pointer hover:text-gray-200 transition focus:outline-none focus:ring-0">{t("home.download_app")}</button>
              <div className="absolute hidden group-hover:block right-0 top-full mt-1 bg-white text-black rounded shadow-md min-w-[160px] z-[9999]">
                {/* QR Code */}
                <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-400">QR Code</span>
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
                    <span className="material-symbols-outlined text-base ">notifications</span>
                    {t("home.notification")}
                  </button>
                  <div className="absolute hidden group-hover:block right-0 top-full mt-1 bg-white text-black rounded shadow-md min-w-[160px] z-[9999]">
                    <div className="px-3 py-1 text-left hover:bg-gray-200 cursor-pointer">{t("home.recently_notification")}</div>
                    <div className="px-3 py-1 hover:bg-gray-200 cursor-pointer" onClick={() => navigate("/account")}>{t("home.see_more")}</div>
                  </div>
                </div>
              ) : (
                <button type="button" className="inline-flex items-center gap-1 cursor-pointer hover:text-gray-200 transition focus:outline-none focus:ring-0" onClick={() => navigate('/login')}>
                  <span className="material-symbols-outlined text-base ">notifications</span>
                  {t("home.notification")}
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
                      <div
                        className="px-3 py-2 text-left hover:bg-gray-100 cursor-pointer"
                        onClick={() => navigate("/account")}
                      >
                        {t("home.my_account")}
                      </div>
                      <div
                        className="px-3 py-2 text-left hover:bg-gray-100 cursor-pointer"
                        onClick={() => navigate("/orders")}
                      >
                        {t("home.my_orders")}
                      </div>
                      <div
                        className="px-3 py-2 text-left hover:bg-gray-100 cursor-pointer text-red-600"
                        onClick={handleLogout}
                      >
                        {t("home.logout")}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-white text-orange-600 hover:bg-gray-100 text-sm focus:outline-none focus:ring-0"
                    onClick={() => navigate("/register")}
                  >
                    {t("home.register")}
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white text-sm focus:outline-none focus:ring-0"
                    onClick={() => navigate("/login")}
                  >
                    {t("home.login")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN HEADER */}
      <div className="container px-4 py-4 flex items-center gap-8">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
          onClick={() => navigate("/")}
        >
          <img src="/shopee_icon_w.png" alt="Cart" className="w-8 h-8 object-contain"/>
          <span className="text-3xl text-white">Shopee</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-[600px]">
          <div className="relative rounded-sm overflow-hidden">
            <input
              type="text"
              placeholder={t("home.search_placeholder")}
              className="w-full h-10 pl-4 pr-12 bg-white focus:outline-orange focus:ring-2 focus:ring-orange-300"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              className="absolute inset-y-0 right-0 px-4 bg-orange-600 hover:bg-orange-700 text-white transition flex items-center justify-center"
              onClick={() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) handleSearch(input.value);
              }}
              aria-label="Tìm kiếm"
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
          <img src="/cart.png" alt="Cart" className="w-8 h-8 object-contain"/>
          <span className="absolute -top-1 -right-1 bg-white text-orange-500 text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            0
          </span>
        </button>
      </div>
    </header>
  );
};
