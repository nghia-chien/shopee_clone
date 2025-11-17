import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { getUserOrders } from '../../api/userapi/orders';
import { Package, MessageCircle, Store, Truck } from 'lucide-react';
import { ReviewForm } from '../../components/review/ReviewForm';
import { useNavigate } from "react-router-dom";

interface OrderItem {
  id: string;
  product_id: string;
  title: string;
  images?: string[];
  price: number;
  quantity: number;
  variant?: string;
}

interface SellerOrder {
  id: string;
  order_id: string;
  seller: { id: string; name: string };
  total: number;
  status: 'pending' | 'accepted' | 'cancelled' | 'completed';
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

  const getStatusInfo = (status: string) => {
    const configs: any = {
      pending: { label: 'Chờ xác nhận', tab: 'pending' },
      accepted: { label: 'Vận chuyển', tab: 'shipping' },
      completed: { label: 'Hoàn thành', tab: 'completed', deliverySuccess: true },
      cancelled: { label: 'Đã hủy', tab: 'cancelled' }
    };
    return configs[status] || configs.pending;
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
    const statusInfo = getStatusInfo(order.status);
    return statusInfo.tab === activeTab;
  });

  if (!token)
    return <div className="p-6 text-center text-gray-500">Vui lòng đăng nhập để xem đơn hàng.</div>;

  if (loading)
    return <div className="p-6 text-center">Đang tải đơn hàng...</div>;

  return (
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
            const statusInfo = getStatusInfo(order.status);
            
            return (
              <div key={order.id} className="bg-white rounded shadow-sm">
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                      {order.status === 'completed' ? 'Yêu thích' : order.status === 'pending' ? 'Mall' : 'Yêu thích'}
                    </span>
                    <Store className="w-4 h-4" />
                    <span className="font-medium text-sm">{order.seller.name}</span>
                    <button className="ml-2">
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
                    <span className="text-orange-600 font-medium text-sm uppercase">
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

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

                        <button className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">
                          Liên Hệ Người Bán
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
                        <button className="px-6 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">
                          Liên Hệ Người Bán
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
      </div>
    </div>
  );
}