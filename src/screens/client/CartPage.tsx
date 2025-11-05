import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { api } from '../../api/client';
import { useNavigate } from 'react-router-dom';

interface CartProduct {
  id: string;
  title?: string;
  images?: string[];
  price: number;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: CartProduct;
}

export function CartPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const data = await api<{ items: CartItem[] }>('/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      alert('Không tải được giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCart(); }, [token]);

  const total = useMemo(() =>
    items.reduce((sum, it) => sum + Number(it.product?.price || 0) * it.quantity, 0),
    [items]
  );

  const updateQty = async (product_id: string, quantity: number) => {
    try {
      await api(`/cart/items/${product_id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id, quantity })
      });
      setItems((prev) => prev.map(it => it.product_id === product_id ? { ...it, quantity } : it));
    } catch (err: any) {
      alert(err?.message || 'Cập nhật số lượng thất bại');
    }
  };

  const removeItem = async (product_id: string) => {
    try {
      await api(`/cart/items/${product_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems((prev) => prev.filter(it => it.product_id !== product_id));
    } catch (err: any) {
      alert(err?.message || 'Xóa sản phẩm thất bại');
    }
  };

  const checkout = async () => {
    try {
      const order = await api<any>('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đặt hàng thành công');
      navigate('/orders');
    } catch (err: any) {
      alert(err?.message || 'Thanh toán thất bại');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Đang tải giỏ hàng...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Giỏ hàng</h1>
      {items.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center text-gray-600">
          Giỏ hàng trống.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((it) => (
              <div key={it.id} className="bg-white rounded border p-4 flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                  {it.product?.images?.length ? (
                    <img src={it.product.images[0]} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{it.product?.title || it.product_id}</div>
                  <div className="text-orange-600 font-semibold">
                    {Number(it.product?.price || 0).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border rounded" onClick={() => updateQty(it.product_id, Math.max(1, it.quantity - 1))}>-</button>
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => updateQty(it.product_id, Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 text-center border rounded py-1"
                  />
                  <button className="px-3 py-1 border rounded" onClick={() => updateQty(it.product_id, it.quantity + 1)}>+</button>
                </div>
                <button className="text-red-600 hover:underline ml-4" onClick={() => removeItem(it.product_id)}>Xóa</button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded border p-4 h-fit">
            <div className="flex items-center justify-between mb-2">
              <span>Tạm tính</span>
              <span className="font-semibold">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
            <button onClick={checkout} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded">
              Thanh toán
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
