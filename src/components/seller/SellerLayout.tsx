import { PropsWithChildren } from "react";
import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import { useSellerAuthStore } from "../../store/SellerAuth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  PlusSquare,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

export function SellerLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { seller, logout } = useSellerAuthStore();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-orange-100 text-orange-600"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen w-full bg-[#f5f5f5] text-[#222]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/seller/home" className="flex items-center gap-2">
            <img src="/shopee_icon_o.png" alt="logo" className="w-6 h-6" />
            <span className="font-semibold text-[#ee4d2d]">Seller Center</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#fee2e2] flex items-center justify-center text-[#ee4d2d] font-bold">
              {seller?.name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <span className="text-sm text-gray-700">{seller?.name || "Seller"}</span>
            <button
              onClick={() => {
                logout();
                navigate("/seller/login");
              }}
              className="ml-2 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="bg-white rounded-lg border p-3 space-y-1">
            <NavLink to="/seller/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              Bảng điều khiển
            </NavLink>
            <NavLink to="/seller/orders" className={navItemClass}>
              <ShoppingBag className="w-4 h-4" />
              Đơn hàng
            </NavLink>
            <NavLink to="/seller/upload" className={navItemClass}>
              <PlusSquare className="w-4 h-4" />
              Thêm sản phẩm
            </NavLink>
            <NavLink to="/seller/analytics" className={navItemClass}>
              <BarChart3 className="w-4 h-4" />
              Phân tích
            </NavLink>
            <NavLink to="/seller/settings" className={navItemClass}>
              <Settings className="w-4 h-4" />
              Cài đặt
            </NavLink>
          </div>
          <div className="mt-4 bg-white rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="w-4 h-4 text-gray-400" />
              <span>Kho sản phẩm: quản lý ngay trong "Bảng điều khiển"</span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10 min-w-0">
          {/* Render nested routes */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}


