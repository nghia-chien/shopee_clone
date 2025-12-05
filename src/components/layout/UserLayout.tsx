import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { User, Bell, Package, Gift, Coins, LogOut, MessageSquare, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { useQuery } from "@tanstack/react-query";
import { getAccount } from "../../api/userapi/account";
import { Header } from "./Header";
import { Footer } from "./Footer";
export function UserLayout() {
  const navigate = useNavigate();
  const { token, logout, user: storeUser } = useAuthStore();

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main shell - Fixed height calculation */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
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
              {/* <NavLink to="/user/notifications" className={navItemClass}>
                <Bell className="w-4 h-4" />
                Thông báo
              </NavLink> */}
              <NavLink to="/user/orders" className={navItemClass}>
                <Package className="w-4 h-4" />
                Đơn mua
              </NavLink>
              <NavLink to="/user/vouchers" className={navItemClass}>
                <Gift className="w-4 h-4" />
                Kho Voucher
              </NavLink>
              {/* <NavLink to="/user/coins" className={navItemClass}>
                <Coins className="w-4 h-4" />
                Shopee Xu
              </NavLink> */}
              {/* <NavLink to="/user/chat" className={navItemClass}>
                <MessageSquare className="w-4 h-4" />
                Tin nhắn
              </NavLink> */}
              <NavLink to="/user/complaints" className={navItemClass}>
                <AlertCircle className="w-4 h-4" />
                Khiếu nại
              </NavLink>
            </div>
          </aside>

          {/* Content */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
