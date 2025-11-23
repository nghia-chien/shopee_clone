import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { getUserOrders } from '../../api/userapi/orders';
import { Package, MessageCircle, Store, Truck } from 'lucide-react';
import { ReviewForm } from '../../components/review/ReviewForm';
import { useNavigate } from "react-router-dom";
import { ComplaintModal } from '../../components/complaints/ComplaintModal';
import type { ComplaintDraft } from '../../types/complaints';
import { useChatWidgetStore } from "../../store/chatWidget";
import { ChatWidget } from "../../components/chat/ChatWidget";
interface OrderItem {
  id: string;
  product_id: string;
  title: string;
  images?: string[];
  price: number;
  quantity: number;
  variant?: string;
}

interface ShippingEvent {
  ghn_status?: string | null;
  internal_status?: string | null;
  note?: string | null;
  happened_at?: string | null;
}

interface ShippingInfo {
  shipping_order_id: string;
  ghn_order_code?: string | null;
  ghn_status?: string | null;
  internal_status?: string | null;
  expected_delivery_time?: string | null;
  synced_at?: string | null;
  latest_event?: ShippingEvent | null;
  error_message? : string | null;
}

interface SellerOrder {
  id: string;
  order_id: string;
  seller: { id: string; name: string ; shop_mall: string };
  total: number;
  status: 'pending' | 'accepted' | 'cancelled' | 'completed';
  fulfillment_status?: string | null;
  shipping?: ShippingInfo | null;
  created_at?: string;
  items: OrderItem[];
  rating_deadline?: string;
  rating_reward?: number;
}

export default function OrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeReviewOrder, setActiveReviewOrder] = useState<string | null>(null);
  const [activeReviewProduct, setActiveReviewProduct] = useState<string | null>(null);
  const [complaintDraft, setComplaintDraft] = useState<ComplaintDraft | null>(null);
  const openChat = useChatWidgetStore((s) => s.openChat);
  const navigate = useNavigate();

  // Handler cho nút "Mua Lại"
  const handleReorder = (orderItems: OrderItem[]) => {
    // Lưu orderItems vào localStorage
    const reorderData = {
      items: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        title: item.title,
        price: item.price,
        images: item.images,
      })),
      timestamp: Date.now(),
    };
    localStorage.setItem('reorder_items', JSON.stringify(reorderData));
    // Chuyển hướng đến cart
    navigate('/cart');
  };

  useEffect(() => {
    if (!token) return;
    loadOrders();
  }, [token]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getUserOrders(token!);
      setOrders(data.data);
    } catch (err: any) {
      console.error(err);
      alert('Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_MAP: Record<string, { label: string; tab: string; deliverySuccess?: boolean }> = {
    pending: { label: 'Chờ xác nhận', tab: 'pending' },
    accepted: { label: 'Shop đã xác nhận', tab: 'pending' },
    processing: { label: 'Đang chuẩn bị hàng', tab: 'shipping' },
    delivering: { label: 'Đang giao hàng', tab: 'delivering' },
    delivered: { label: 'Giao hàng thành công', tab: 'completed', deliverySuccess: true },
    cancelled: { label: 'Đã hủy', tab: 'cancelled' },
    returned: { label: 'Hoàn hàng', tab: 'refund' },
    completed: { label: 'Hoàn thành', tab: 'completed', deliverySuccess: true },
  };

  const getStatusInfo = (order: SellerOrder) => {
    const key = order.fulfillment_status || order.status;
    return STATUS_MAP[key] || STATUS_MAP.pending;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return null;
    try {
      return new Date(value).toLocaleString('vi-VN');
    } catch (e) {
      return value;
    }
  };

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'shipping', label: 'Vận chuyển' },
    { id: 'delivering', label: 'Chờ giao hàng' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' },
    { id: 'refund', label: 'Trả hàng/Hoàn tiền' }
  ];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    const statusInfo = getStatusInfo(order);
    return statusInfo.tab === activeTab;
  });

  const openComplaint = (order: SellerOrder, item?: OrderItem) => {
    setComplaintDraft({
      type: 'PRODUCT_SHOP',
      seller_id: order.seller.id,
      order_id: order.order_id,
      product_id: item?.product_id,
      meta: {
        issueCode: 'WRONG_OR_MISSING',
        reason: 'Nhận nhầm / thiếu hàng',
        channel: 'ORDERS_PAGE',
        context: {
          orderId: order.order_id,
          sellerId: order.seller.id,
          productId: item?.product_id,
          productTitle: item?.title,
        },
        autoFill: {
          sourceOrder: order.id,
          total: order.total,
        },
      },
    });
  };

  if (!token)
    return <div className="p-6 text-center text-gray-500">Vui lòng đăng nhập để xem đơn hàng.</div>;

  if (loading)
    return <div className="p-6 text-center">Đang tải đơn hàng...</div>;

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <input
            type="text"
            placeholder="Bạn có thể tìm kiếm theo tên Shop, ID đơn hàng hoặc Tên Sản phẩm"
            className="w-full px-4 py-2 border rounded-sm text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 whitespace-nowrap text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded p-8 text-center text-gray-500">
            Chưa có đơn hàng
          </div>
        ) : (
          filteredOrders.map(order => {
            const statusInfo = getStatusInfo(order);
            const shippingInfo = order.shipping;
            const latestEvent = shippingInfo?.latest_event;

            return (
              <div key={order.id} className="bg-white rounded shadow-sm">
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  {order.seller.shop_mall === 'mall' && (
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                      Mall
                    </span>
                  )}

                  {order.seller.shop_mall === 'like' && (
                    <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                      Yêu thích
                    </span>
                  )}

                    <Store className="w-4 h-4" />
                    <span className="font-medium text-sm">{order.seller.name}</span>
                    <button
                      className="ml-2"
                      onClick={() =>
                        useChatWidgetStore.getState().openChat(
                          order.seller.id,
                          order.seller.name
                        )
                      }
                    >
                      <MessageCircle className="w-4 h-4 text-orange-600" />
                    </button>
                    <button
                      className="text-xs text-gray-500 hover:text-gray-700"
                      onClick={() => navigate(`/shop/${order.seller.id}`)}
                    >
                      <Store className="w-4 h-4 inline" /> Xem Shop
                    </button>

                  </div>
                  <div className="flex items-center gap-2">
                    {statusInfo.deliverySuccess && (
                      <>
                        <Truck className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 text-sm">Giao hàng thành công</span>

                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                      </>
                    )}
                    <div className="text-right">
                      <span className="text-orange-600 font-medium text-sm uppercase block">
                        {statusInfo.label}
                      </span>
                      {shippingInfo?.ghn_order_code && (
                        <span className="text-xs text-gray-500">GHN: {shippingInfo.ghn_order_code}</span>
                      )}
                    </div>
                  </div>
                </div>

                {shippingInfo && (
                  <div className="px-4 py-2 bg-orange-50 text-sm text-gray-700 border-b">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium flex items-center gap-2">
                        <Truck className="w-4 h-4 text-orange-500" />
                        {latestEvent?.note || STATUS_MAP[shippingInfo.internal_status || 'processing']?.label || shippingInfo.error_message ||'Đang xử lý'}
                      </span>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                        {latestEvent?.happened_at && (
                          <span>Cập nhật: {formatDateTime(latestEvent.happened_at)}</span>
                        )}
                        {shippingInfo.expected_delivery_time && (
                          <span>Giao dự kiến: {formatDateTime(shippingInfo.expected_delivery_time)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="px-4 py-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex gap-3 py-2">
                      <div className="w-20 h-20 flex-shrink-0 border rounded overflow-hidden bg-gray-50">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2">{item.title}</p>
                        {item.variant && (
                          <p className="text-xs text-gray-500 mt-1">
                            Phân loại hàng: {item.variant}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">x{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400 line-through">
                          {(item.price * 1.2).toLocaleString('vi-VN')}₫
                        </p>
                        <p className="text-sm text-gray-900 font-medium">
                          {item.price.toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t">
                  {order.status === 'completed' && order.rating_deadline && (
                    <div className="text-xs text-gray-600 mb-2">
                      Đánh giá sản phẩm trước {order.rating_deadline}
                      <br />
                      Đánh giá ngay để nhận {order.rating_reward || 200} Xu
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {order.status === 'cancelled' ? (
                        <span>Đã hủy bởi bạn</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Thành tiền: </span>
                        <span className="text-lg font-medium text-orange-600">
                          {order.total.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 mt-3">
                    {order.status === 'cancelled' && (
                      <>
                        <button 
                          onClick={() => handleReorder(order.items)}
                          className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                        >
                          Mua Lại
                        </button>
                        <button className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">
                          Xem Chi Tiết Hủy Đơn
                        </button>
                        <button className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">
                          Liên Hệ Người Bán
                        </button>
                      </>
                    )}
                    
                    {order.status === 'completed' && (
                      <>
                        {order.items.map(item => (
                          <div key={item.id} className="flex gap-3 py-2 items-center">
                            <div className="flex-1">
                              <p>{item.title}</p>
                            </div>
                            <button
                              className="px-4 py-1 bg-orange-500 text-white rounded-sm text-sm hover:bg-orange-600"
                              onClick={() => {
                                setActiveReviewOrder(order.id);
                                setActiveReviewProduct(item.product_id); // Sử dụng product_id thay vì id
                              }}
                            >
                              Đánh Giá
                            </button>
                          </div>
                        ))}

                        <button
                          className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                          onClick={() => openComplaint(order, order.items[0])}
                        >
                          Báo cáo
                        </button>
                        <button 
                          onClick={() => handleReorder(order.items)}
                          className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                        >
                          Mua Lại
                        </button>
                      </>
                    )}


                    {order.status === 'pending' && (
                      <>
                        <button
                          className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                          onClick={() => openComplaint(order, order.items[0])}
                        >
                          Báo cáo
                        </button>
                        <button 
                          onClick={() => handleReorder(order.items)}
                          className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                        >
                          Mua Lại
                        </button>
                        
                      </>
                    )}

                    {order.status === 'accepted' && (
                      <>
                        <button className="px-6 py-2 bg-orange-600 text-white rounded-sm text-sm hover:bg-orange-700">
                          Đánh Giá
                        </button>
                        <button className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">
                          Liên Hệ Người Bán
                        </button>
                        <button
                          className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                          onClick={() => openComplaint(order, order.items[0])}
                        >
                          Báo cáo
                        </button>
                        <button 
                          onClick={() => handleReorder(order.items)}
                          className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50"
                        >
                          Mua Lại
                        </button>
                      </>
                    )}
                    
                  </div>
                  {activeReviewOrder === order.id && activeReviewProduct && (
                    <div className="mt-4">
                      <ReviewForm
                        productId={activeReviewProduct}
                        sellerOrderId={order.id}
                        onSuccess={() => {
                          setActiveReviewOrder(null);
                          setActiveReviewProduct(null);
                        }}
                        onCancel={() => {
                          setActiveReviewOrder(null);
                          setActiveReviewProduct(null);
                        }}
                      />
                    </div>
                  )}


                </div>

              </div>
            );
          })
        )}
      </div><ChatWidget />
    </div>
    <ComplaintModal
      actor="USER"
      open={!!complaintDraft}
      defaultValues={complaintDraft ?? undefined}
      onClose={() => setComplaintDraft(null)}
      onSuccess={() => setComplaintDraft(null)}
    />
    </>
  );
}