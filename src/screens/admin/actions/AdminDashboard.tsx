import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuthStore } from "../../../store/AdminAuth";
import {
  Package,
  Users,
  ShoppingCart,
  Store,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

interface DashboardStats {
  period: 'week' | 'month';
  ordersByPeriod: { period: string; label: string; count: number }[];
  usersByPeriod: { period: string; label: string; count: number }[];
  sellersByPeriod: { period: string; label: string; count: number }[];
  topProducts: {
    product_id: string;
    product_title: string;
    product_price: number;
    product_image: string | null;
    order_count: number;
    total_quantity: number;
  }[];
}

interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { token, admin } = useAdminAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  // Chart configuration
  const chartHeight = 260;
  
  // Safe max calculation with better error handling
  const getSafeMax = (data: { count: number }[] | undefined): number => {
    if (!data || data.length === 0) return 10;
    const counts = data
      .map(x => x?.count ?? 0)
      .filter(count => typeof count === 'number' && !isNaN(count) && count >= 0);
    if (counts.length === 0) return 10;
    const max = Math.max(...counts);
    return max > 0 ? max : 10;
  };
  
  const ordersMax = getSafeMax(dashboardData?.ordersByPeriod);
  const usersMax = getSafeMax(dashboardData?.usersByPeriod);
  const sellersMax = getSafeMax(dashboardData?.sellersByPeriod);

  const scale = (value: number, max: number): number => {
    if (!max || max === 0 || isNaN(max)) return chartHeight;
    const safeValue = Math.max(0, value ?? 0);
    if (isNaN(safeValue)) return chartHeight;
    return chartHeight - (safeValue / max) * chartHeight;
  };

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const dashboardRes = await fetch(`${API_URL}/admin/dashboard/stats?period=${period}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!dashboardRes.ok) {
          throw new Error(`HTTP error! status: ${dashboardRes.status}`);
        }

        const dashboard = await dashboardRes.json();
        setDashboardData(dashboard);

        // Calculate totals from period data with safe fallbacks
        const totalOrders = (dashboard.ordersByPeriod || []).reduce(
          (sum: number, item: any) => sum + (item?.count || 0), 
          0
        );
        const totalUsers = (dashboard.usersByPeriod || []).reduce(
          (sum: number, item: any) => sum + (item?.count || 0), 
          0
        );
        const totalSellers = (dashboard.sellersByPeriod || []).reduce(
          (sum: number, item: any) => sum + (item?.count || 0), 
          0
        );

        setStats({
          totalUsers,
          totalSellers,
          totalProducts: dashboard.totalProducts || 0,
          totalOrders,
          totalRevenue: dashboard.totalRevenue || 0,
          activeUsers: dashboard.activeUsers || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(error instanceof Error ? error.message : "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate, period]);

  const statCards = [
    {
      title: "Tổng Người Dùng",
      value: stats.totalUsers.toLocaleString('vi-VN'),
      icon: Users,
      color: "blue",
      change: "+12%",
    },
    {
      title: "Tổng Sellers",
      value: stats.totalSellers.toLocaleString('vi-VN'),
      icon: Store,
      color: "green",
      change: "+5%",
    },
    {
      title: "Tổng Sản Phẩm",
      value: stats.totalProducts.toLocaleString('vi-VN'),
      icon: Package,
      color: "purple",
      change: "+8%",
    },
    {
      title: "Tổng Đơn Hàng",
      value: stats.totalOrders.toLocaleString('vi-VN'),
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
      value: stats.activeUsers.toLocaleString('vi-VN'),
      icon: Activity,
      color: "pink",
      change: "+10%",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <span>Chào mừng, <span className="font-semibold text-blue-600">{admin?.name || "Admin"}</span></span>
              <span className="text-gray-400">•</span>
              <span className="text-sm">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
          </div>
          
          {/* Period Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === 'week'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                period === 'month'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Theo Tháng
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50" },
            green: { bg: "bg-green-500", text: "text-green-600", light: "bg-green-50" },
            purple: { bg: "bg-purple-500", text: "text-purple-600", light: "bg-purple-50" },
            orange: { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50" },
            yellow: { bg: "bg-yellow-500", text: "text-yellow-600", light: "bg-yellow-50" },
            pink: { bg: "bg-pink-500", text: "text-pink-600", light: "bg-pink-50" },
          };
          const colors = colorClasses[stat.color as keyof typeof colorClasses];
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`${colors.light} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">{stat.change}</span>
                </div>
              </div>
              
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-4">{stat.value}</p>
              
              {/* Mini Chart */}
              <div className="flex items-end gap-1 h-12">
                {[...Array(12)].map((_, i) => {
                  const height = 20 + Math.random() * 80;
                  return (
                    <div key={i} className="flex-1 flex items-end">
                      <div 
                        className={`w-full ${colors.bg} rounded-t transition-all hover:opacity-100`}
                        style={{ 
                          height: `${height}%`,
                          opacity: i === 11 ? 1 : 0.4
                        }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Grid */}
      {dashboardData && (
        <>
          {/* Line Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Orders Line Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Đơn Hàng</h2>
                  <p className="text-sm text-gray-500">Biểu đồ theo {period === 'week' ? 'tuần' : 'tháng'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Tổng đơn hàng</span>
                </div>
              </div>
              
              {/* Line Chart */}
              <div className="relative h-64">
                {/* Grid */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="border-t border-gray-100"></div>
                  ))}
                </div>

                {dashboardData.ordersByPeriod && dashboardData.ordersByPeriod.length > 0 ? (
                  <>
                     {/* Chart */}
                     <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 260">
                       {/* Gradient */}
                       <defs>
                         <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                           <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                         </linearGradient>
                       </defs>

                       {/* Area */}
                       <path
                         d={`
                           M 0 ${scale(dashboardData.ordersByPeriod[0]?.count ?? 0, ordersMax)}
                           ${dashboardData.ordersByPeriod
                             .map((item, i) => {
                               const count = item?.count ?? 0;
                               const divisor = Math.max(dashboardData.ordersByPeriod.length - 1, 1);
                               const x = (i / divisor) * 100;
                               return `L ${x} ${scale(count, ordersMax)}`;
                             }).join(" ")
                           }
                           L 100 ${chartHeight}
                           L 0 ${chartHeight}
                         `}
                         fill="url(#orderGradient)"
                       />

                       {/* Line */}
                       <polyline
                         points={dashboardData.ordersByPeriod
                           .map((item, i) => {
                             const count = item?.count ?? 0;
                             const divisor = Math.max(dashboardData.ordersByPeriod.length - 1, 1);
                             const x = (i / divisor) * 100;
                             return `${x},${scale(count, ordersMax)}`;
                           })
                           .join(" ")
                         }
                         fill="none"
                         stroke="#3b82f6"
                         strokeWidth="3"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       />

                       {/* Points */}
                       {dashboardData.ordersByPeriod.map((item, i) => {
                         const count = item?.count ?? 0;
                         const label = item?.label ?? '';
                         const divisor = Math.max(dashboardData.ordersByPeriod.length - 1, 1);
                         const x = (i / divisor) * 100;
                         
                         return (
                           <circle
                             key={i}
                             cx={`${x}%`}
                             cy={scale(count, ordersMax)}
                             r="5"
                             fill="#3b82f6"
                             className="hover:r-7 transition-all cursor-pointer"
                           >
                             <title>{`${label}: ${count} đơn`}</title>
                           </circle>
                         );
                       })}
                    </svg>
                    
                    {/* X-axis Labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pb-1">
                      {dashboardData.ordersByPeriod.map((item, i) => {
                        const label = item?.label ?? '';
                        const displayLabel = period === 'week' ? `T${i + 1}` : (label.split('/')[0] || `T${i + 1}`);
                        return (
                          <span key={i} className="text-xs text-gray-500" title={label}>
                            {displayLabel}
                          </span>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm text-gray-400">Không có dữ liệu</span>
                  </div>
                )}
              </div>
            </div>
  
            {/* Users Line Chart - UPDATED */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Người Dùng</h2>
                  <p className="text-sm text-gray-500">Biểu đồ theo {period === 'week' ? 'tuần' : 'tháng'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Người dùng mới</span>
                </div>
              </div>
              
              {/* Line Chart for Users */}
              <div className="relative h-64">
                {/* Grid */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="border-t border-gray-100"></div>
                  ))}
                </div>

                {dashboardData.usersByPeriod && dashboardData.usersByPeriod.length > 0 ? (
                  <>
                     {/* Chart */}
                     <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 260">
                       {/* Gradient */}
                       <defs>
                         <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                           <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                         </linearGradient>
                       </defs>

                       {/* Area */}
                       <path
                         d={`
                           M 0 ${scale(dashboardData.usersByPeriod[0]?.count ?? 0, usersMax)}
                           ${dashboardData.usersByPeriod
                             .map((item, i) => {
                               const count = item?.count ?? 0;
                               const divisor = Math.max(dashboardData.usersByPeriod.length - 1, 1);
                               const x = (i / divisor) * 100;
                               return `L ${x} ${scale(count, usersMax)}`;
                             }).join(" ")
                           }
                           L 100 ${chartHeight}
                           L 0 ${chartHeight}
                         `}
                         fill="url(#userGradient)"
                       />

                       {/* Line */}
                       <polyline
                         points={dashboardData.usersByPeriod
                           .map((item, i) => {
                             const count = item?.count ?? 0;
                             const divisor = Math.max(dashboardData.usersByPeriod.length - 1, 1);
                             const x = (i / divisor) * 100;
                             return `${x},${scale(count, usersMax)}`;
                           })
                           .join(" ")
                         }
                         fill="none"
                         stroke="#10b981"
                         strokeWidth="3"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       />

                       {/* Points */}
                       {dashboardData.usersByPeriod.map((item, i) => {
                         const count = item?.count ?? 0;
                         const label = item?.label ?? '';
                         const divisor = Math.max(dashboardData.usersByPeriod.length - 1, 1);
                         const x = (i / divisor) * 100;
                         
                         return (
                           <circle
                             key={i}
                             cx={`${x}%`}
                             cy={scale(count, usersMax)}
                             r="5"
                             fill="#10b981"
                             className="hover:r-7 transition-all cursor-pointer"
                           >
                             <title>{`${label}: ${count} người dùng`}</title>
                           </circle>
                         );
                       })}
                    </svg>
                    
                    {/* X-axis Labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pb-1">
                      {dashboardData.usersByPeriod.map((item, i) => {
                        const label = item?.label ?? '';
                        const displayLabel = period === 'week' ? `T${i + 1}` : (label.split('/')[0] || `T${i + 1}`);
                        return (
                          <span key={i} className="text-xs text-gray-500" title={label}>
                            {displayLabel}
                          </span>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm text-gray-400">Không có dữ liệu</span>
                  </div>
                )}
              </div>
            </div>
          </div>
  
          {/* Bar Charts & Rankings Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sellers Line Chart - UPDATED */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Sellers</h2>
                  <p className="text-sm text-gray-500">Biểu đồ theo {period === 'week' ? 'tuần' : 'tháng'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Sellers mới</span>
                </div>
              </div>
              
              {/* Line Chart for Sellers */}
              <div className="relative h-64">
                {/* Grid */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="border-t border-gray-100"></div>
                  ))}
                </div>

                {dashboardData.sellersByPeriod && dashboardData.sellersByPeriod.length > 0 ? (
                  <>
                     {/* Chart */}
                     <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 260">
                       {/* Gradient */}
                       <defs>
                         <linearGradient id="sellerGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                           <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                         </linearGradient>
                       </defs>

                       {/* Area */}
                       <path
                         d={`
                           M 0 ${scale(dashboardData.sellersByPeriod[0]?.count ?? 0, sellersMax)}
                           ${dashboardData.sellersByPeriod
                             .map((item, i) => {
                               const count = item?.count ?? 0;
                               const divisor = Math.max(dashboardData.sellersByPeriod.length - 1, 1);
                               const x = (i / divisor) * 100;
                               return `L ${x} ${scale(count, sellersMax)}`;
                             }).join(" ")
                           }
                           L 100 ${chartHeight}
                           L 0 ${chartHeight}
                         `}
                         fill="url(#sellerGradient)"
                       />

                       {/* Line */}
                       <polyline
                         points={dashboardData.sellersByPeriod
                           .map((item, i) => {
                             const count = item?.count ?? 0;
                             const divisor = Math.max(dashboardData.sellersByPeriod.length - 1, 1);
                             const x = (i / divisor) * 100;
                             return `${x},${scale(count, sellersMax)}`;
                           })
                           .join(" ")
                         }
                         fill="none"
                         stroke="#a855f7"
                         strokeWidth="3"
                         strokeLinecap="round"
                         strokeLinejoin="round"
                       />

                       {/* Points */}
                       {dashboardData.sellersByPeriod.map((item, i) => {
                         const count = item?.count ?? 0;
                         const label = item?.label ?? '';
                         const divisor = Math.max(dashboardData.sellersByPeriod.length - 1, 1);
                         const x = (i / divisor) * 100;
                         
                         return (
                           <circle
                             key={i}
                             cx={`${x}%`}
                             cy={scale(count, sellersMax)}
                             r="5"
                             fill="#a855f7"
                             className="hover:r-7 transition-all cursor-pointer"
                           >
                             <title>{`${label}: ${count} sellers`}</title>
                           </circle>
                         );
                       })}
                    </svg>
                    
                    {/* X-axis Labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pb-1">
                      {dashboardData.sellersByPeriod.map((item, i) => {
                        const label = item?.label ?? '';
                        const displayLabel = period === 'week' ? `T${i + 1}` : (label.split('/')[0] || `T${i + 1}`);
                        return (
                          <span key={i} className="text-xs text-gray-500" title={label}>
                            {displayLabel}
                          </span>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm text-gray-400">Không có dữ liệu</span>
                  </div>
                )}
              </div>
            </div>

  
            {/* Top Products Ranking */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Top 5 Sản Phẩm</h2>
                  <p className="text-sm text-gray-500">Được đặt hàng nhiều nhất</p>
                </div>
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              
              {dashboardData.topProducts && dashboardData.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.topProducts.slice(0, 5).map((product, index) => {
                    const maxCount = Math.max(...dashboardData.topProducts.slice(0, 5).map(p => p.order_count));
                    const percentage = maxCount > 0 ? (product.order_count / maxCount) * 100 : 0;
                    const medals = ['🥇', '🥈', '🥉'];
                    
                    return (
                      <div key={product.product_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg text-white font-bold text-lg shadow-md">
                          {medals[index] || `#${index + 1}`}
                        </div>
                        
                        {product.product_image ? (
                          <img
                            src={product.product_image}
                            alt={product.product_title}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                            {product.product_title}
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-orange-600 whitespace-nowrap">
                              {product.order_count} đơn
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <span className="text-sm text-gray-400">Không có dữ liệu sản phẩm</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
  
      {/* Quick Actions - Grid Style */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Thao Tác Nhanh</h2>
          <div className="text-xs text-gray-500">Truy cập nhanh các tính năng</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/admin/products")}
            className="group relative overflow-hidden p-5 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all text-left"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <Package className="w-8 h-8 text-blue-600 mb-3" />
              <p className="font-bold text-gray-900 mb-1">Sản Phẩm</p>
              <p className="text-xs text-gray-500">Quản lý kho hàng</p>
            </div>
          </button>
          
          <button
            onClick={() => navigate("/admin/users")}
            className="group relative overflow-hidden p-5 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all text-left"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <Users className="w-8 h-8 text-green-600 mb-3" />
              <p className="font-bold text-gray-900 mb-1">Người Dùng</p>
              <p className="text-xs text-gray-500">Quản lý tài khoản</p>
            </div>
          </button>
          
          <button
            onClick={() => navigate("/admin/orders")}
            className="group relative overflow-hidden p-5 border-2 border-gray-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all text-left"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <ShoppingCart className="w-8 h-8 text-orange-600 mb-3" />
              <p className="font-bold text-gray-900 mb-1">Đơn Hàng</p>
              <p className="text-xs text-gray-500">Xử lý đơn hàng</p>
            </div>
          </button>
          
          <button
            onClick={() => navigate("/admin/analytics")}
            className="group relative overflow-hidden p-5 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all text-left"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
            <div className="relative">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
              <p className="font-bold text-gray-900 mb-1">Thống Kê</p>
              <p className="text-xs text-gray-500">Báo cáo chi tiết</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
