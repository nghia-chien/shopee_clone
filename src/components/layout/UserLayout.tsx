import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { User, Bell, CreditCard, MapPin, Key, Settings, Package, Gift, Coins, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { useQuery } from "@tanstack/react-query";
import { getAccount } from "../../api/userapi/account";
import { Header } from "./Header";
import { Footer } from "./Footer";
export function UserLayout() {
  const navigate = useNavigate();
  const { token, logout, user: storeUser } = useAuthStore();

  // Fetch user data if not in store
  const { data: userData } = useQuery({
    queryKey: ["account"],
    queryFn: getAccount,
    enabled: !!token && !storeUser,
  });

  const user = storeUser || userData;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? "bg-orange-100 text-orange-600" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      
      <Header />

      {/* Main shell */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        



        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
{/* User Info */}
  <div className="bg-white rounded-lg border p-4 mb-3 flex items-center gap-3">
    {userData?.avatar ? (
      <img
        src={userData.avatar}
        alt="Avatar"
        className="w-10 h-10 rounded-full object-cover"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
        {user?.name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    )}

    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-800">{user?.name || "User"}</span>
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-red-600"
      >
        <LogOut className="w-3 h-3" />
        Đăng xuất
      </button>
    </div>
  </div>

  {/* Navigation */}
          <div className="bg-white rounded-lg border p-3 space-y-1">
            <NavLink to="/user/profile" className={navItemClass}>
              <User className="w-4 h-4" />
              Hồ sơ
            </NavLink>
            <NavLink to="/user/notifications" className={navItemClass}>
              <Bell className="w-4 h-4" />
              Thông báo
            </NavLink>
            <NavLink to="/user/orders" className={navItemClass}>
              <Package className="w-4 h-4" />
              Đơn mua
            </NavLink>
            <NavLink to="/user/vouchers" className={navItemClass}>
              <Gift className="w-4 h-4" />
              Kho Voucher
            </NavLink>
            <NavLink to="/user/coins" className={navItemClass}>
              <Coins className="w-4 h-4" />
              Shopee Xu
            </NavLink>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 min-w-0">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
