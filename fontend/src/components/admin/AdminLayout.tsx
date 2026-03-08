import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../store/AdminAuth";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Store,
  Gift,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Star,
  MessageSquare,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const menuItems = [
    // Action Management
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: AlertTriangle, label: "Khiếu nại", path: "/admin/complaints" },
    // Data Management (Refine CRUD)
    { icon: Package, label: "Sản Phẩm", path: "/admin/products" },
    { icon: FolderTree, label: "Danh Mục", path: "/admin/categories" },
    { icon: Store, label: "Sellers", path: "/admin/sellers" },
    { icon: Users, label: "Người Dùng", path: "/admin/users" },
    { icon: ShoppingCart, label: "Đơn Hàng", path: "/admin/orders" },
    { icon: Gift, label: "Voucher", path: "/admin/vouchers" },
    { icon: Star, label: "Đánh Giá", path: "/admin/reviews" },
    { icon: MessageSquare, label: "Tin Nhắn", path: "/admin/messages" },
  ];

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r shadow-lg z-50 transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center w-full" : ""}`}>
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-xs text-gray-500">Shopee Clone</p>
                  </div>
                )}
              </div>
              
              {/* Desktop collapse button */}
              {!sidebarCollapsed && (
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:block p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Thu gọn sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto ">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = window.location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      } ${sidebarCollapsed ? "justify-center" : ""}`}
                      title={sidebarCollapsed ? item.label : ""}
                    >
                      <Icon className="w-5 h-5" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t">
            {!sidebarCollapsed && (
              <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{admin?.name || "Admin"}</p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              title={sidebarCollapsed ? "Đăng xuất" : ""}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span>Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      }`}>
        {/* Top bar */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {/* Desktop collapse button when sidebar is collapsed */}
              {sidebarCollapsed && (
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Mở rộng sidebar"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{admin?.name || "Admin"}</p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}