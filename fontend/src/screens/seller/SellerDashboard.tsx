import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchSellerProducts } from "../../api/sellerapi/sellerProducts";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { fetchSellerComplaints } from "../../api/sellerapi/complaints";
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Plus,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  MessageSquare,
  Eye,
  Settings
} from "lucide-react";
import { getSellerAnalytics, getSellerStats } from "../../api/sellerapi/sellerOrders";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  status?: string;
  rating?: number;
  created_at?: string;
  attributes?: Record<string, any>;
}

// Utility functions
const isSameDay = (date1: Date, date2: Date) => {
  return date1.toDateString() === date2.toDateString();
};

const isWithinLastDays = (date: Date, days: number) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

function TrendChart({ points }: { points: TrendPoint[] }) {
  const maxRevenue = Math.max(...points.map((p) => p.revenue)) || 1;
  const maxOrders = Math.max(...points.map((p) => p.orders)) || 1;
  const polyPoints = points
    .map((point, index) => {
      const x =
        points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
      const y = 100 - (point.revenue / maxRevenue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <div className="flex items-center gap-6 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          Doanh thu
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          Đơn hàng
        </div>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-52">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill="url(#revenueGradient)"
          stroke="#3b82f6"
          strokeWidth="1.5"
          points={`${polyPoints} 100,100 0,100`}
        />
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          points={points
            .map((point, index) => {
              const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
              const y = 100 - (point.orders / maxOrders) * 100;
              return `${x},${y}`;
            })
            .join(" ")}
        />
      </svg>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-600">
        {points.map((point) => (
          <div key={point.label} className="flex flex-col rounded-lg border border-gray-100 p-3">
            <span className="text-xs uppercase text-gray-400">{point.label}</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(point.revenue)}
            </span>
            <span className="text-xs text-gray-500">{point.orders} đơn</span>
          </div>
        ))}
      </div>
    </div>
  );
}
type TrendPoint = {
  label: string;
  revenue: number;
  orders: number;
};
function buildDailyTrend(
  stats: Array<{ date: string; revenue: number; orders: number }>
): TrendPoint[] {
  if (!stats.length) return [];
  return stats
    .slice(-7)
    .map((day) => {
      const date = new Date(day.date);
      return {
        label: date.toLocaleDateString("vi-VN", { weekday: "short" }),
        revenue: day.revenue ?? 0,
        orders: day.orders ?? 0,
      };
    });
}

function buildWeeklyTrend(
  stats: Array<{ date: string; revenue: number; orders: number }>
): TrendPoint[] {
  if (!stats.length) return [];
  const map = new Map<
    string,
    { revenue: number; orders: number; count: number; date: Date }
  >();

  stats.forEach((day) => {
    const date = new Date(day.date);
    const key = getWeekLabel(date);
    if (!map.has(key)) {
      map.set(key, { revenue: 0, orders: 0, count: 0, date });
    }
    const bucket = map.get(key)!;
    bucket.revenue += day.revenue ?? 0;
    bucket.orders += day.orders ?? 0;
    bucket.count += 1;
  });

  return Array.from(map.entries())
    .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
    .slice(-6)
    .map(([label, value]) => ({
      label,
      revenue: value.revenue,
      orders: value.orders,
    }));
}

function getWeekLabel(date: Date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `Tuần ${weekNo}`;
}

export const SellerDashboard = () => {
  const navigate = useNavigate();
  const { token, seller } = useSellerAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendMode, setTrendMode] = useState<"week" | "day">("week");
  const shouldFetch = Boolean(token);

  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ["seller-stats", token],
    queryFn: () => getSellerStats(token!),
    enabled: shouldFetch,
    staleTime: 60_000,
  });

  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery({
    queryKey: ["seller-analytics", token],
    queryFn: () => getSellerAnalytics(token!, 30),
    enabled: shouldFetch,
    staleTime: 120_000,
  });

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery({
    queryKey: ["seller-complaints-mini", token],
    queryFn: () => fetchSellerComplaints(token!),
    enabled: shouldFetch,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!token) {
      navigate("/seller/login");
      return;
    }
    loadProducts();
  }, [token, navigate]);

  const sellerStats = statsResponse?.stats;
  const analytics = analyticsResponse?.analytics;
  const normalizedDailyStats = useMemo(() => {
    if (!analytics?.dailyStats) return [];
    return [...analytics.dailyStats].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [analytics]);

  const revenueToday = useMemo(() => {
    const today = normalizedDailyStats.find((day) => isSameDay(new Date(day.date), new Date()));
    return today?.revenue ?? 0;
  }, [normalizedDailyStats]);

  const revenueWeek = useMemo(() => {
    return normalizedDailyStats
      .filter((day) => isWithinLastDays(new Date(day.date), 7))
      .reduce((sum, day) => sum + (day.revenue ?? 0), 0);
  }, [normalizedDailyStats]);

  const pendingComplaints = useMemo(
    () => complaints.filter((c: any) => ["NEW", "IN_PROGRESS"].includes(c.status)).length,
    [complaints]
  );

  const processingOrders = useMemo(() => {
    if (!sellerStats) return 0;
    const total = sellerStats.totalOrders ?? 0;
    const done = (sellerStats.completedOrders ?? 0) + (sellerStats.cancelledOrders ?? 0);
    return Math.max(total - done, 0);
  }, [sellerStats]);

  const kpiData = {
    revenueToday,
    revenueWeek,
    pendingComplaints,
    processingOrders,
  };

  const isKpiLoading = statsLoading || analyticsLoading || complaintsLoading;

  const dailyTrendPoints = useMemo(() => buildDailyTrend(normalizedDailyStats), [normalizedDailyStats]);
  const weeklyTrendPoints = useMemo(() => buildWeeklyTrend(normalizedDailyStats), [normalizedDailyStats]);
  const trendPoints = trendMode === "day" ? dailyTrendPoints : weeklyTrendPoints;



  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchSellerProducts(token!);
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Tính toán thống kê
  const productStats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    activeProducts: products.filter(p => p.status === "active" || !p.status).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Đang tải dữ liệu...</p>
          <p className="text-sm text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">{seller?.avatar|| "s"}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Xin chào, <span className="font-semibold text-gray-800">{seller?.name || "Seller"}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/seller/settings")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigate("/seller/upload")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Thêm Sản Phẩm
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Main KPIs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              id: "today",
              label: "Doanh thu hôm nay",
              value: formatCurrency(kpiData.revenueToday),
              icon: DollarSign,
              
              trendUp: revenueToday > 0,
              gradient: "from-orange-500 to-amber-500",
              description: "So với hôm qua"
            },
            {
              id: "week",
              label: "Doanh thu tuần",
              value: formatCurrency(kpiData.revenueWeek),
              icon: TrendingUp,
              trend: "+8.2%",
              trendUp: true,
              gradient: "from-blue-500 to-cyan-500",
              description: "So với tuần trước"
            },
            {
              id: "complaints",
              label: "Khiếu nại",
              value: isKpiLoading ? "..." : kpiData.pendingComplaints.toString(),
              icon: MessageSquare,
              trend: kpiData.pendingComplaints > 0 ? "Cần xử lý" : "Tất cả OK",
              trendUp: false,
              gradient: "from-purple-500 to-fuchsia-500",
              description: "Chờ xử lý"
            },
            {
              id: "processing",
              label: "Đơn hàng",
              value: isKpiLoading ? "..." : kpiData.processingOrders.toString(),
              icon: Package,
              trend: "+5.3%",
              trendUp: true,
              gradient: "from-emerald-500 to-teal-500",
              
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{isKpiLoading ? "..." : card.value}</p>                  
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trend Chart Section - Đã thay thế Charts and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Trend Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Biểu đồ xu hướng tốc độ</h2>
                </div>
                <div className="flex items-center gap-2">
                  {(["day", "week"] as Array<"day" | "week">).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTrendMode(mode)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        trendMode === mode
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {mode === "day" ? "Theo ngày" : "Theo tuần"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                {trendPoints.length >= 2 ? (
                  <TrendChart points={trendPoints} />
                ) : (
                  <p className="text-sm text-gray-500 py-10 text-center">
                    Chưa có đủ dữ liệu để vẽ biểu đồ. Hãy quay lại sau.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tổng quan Kho hàng</h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Tổng sản phẩm",
                    value: productStats.totalProducts,
                    icon: Package,
                    color: "text-blue-600",
                    bgColor: "bg-blue-50"
                  },
                  {
                    label: "Tổng tồn kho",
                    value: productStats.totalStock,
                    icon: ShoppingBag,
                    color: "text-green-600",
                    bgColor: "bg-green-50"
                  },
                  {
                    label: "Giá trị kho",
                    value: formatCurrency(productStats.totalValue),
                    icon: DollarSign,
                    color: "text-amber-600",
                    bgColor: "bg-amber-50"
                  },
                  {
                    label: "Đang hoạt động",
                    value: productStats.activeProducts,
                    icon: Users,
                    color: "text-purple-600",
                    bgColor: "bg-purple-50"
                  },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                      </div>
                      <span className="font-bold text-gray-900">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={() => navigate("/seller/products")}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Xem tất cả sản phẩm
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Hành động nhanh</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                label: "Quản lý đơn hàng", 
                icon: Package, 
                action: () => navigate("/seller/orders"),
                color: "bg-blue-50 text-blue-600"
              },
              { 
                label: "Xem khiếu nại", 
                icon: AlertCircle, 
                action: () => navigate("/seller/complaints"),
                color: "bg-orange-50 text-orange-600"
              },
              { 
                label: "Thêm sản phẩm", 
                icon: Plus, 
                action: () => navigate("/seller/upload"),
                color: "bg-green-50 text-green-600"
              },
              { 
                label: "Xem báo cáo", 
                icon: TrendingUp, 
                action: () => navigate("/seller/analytics"),
                color: "bg-purple-50 text-purple-600"
              },
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 group"
                >
                  <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-gray-700 text-sm text-center">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Có lỗi xảy ra</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 font-bold text-lg"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
