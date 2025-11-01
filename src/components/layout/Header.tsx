import React, { useState } from "react";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
    <header className="bg-gradient shadow-sm w-full">
      {/* TOP NAV BAR */}
      <nav className= "container navbar" >
        <div className="text-white text-sm  ">

          <div className="px-6 lg:px-8 py-1 flex justify-between items-center">

            <div className="flex gap-4 items-center">
              <span className="cursor-pointer hover:text-gray-200 transition"onClick={() => navigate("/seller/login")}>{t("home.seller_channel")} </span>
              
              <div className="relative group">
              <span className="cursor-pointer hover:text-gray-200 transition">{t("home.download_app")}</span>
              <div className="absolute hidden group-hover:block right-0 mt-0.5 bg-white text-black rounded shadow-md min-w-[160px] z-50">
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
              <div className="relative group">
                <span className="cursor-pointer hover:text-gray-200 transition flex items-center gap-1">
                  <span className="material-symbols-outlined text-base ">notifications
                  </span> {t("home.notification")}
                </span>
                <div className="absolute hidden group-hover:block right-0 mt-0.5 bg-white text-black rounded shadow-md min-w-[160px] z-50">
                  <div className="px-3 py-1 text-left hover:bg-gray-200 cursor-pointer">{t("home.recently_notification")}
                  </div>
                  {/*TODO thoong bao shopee */}
                  <div className="px-3 py-1 hover:bg-gray-200 cursor-pointer" onClick={() => navigate("/account")}> {t("home.see_more")}
                  </div>
                </div>
              </div>


              <span className="cursor-pointer hover:text-gray-200 transition"><span className="material-symbols-outlined text-base"> help
              </span> {t("home.support")}</span>

              {/* Language hover dropdown */}
              <div className="relative group">
                <span className="cursor-pointer hover:text-gray-200 transition">
                  <span className="material-symbols-outlined text-base">language </span> {i18n.language === "vi" ? "Tiếng Việt" : "English"}
                </span>
                <div className="absolute hidden group-hover:block right-0 mt-0.5 bg-white text-black rounded shadow-md min-w-[160px] z-50">
                  <div
                    className="px-4 py-2 text-left hover:bg-gray-200 cursor-pointer"
                    onClick={() => i18n.changeLanguage("vi")}
                  >
                    Tiếng Việt
                  </div >
                  <div
                    className="px-4 py-2 text-left hover:bg-gray-200 cursor-pointer"
                    onClick={() => i18n.changeLanguage("en")}
                  >
                    English
                  </div>
                </div>


              </div>

              {/* User hover dropdown */}
              {user ? (
                <div className="relative group">
                  <span className="cursor-pointer hover:text-gray-200">{user.name}</span>
                  <div className="absolute hidden group-hover:block right-0 mt-0.5 bg-white text-black rounded shadow-md min-w-[160px] z-50">
                    <div
                      className="px-3 py-1 text-left hover:bg-gray-200 cursor-pointer"
                      onClick={() => navigate("/account")}
                    >
                      {t("home.my_account")}
                    </div>
                    <div
                      className="px-3 py-1 text-left hover:bg-gray-200 cursor-pointer"
                      onClick={() => navigate("/orders")}
                    >
                      {t("home.my_orders")}
                    </div>
                    <div
                      className="px-3 py-1 text-left hover:bg-gray-200 cursor-pointer"
                      onClick={handleLogout}
                    >
                      {t("home.logout")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <span
                    className="cursor-pointer hover:text-gray-200"
                    onClick={() => navigate("/register")}
                  >
                    {t("home.register")}
                  </span>
                  <span>|</span>
                  <span
                    className="cursor-pointer hover:text-gray-200"
                    onClick={() => navigate("/login")}
                  >
                    {t("home.login")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN HEADER */}
      <div className="px-2 sm:px-6 lg:px-8 py-4 flex items-center gap-8">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition"
          onClick={() => navigate("/")}
        >
          <img src="/shopee_icon_w.png" alt="Cart" className="w-8 h-8 object-contain"/>
          <span className="text-3xl text-white">Shopee</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-4xl">
          <div className="relative">
            <input
              type="text"
              placeholder={t("home.search_placeholder")}
              className="w-full px-4 py-3 pr-24 bg-white focus:outline-orange focus:ring-2 focus:ring-orange-300"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              className="absolute right-1 top-1 px-4 bg-orange-600 hover:bg-orange-700 text-white transition"
              onClick={() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) handleSearch(input.value);
              }}
            >
              <svg className="w-7 h-4" fill="currentColor" viewBox="0 0 20 20">
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
