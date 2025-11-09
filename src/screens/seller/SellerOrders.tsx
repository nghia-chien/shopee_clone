import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { getSellerSoldOrders, getSellerOrderDetails, updateSellerOrderStatus } from "../../api/sellerOrders";
import { Package, Eye } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: string[];
  };
}

interface SellerOrder {
  id: string;
  total: number;
  seller_status: 'pending' | 'accepted' | 'cancelled' | 'completed';
  created_at: string;
  user?: {
    name: string;
    email: string;
    phone_number?: string;
  };
  items: OrderItem[];
}

export const SellerOrders = () => {
  const navigate = useNavigate();
  const { token } = useSellerAuthStore();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
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
      // map order_items => items
      const mappedOrders = (data.orders || []).map((o: any) => ({
        ...o,
        items: o.order_items || [], // đổi tên để frontend dùng
      }));
      setOrders(mappedOrders);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (seller_order_id: string) => {
    try {
      const data = await getSellerOrderDetails(token!, seller_order_id);
      setSelectedOrder({
        ...data.sellerOrder,
        items: data.sellerOrder.order_items || [],
      });
    } catch (err: any) {
      alert(err.message || "Failed to load order details");
    }
  };

  const handleUpdateStatus = async (seller_order_id: string, status: 'accepted' | 'cancelled') => {
    try {
      setUpdatingId(seller_order_id);
      await updateSellerOrderStatus(token!, seller_order_id, status);
      await loadOrders();
      if (selectedOrder?.id === seller_order_id) {
        const data = await getSellerOrderDetails(token!, seller_order_id);
        setSelectedOrder({
          ...data.sellerOrder,
          items: data.sellerOrder.order_items || [],
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter(o => o.seller_status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.seller_status === "pending").length,
    completed: orders.filter(o => o.seller_status === "accepted").length,
    cancelled: orders.filter(o => o.seller_status === "cancelled").length,
    totalRevenue: orders
      .filter(o => o.seller_status === "completed")
      .reduce((sum, o) => sum + Number(o.total), 0),
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đơn hàng</h3>
          <p className="text-gray-600">Các đơn hàng sẽ xuất hiện ở đây khi khách mua sản phẩm của bạn</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Đơn hàng #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-500 mt-1">{new Date(order.created_at).toLocaleString("vi-VN")}</p>
                  {order.user && <p className="text-sm text-gray-600 mt-1">Khách hàng: {order.user.name || order.user.email}</p>}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.seller_status === "completed"
                      ? "bg-green-100 text-green-800"
                      : order.seller_status === "accepted"
                      ? "bg-blue-100 text-blue-800"
                      : order.seller_status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {order.seller_status === "completed"
                      ? "Hoàn thành"
                      : order.seller_status === "accepted"
                      ? "Đã xác nhận"
                      : order.seller_status === "pending"
                      ? "Đang xử lý"
                      : "Đã hủy"}
                  </span>

                  <p className="text-xl font-bold text-blue-600 mt-2">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(order.total))}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {(order.items || []).slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                        ) : <Package className="w-8 h-8 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.product.title}</p>
                        <p className="text-xs text-gray-500">SL: {item.quantity} x {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(item.price))}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {(order.items || []).length > 3 && (
                  <p className="text-sm text-gray-500 text-center mb-4">+{(order.items || []).length - 3} sản phẩm khác</p>
                )}

                <button
                  onClick={() => handleViewDetails(order.id)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Xem Chi Tiết
                </button>

                {order.seller_status === 'pending' && (
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
  );
};
