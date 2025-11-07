import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { fetchSellerProducts } from "../../api/sellerProducts";
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Settings, 
  BarChart3,
  LogOut,
  LayoutDashboard,
  Star,
  CheckCircle2,
  XCircle,
  ArrowRight
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  images: string[];
  status?: string;
}

export const SellerHome = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const { seller, token, setAuth, logout } = useSellerAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      const storedToken = token; // rely on store; session-based persistence handles reloads
      if (!storedToken) {
        navigate("/seller/login");
        return;
      }

      try {
        // Fetch seller info
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
        const res = await fetch(`${baseUrl}/seller/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!res.ok) {
          logout();
          navigate("/seller/login");
          return;
        }

        const data = await res.json();
        setAuth(storedToken, data.seller || data);

        // Fetch products for stats
        try {
          const productsData = await fetchSellerProducts(storedToken);
          setProducts(productsData.products || []);
        } catch (err) {
          console.error("Failed to fetch products:", err);
        }
      } catch (err) {
        console.error("Fetch seller failed:", err);
        logout();
        navigate("/seller/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, token, logout, setAuth]);

  const handleLogout = () => {
    logout();
    navigate("/seller/login");
  };

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    activeProducts: products.filter(p => p.status === "active" || !p.status).length,
  };

  // Get recent products (last 4)
  const recentProducts = products.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!seller) return <p>Không tìm thấy thông tin seller</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {seller.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Chào mừng, {seller.name || "Seller"}!
                  </h1>
                  <p className="text-gray-600 mt-1">{seller.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-gray-600">
                        {seller.rating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {seller.status === "active" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">Đang hoạt động</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">Tạm ngưng</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Tổng Sản Phẩm</p>
                <p className="text-3xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Tổng Tồn Kho</p>
                <p className="text-3xl font-bold">{stats.totalStock}</p>
              </div>
              <ShoppingBag className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium mb-1">Giá Trị Kho</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(stats.totalValue)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Đang Bán</p>
                <p className="text-3xl font-bold">{stats.activeProducts}</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thao Tác Nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/seller/dashboard")}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all transform hover:scale-105 border border-blue-200"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <span className="font-semibold text-gray-800">Dashboard</span>
              <span className="text-xs text-gray-600 text-center">Quản lý sản phẩm</span>
            </button>

            <button
              onClick={() => navigate("/seller/upload")}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all transform hover:scale-105 border border-green-200"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-semibold text-gray-800">Thêm Sản Phẩm</span>
              <span className="text-xs text-gray-600 text-center">Tạo mới sản phẩm</span>
            </button>

            <button
              onClick={() => navigate("/seller/orders")}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all transform hover:scale-105 border border-orange-200"
            >
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="font-semibold text-gray-800">Đơn Hàng</span>
              <span className="text-xs text-gray-600 text-center">Quản lý đơn hàng</span>
            </button>

            <button
              onClick={() => navigate("/seller/analytics")}
              className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all transform hover:scale-105 border border-purple-200"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-md">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="font-semibold text-gray-800">Phân Tích</span>
              <span className="text-xs text-gray-600 text-center">Thống kê & báo cáo</span>
            </button>
          </div>
        </div>

        {/* Additional Quick Links */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Công Cụ Khác</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/seller/settings")}
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-800">Cài Đặt</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ShoppingBag className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-800">Mua Hàng</span>
            </button>
          </div>
        </div>

        {/* Recent Products */}
        {recentProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Sản Phẩm Gần Đây</h2>
              <button
                onClick={() => navigate("/seller/dashboard")}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                  onClick={() => navigate("/seller/dashboard")}
                >
                  <div className="relative h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-blue-600 font-bold text-sm">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(product.price)}
                    </p>
                    <span className="text-xs text-gray-500">Kho: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có sản phẩm</h3>
            <p className="text-gray-600 mb-6">Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn</p>
            <button
              onClick={() => navigate("/seller/upload")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Thêm Sản Phẩm Đầu Tiên
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
