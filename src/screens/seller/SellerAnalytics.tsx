import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { getSellerStats, getSellerAnalytics } from "../../api/sellerOrders";
import { TrendingUp, DollarSign, ShoppingBag, Package, BarChart3, Calendar } from "lucide-react";

interface Stats {
  totalOrders: number;
  totalItemsSold: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  recentOrders: Array<{
    order_id: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
    status: string;
    created_at: string;
  }>;
}

interface Analytics {
  dailyStats: Array<{
    date: string;
    revenue: number;
    orders: number;
    items: number;
  }>;
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
}

export const SellerAnalytics = () => {
  const navigate = useNavigate();
  const { token } = useSellerAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!token) {
      navigate("/seller/login");
      return;
    }
    loadData();
  }, [token, navigate, days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, analyticsData] = await Promise.all([
        getSellerStats(token!),
        getSellerAnalytics(token!, days),
      ]);
      setStats(statsData.stats);
      setAnalytics(analyticsData.analytics);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Phân Tích & Thống Kê</h1>
              <p className="mt-1 text-sm text-gray-500">Báo cáo chi tiết về hoạt động bán hàng</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value={7}>7 ngày qua</option>
                <option value={30}>30 ngày qua</option>
                <option value={90}>90 ngày qua</option>
                <option value={365}>1 năm qua</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Tổng Đơn</p>
                  <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </div>
                <ShoppingBag className="w-12 h-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Đã Bán</p>
                  <p className="text-3xl font-bold">{stats.totalItemsSold}</p>
                </div>
                <Package className="w-12 h-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium mb-1">Doanh Thu</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(stats.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Đang Xử Lý</p>
                  <p className="text-3xl font-bold">{stats.pendingOrders}</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium mb-1">Hoàn Thành</p>
                  <p className="text-3xl font-bold">{stats.completedOrders}</p>
                </div>
                <BarChart3 className="w-12 h-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Đã Hủy</p>
                  <p className="text-3xl font-bold">{stats.cancelledOrders}</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-80 rotate-180" />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Chart */}
        {analytics && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Biểu Đồ Doanh Thu</h2>
            <div className="space-y-4">
              {analytics.dailyStats.length > 0 ? (
                <div className="space-y-2">
                  {analytics.dailyStats.map((day, index) => {
                    const maxRevenue = Math.max(...analytics.dailyStats.map(d => d.revenue));
                    const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-gray-600">
                          {new Date(day.date).toLocaleDateString("vi-VN", { 
                            month: "short", 
                            day: "numeric" 
                          })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-8 bg-blue-500 rounded flex items-center justify-end pr-2" style={{ width: `${percentage}%`, minWidth: "20px" }}>
                              {percentage > 10 && (
                                <span className="text-white text-xs font-medium">
                                  {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                    maximumFractionDigits: 0,
                                  }).format(day.revenue)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Đơn: {day.orders}</span>
                            <span>SP: {day.items}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Chưa có dữ liệu trong khoảng thời gian này</p>
              )}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {stats && stats.recentOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Đơn Hàng Gần Đây</h2>
            <div className="space-y-3">
              {stats.recentOrders.map((order, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{order.productName}</p>
                    <p className="text-sm text-gray-500">
                      SL: {order.quantity} | Đơn: #{order.order_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(order.total)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

