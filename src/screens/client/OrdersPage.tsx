import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { api } from '../../api/client';

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
  creat_at?: string;
  items: OrderItem[];
}

export function OrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api<{ items: Order[] }>(`/orders`, {
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

  useEffect(() => { if (token) loadOrders(); }, [token]);

  if (!token) {
    return <div className="p-6 text-center text-gray-500">Vui lòng đăng nhập để xem đơn hàng.</div>;
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Đang tải đơn hàng...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center text-gray-600">Chưa có đơn hàng.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Mã đơn: {o.id.slice(0,8)}</div>
                  <div className="text-sm text-gray-500">Trạng thái: {o.status}</div>
                </div>
                <div className="text-blue-600 font-bold">{Number(o.total).toLocaleString('vi-VN')} ₫</div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                {o.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      {it.product?.images?.length ? (
                        <img src={it.product.images[0]} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{it.product?.title || it.product?.id}</div>
                      <div className="text-xs text-gray-500">x{it.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
