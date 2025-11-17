import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../store/AdminAuth";
import {
  Package,
  Users,
  ShoppingCart,
  Store,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { token, admin } = useAdminAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    // TODO: Fetch real stats from API
    // Simulate loading
    setTimeout(() => {
      setStats({
        totalUsers: 1250,
        totalSellers: 85,
        totalProducts: 3420,
        totalOrders: 1560,
        totalRevenue: 125000000,
        activeUsers: 890,
      });
      setLoading(false);
    }, 1000);
  }, [token, navigate]);

  const statCards = [
    {
      title: "Tổng Người Dùng",
      value: stats.totalUsers,
      icon: Users,
      color: "blue",
      change: "+12%",
    },
    {
      title: "Tổng Sellers",
      value: stats.totalSellers,
      icon: Store,
      color: "green",
      change: "+5%",
    },
    {
      title: "Tổng Sản Phẩm",
      value: stats.totalProducts,
      icon: Package,
      color: "purple",
      change: "+8%",
    },
    {
      title: "Tổng Đơn Hàng",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "orange",
      change: "+15%",
    },
    {
      title: "Doanh Thu",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(stats.totalRevenue),
      icon: DollarSign,
      color: "yellow",
      change: "+20%",
    },
    {
      title: "Người Dùng Hoạt Động",
      value: stats.activeUsers,
      icon: Activity,
      color: "pink",
      change: "+10%",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Chào mừng, <span className="font-semibold">{admin?.name || "Admin"}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-500",
            green: "bg-green-500",
            purple: "bg-purple-500",
            orange: "bg-orange-500",
            yellow: "bg-yellow-500",
            pink: "bg-pink-500",
          };
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {stat.change} so với tháng trước
                  </p>
                </div>
                <div className={`${colorClasses[stat.color as keyof typeof colorClasses]} p-4 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Thao Tác Nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/products")}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <Package className="w-6 h-6 text-gray-600 mb-2" />
            <p className="font-semibold text-gray-900">Quản Lý Sản Phẩm</p>
            <p className="text-sm text-gray-500">Xem và chỉnh sửa sản phẩm</p>
          </button>
          <button
            onClick={() => navigate("/admin/users")}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
          >
            <Users className="w-6 h-6 text-gray-600 mb-2" />
            <p className="font-semibold text-gray-900">Quản Lý Người Dùng</p>
            <p className="text-sm text-gray-500">Xem danh sách người dùng</p>
          </button>
          <button
            onClick={() => navigate("/admin/orders")}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
          >
            <ShoppingCart className="w-6 h-6 text-gray-600 mb-2" />
            <p className="font-semibold text-gray-900">Quản Lý Đơn Hàng</p>
            <p className="text-sm text-gray-500">Xem và xử lý đơn hàng</p>
          </button>
          <button
            onClick={() => navigate("/admin/analytics")}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
          >
            <TrendingUp className="w-6 h-6 text-gray-600 mb-2" />
            <p className="font-semibold text-gray-900">Thống Kê</p>
            <p className="text-sm text-gray-500">Xem báo cáo và phân tích</p>
          </button>
        </div>
      </div>
    </div>
  );
}

