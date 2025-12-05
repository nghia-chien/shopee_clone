import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { getSellerSoldOrders, getSellerOrderDetails, updateSellerOrderStatus } from "../../api/sellerapi/sellerOrders";
import { Package, Eye, X, Phone, User, MapPin } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: string[];
    seller_id: string;
  };
}

interface SellerOrderUser {
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
}

interface SellerOrder {
  id: string;
  total: number;
  seller_status: 'pending' | 'accepted' | 'cancelled' | 'completed';
  fulfillment_status?: string | null;
  created_at: string;
  user?: SellerOrderUser | null;
  items: OrderItem[];
  orders?: {
    to_name?: string | null;
    to_phone?: string | null;
    to_address?: string | null;
    to_ward_name?: string | null;
    to_district_name?: string | null;
    to_province_name?: string | null;
    user?: SellerOrderUser | null;
    order_item?: OrderItem[];
  };
}

export const SellerOrders = () => {
  const navigate = useNavigate();
  const { token ,seller } = useSellerAuthStore();
  const sellerId = seller?.id;
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const statusOptions: Array<{ value: SellerOrder["seller_status"]; label: string }> = [
    { value: "pending", label: "Đang xử lý" },
    { value: "accepted", label: "Đã xác nhận" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
  ];

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
      
      // map order_items => items và lọc chỉ sản phẩm của seller hiện tại
      const mappedOrders = (data.orders || []).map((o: any) => {
        const allItems = o.order_items || o.orders?.order_item || [];
        
        // Lọc chỉ sản phẩm của seller hiện tại
        const sellerItems = allItems.filter((item: any) => 
          item.product?.seller_id === sellerId
        );
        
        return {
          ...o,
          items: sellerItems, // Chỉ chứa sản phẩm của seller
          user: o.orders?.user || o.user,
        };
      });
      setOrders(mappedOrders);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

 const handleViewDetails = async (seller_order_id: string) => {
  try {
    setDetailLoading(true);
    const data = await getSellerOrderDetails(token!, seller_order_id);
    
    // Lấy tất cả items từ API
    const allItems =
      data.sellerOrder?.order_items ||
      data.sellerOrder?.orders?.order_item ||
      [];
    
    // Lọc chỉ sản phẩm của seller hiện tại
    const sellerItems = allItems.filter((item: any) => 
      item.product?.seller_id === sellerId
    );
    
    setSelectedOrder({
      ...data.sellerOrder,
      user: data.sellerOrder?.orders?.user || data.sellerOrder?.user,
      items: sellerItems, // Chỉ chứa sản phẩm của seller
    });
  } catch (err: any) {
    alert(err.message || "Failed to load order details");
  } finally {
    setDetailLoading(false);
  }
};

  const handleUpdateStatus = async (
    seller_order_id: string,
    status: SellerOrder["seller_status"]
  ) => {
    if (!token) return;
    try {
      const current = orders.find((o) => o.id === seller_order_id)?.seller_status;
      if (current === status) return;
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

  const formatCurrency = useCallback(
    (value: number | string) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(Number(value)),
    []
  );

  const detailItems = useMemo(() => {
    if (!selectedOrder) return [];
    if (selectedOrder.items?.length) return selectedOrder.items;
    return selectedOrder.orders?.order_item || [];
  }, [selectedOrder]);

  const detailUser = useMemo(() => {
    if (!selectedOrder) return null;
    return selectedOrder.user || selectedOrder.orders?.user || null;
  }, [selectedOrder]);

  const filterTabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ xác nhận" },
    { id: "accepted", label: "Chờ giao hàng" },
    { id: "completed", label: "Hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

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
      <div className="bg-white rounded-xl shadow-sm mb-4 p-4 overflow-x-auto">
        <div className="flex gap-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                filter === tab.id
                  ? "bg-orange-100 border-orange-300 text-orange-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
                <div className="text-right space-y-2">
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
                  {order.fulfillment_status && (
                    <span className={`block px-3 py-1 rounded-full text-xs font-semibold ${
                      order.fulfillment_status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.fulfillment_status === "failed"
                        ? "bg-red-100 text-red-800"
                        : order.fulfillment_status === "shipping"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      Trạng thái giao: {translateFulfillment(order.fulfillment_status)}
                    </span>
                  )}

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
                  {updatingId === order.id && detailLoading ? "Đang mở..." : "Xem Chi Tiết"}
                </button>
{/* thêm trạng thai sau khi đã xác nhận thì hoàn thành /
     xem được chi tiết đơn hàng */}
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {order.seller_status === "pending" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "accepted")}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium disabled:opacity-50"
                      >
                        {updatingId === order.id ? "Đang xác nhận..." : "Xác nhận"}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "cancelled")}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-50"
                      >
                        {updatingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                      </button>
                    </>
                  )}

                  {order.seller_status === "accepted" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "completed")}
                        disabled={
                          updatingId === order.id ||
                          order.fulfillment_status !== "delivered"
                        }
                        className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium disabled:opacity-50"
                      >
                        {updatingId === order.id ? "Đang hoàn thành..." : "Hoàn thành đơn"}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "cancelled")}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-50"
                      >
                        Hủy đơn
                      </button>
                    </>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
      {/* Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-start md:items-center justify-center px-4 py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6 space-y-6">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Chi tiết đơn hàng</p>
                <h2 className="text-2xl font-semibold text-gray-900">#{selectedOrder.id}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Tạo lúc {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}
                </p>
                {selectedOrder.fulfillment_status && (
                  <p className="text-xs font-medium text-gray-600">
                    Trạng thái vận chuyển: {translateFulfillment(selectedOrder.fulfillment_status)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedOrder.seller_status === "completed"
                      ? "bg-green-100 text-green-800"
                      : selectedOrder.seller_status === "accepted"
                      ? "bg-blue-100 text-blue-800"
                      : selectedOrder.seller_status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedOrder.seller_status === "completed"
                    ? "Hoàn thành"
                    : selectedOrder.seller_status === "accepted"
                    ? "Đã xác nhận"
                    : selectedOrder.seller_status === "pending"
                    ? "Đang xử lý"
                    : "Đã hủy"}
                </span>
                <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(selectedOrder.total)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <User className="w-4 h-4 text-blue-500" />
                  Thông tin người mua
                </div>
                <p className="text-sm text-gray-900">{detailUser?.name || "Không có tên"}</p>
                <p className="text-sm text-gray-600">{detailUser?.email}</p>
                {detailUser?.phone_number && (
                  <p className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {detailUser.phone_number}
                  </p>
                )}
              </div>

              <div className="border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-700 font-semibold">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  Địa chỉ nhận hàng
                </div>
                <p className="text-sm text-gray-900">{selectedOrder.orders?.to_name || "Chưa có tên"}</p>
                {selectedOrder.orders?.to_phone && (
                  <p className="text-sm text-gray-600">{selectedOrder.orders.to_phone}</p>
                )}
                <p className="text-sm text-gray-600">
                  {selectedOrder.orders?.to_address}
                </p>
                <p className="text-sm text-gray-600">
                  {[selectedOrder.orders?.to_ward_name, selectedOrder.orders?.to_district_name, selectedOrder.orders?.to_province_name]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h3>
              <div className="divide-y border rounded-2xl">
                {detailItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product.title}</p>
                      <p className="text-sm text-gray-500">SL: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Đơn giá</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
                {detailItems.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">Không có sản phẩm nào</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {selectedOrder && selectedOrder.fulfillment_status !== "delivered" && (
                <p className="md:col-span-3 text-xs text-orange-600">
                  * Chỉ có thể hoàn thành đơn khi đơn vị vận chuyển báo trạng thái <strong>delivered</strong>.
                </p>
              )}
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, "accepted")}
                disabled={updatingId === selectedOrder.id || selectedOrder.seller_status !== "pending"}
                className="px-4 py-3 rounded-xl bg-green-50 text-green-700 font-semibold hover:bg-green-100 disabled:opacity-50"
              >
                {updatingId === selectedOrder.id && selectedOrder.seller_status === "pending"
                  ? "Đang xác nhận..."
                  : "Xác nhận"}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                disabled={updatingId === selectedOrder.id || selectedOrder.seller_status === "completed"}
                className="px-4 py-3 rounded-xl bg-red-50 text-red-700 font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                {updatingId === selectedOrder.id ? "Đang hủy..." : "Hủy"}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, "completed")}
                disabled={
                  updatingId === selectedOrder.id ||
                  selectedOrder.seller_status !== "accepted" ||
                  selectedOrder.fulfillment_status !== "delivered"
                }
                className="px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 disabled:opacity-50"
              >
                {updatingId === selectedOrder.id ? "Đang hoàn thành..." : "Hoàn thành"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function translateFulfillment(status?: string | null) {
  if (!status) return "Chưa xác định";
  const map: Record<string, string> = {
    pending: "Chờ xử lý",
    created: "Đã tạo đơn",
    shipping: "Đang vận chuyển",
    completed: "Đã giao thành công",
    failed: "Giao thất bại",
    retrying: "Đang thử lại",
  };
  return map[status] || status;
}
