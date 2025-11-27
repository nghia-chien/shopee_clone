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
  MessageSquare,
  Star,
  Gift,
  AlertTriangle,
  User,
  Store,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";

export function SellerLayout() {
  const navigate = useNavigate();
  const { seller, logout } = useSellerAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/seller/login");
  };

  // Đóng sidebar mobile khi resize lên desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-orange-50 text-orange-600 border border-orange-200 shadow-sm"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top bar - Modern Design */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Left side - Logo and Brand */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileSidebar}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link 
                to="/seller/dashboard" 
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className={`flex flex-col transition-all duration-300 ${
                  !isSidebarOpen && "md:opacity-0 md:absolute"
                }`}>
                  <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Seller Center
                  </span>
                  <span className="text-xs text-gray-500">Professional Dashboard</span>
                </div>
              </Link>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center gap-4">
              {/* Desktop sidebar toggle */}
              <button
                onClick={toggleSidebar}
                className="hidden md:flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>

              {/* User Profile Dropdown */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  {seller?.avatar ? (
                    <img
                      src={seller.avatar}
                      alt={seller.name || "Seller"}
                      className="w-10 h-10 rounded-full border-2 border-orange-200 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {seller?.name?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {seller?.name || "Seller Account"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {seller?.shop_mall || "Seller Store"}
                    </p>
                  </div>
                </div>

                {/* Dropdown Menu */}
                <div className="relative group">
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{seller?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{seller?.email}</p>
                    </div>
                    
                    <Link
                      to="/seller/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Thông tin tài khoản
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Modern Design với chức năng đóng mở */}
          <aside className={`
            fixed md:relative inset-y-0 left-0 z-40
            transform transition-all duration-300 ease-in-out
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isSidebarOpen ? 'w-64' : 'w-20'}
            h-[calc(100vh-120px)] md:h-auto
            flex-shrink-0
          `}>
            <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-1 overflow-y-auto">
              {/* Sidebar toggle button inside sidebar */}
              <button
                onClick={toggleSidebar}
                className="hidden md:flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 mb-2"
              >
                {isSidebarOpen ? (
                  <>
                    <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                    <span>Thu gọn</span>
                  </>
                ) : (
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                )}
              </button>

              {/* Navigation Items */}
              <NavLink 
                to="/seller/dashboard" 
                className={navItemClass}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Bảng điều khiển</span>}
              </NavLink>
              
              <NavLink 
                to="/seller/orders" 
                className={navItemClass}
              >
                <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Đơn hàng</span>}
              </NavLink>
              
              <NavLink 
                to="/seller/products" 
                className={navItemClass}

              >
                <Package className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Sản phẩm</span>}
              </NavLink>
              
              <NavLink 
                to="/seller/upload" 
                className={navItemClass}
              >
                <PlusSquare className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Thêm sản phẩm</span>}
              </NavLink>
              
              <NavLink 
                to="/seller/analytics" 
                className={navItemClass}
              >
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Phân tích</span>}
              </NavLink>
              
              <NavLink 
                to="/seller/voucher" 
                className={navItemClass}
              >
                <Gift className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Khuyến mãi</span>}
              </NavLink>
              
              
              <NavLink 
                to="/seller/chats" 
                className={navItemClass}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Tin nhắn</span>}
              </NavLink>
              
              <NavLink 
                to="/seller/reviews" 
                className={navItemClass}
              >
                <Star className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Đánh giá</span>}
              </NavLink>
              
              <NavLink 
                to="/seller/complaints" 
                className={navItemClass}

              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Khiếu nại</span>}
              </NavLink>
              
              <NavLink 
                to="/seller/settings" 
                className={navItemClass}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="truncate">Cài đặt</span>}
              </NavLink>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={`
            flex-1 min-w-0 transition-all duration-300
            ${isSidebarOpen ? 'md:ml-0' : 'md:ml-0'}
          `}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[calc(100vh-120px)]">
              {/* Render nested routes */}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}