import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { getSellerSoldOrders, getSellerOrderDetails, updateSellerOrderStatus } from "../../api/sellerOrders";
import { Package, ShoppingBag, Eye, TrendingUp, DollarSign, CheckCircle2, Clock, XCircle } from "lucide-react";

interface order_item {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: string[];
    seller: {
      name: string;
      email: string;
    };
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    phone_number?: string;
  };
  seller?: {
    name: string;
    email: string;
    phone_number?: string;
  };
  items: order_item[];
}

export const SellerOrders = () => {
  const navigate = useNavigate();
  const { token } = useSellerAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/seller/login");
      return;
    }
    loadOrders();
  }, [token, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getSellerSoldOrders(token!);
      setOrders(data.orders || []);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (order_id: string) => {
    try {
      const data = await getSellerOrderDetails(token!, order_id);
      setSelectedOrder(data.order);
    } catch (err: any) {
      alert(err.message || "Failed to load order details");
    }
  };

  const handleUpdateStatus = async (order_id: string, status: 'accepted' | 'cancelled') => {
    try {
      setUpdatingId(order_id);
      await updateSellerOrderStatus(token!, order_id, status);
      await loadOrders();
      if (selectedOrder?.id === order_id) {
        const data = await getSellerOrderDetails(token!, order_id);
        setSelectedOrder(data.order);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(o => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    completed: orders.filter(o => o.status === "completed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    totalRevenue: orders
      .filter(o => o.status === "completed")
      .reduce((sum, o) => sum + Number(o.total), 0),
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
              <h1 className="text-3xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
              <p className="mt-1 text-sm text-gray-500">Đơn hàng đã bán của bạn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Đơn Hàng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang Xử Lý</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã Hoàn Thành</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Doanh Thu</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tất Cả ({stats.total})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "pending"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đang Xử Lý ({stats.pending})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "completed"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Hoàn Thành ({stats.completed})
            </button>
            <button
              onClick={() => setFilter("cancelled")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === "cancelled"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Đã Hủy ({stats.cancelled})
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
            <p className="text-gray-600">Các đơn hàng sẽ xuất hiện ở đây khi khách mua sản phẩm của bạn</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Đơn hàng #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </p>
                    {order.user && (
                      <p className="text-sm text-gray-600 mt-1">
                        Khách hàng: {order.user.name || order.user.email}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status === "completed"
                        ? "Hoàn thành"
                        : order.status === "pending"
                        ? "Đang xử lý"
                        : "Đã hủy"}
                    </span>
                    <p className="text-xl font-bold text-blue-600 mt-2">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                        maximumFractionDigits: 0,
                      }).format(Number(order.total))}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm line-clamp-1">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            SL: {item.quantity} x {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(Number(item.price))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.items.length > 3 && (
                    <p className="text-sm text-gray-500 text-center mb-4">
                      +{order.items.length - 3} sản phẩm khác
                    </p>
                  )}
                  <button
                    onClick={() => handleViewDetails(order.id)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Xem Chi Tiết
                  </button>
                  {order.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'accepted')}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium disabled:opacity-50"
                      >
                        {updatingId === order.id ? 'Đang xác nhận...' : 'Xác nhận'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-50"
                      >
                        {updatingId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Chi Tiết Đơn Hàng #{selectedOrder.id.slice(0, 8)}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Thông Tin Khách Hàng</h3>
                {selectedOrder.user && (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Tên:</span> {selectedOrder.user.name || "N/A"}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.user.email}</p>
                    {selectedOrder.user.phone_number && (
                      <p><span className="font-medium">SĐT:</span> {selectedOrder.user.phone_number}</p>
                    )}
                  </div>
                )}
                {selectedOrder.seller && (
                  <div className="space-y-1 text-sm mt-2">
                    <p><span className="font-medium">Người mua (Seller):</span> {selectedOrder.seller.name || selectedOrder.seller.email}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Thông Tin Đơn Hàng</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Trạng thái:</span> {selectedOrder.status}</p>
                  <p><span className="font-medium">Ngày tạo:</span> {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}</p>
                  <p className="text-lg font-bold text-blue-600 mt-2">
                    <span className="font-medium">Tổng tiền:</span>{" "}
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(Number(selectedOrder.total))}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sản Phẩm</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product.title}</p>
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity} | Giá: {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(Number(item.price))}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                          Tổng: {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

