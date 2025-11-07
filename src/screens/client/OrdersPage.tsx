import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { api } from '../../api/client';
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; title?: string; images?: string[] };
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at?: string;
  order_item: OrderItem[];
}

export function OrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('all');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api<{ items: Order[] }>('/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data.items || []);
    } catch (err) {
      console.error(err);
      alert('Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadOrders();
  }, [token]);

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: 'Chờ xác nhận',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
        iconColor: 'text-yellow-600',
      },
      confirmed: {
        label: 'Đã xác nhận',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: CheckCircle,
        iconColor: 'text-blue-600',
      },
      shipping: {
        label: 'Đang giao',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Truck,
        iconColor: 'text-purple-600',
      },
      delivered: {
        label: 'Đã giao',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
        iconColor: 'text-green-600',
      },
      cancelled: {
        label: 'Đã hủy',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
        iconColor: 'text-red-600',
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const tabs = [
    { id: 'all', label: 'Tất cả', count: orders.length },
    { id: 'pending', label: 'Chờ xác nhận', count: orders.filter(o => o.status === 'pending').length },
    { id: 'shipping', label: 'Đang giao', count: orders.filter(o => o.status === 'shipping').length },
    { id: 'delivered', label: 'Đã giao', count: orders.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', label: 'Đã hủy', count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const filteredOrders = selectedTab === 'all'
    ? orders
    : orders.filter(o => o.status === selectedTab);

  if (!token)
    return <div className="p-6 text-center text-gray-500">Vui lòng đăng nhập để xem đơn hàng.</div>;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có đơn hàng</h3>
            <p className="text-gray-500">Bạn chưa có đơn hàng nào trong danh mục này</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Header */}
                  <div className="p-5 border-b bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Package className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Mã đơn: <span className="text-orange-600">#{order.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {formatDate(order.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
                        <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor}`} />
                        <span className="text-sm font-medium">{statusConfig.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-5">
                    <div className="space-y-3">
                      {(isExpanded ? order.order_item : order.order_item.slice(0, 2)).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                            {item.product?.images?.[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product?.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                              {item.product?.title || item.product?.id}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Số lượng: <span className="font-medium text-gray-700">x{item.quantity}</span></span>
                              <span className="text-gray-300">|</span>
                              <span className="font-medium text-orange-600">
                                {Number(item.price).toLocaleString('vi-VN')}₫
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-500 mb-1">Thành tiền</div>
                            <div className="text-lg font-bold text-gray-900">
                              {(Number(item.price) * item.quantity).toLocaleString('vi-VN')}₫
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.order_item.length > 2 && (
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="w-full mt-3 py-2 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center gap-1 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Thu gọn <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Xem thêm {order.order_item.length - 2} sản phẩm <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-5 border-t bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {Number(order.total).toLocaleString('vi-VN')}₫
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'delivered' && (
                        <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm">
                          Mua lại
                        </button>
                      )}
                      {order.status === 'shipping' && (
                        <button className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors shadow-sm">
                          Theo dõi
                        </button>
                      )}
                      <button className="px-5 py-2.5 border-2 border-gray-300 hover:border-orange-500 hover:text-orange-600 text-gray-700 font-medium rounded-lg transition-all">
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
