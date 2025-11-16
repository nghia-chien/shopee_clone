import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { api } from '../../api/userapi/client';
import { useNavigate } from 'react-router-dom';
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";

interface CartProduct {
  id: string;
  title?: string;
  images?: string[];
  price: number;
  stock: number;
}

interface CartItem {
  id: string; // cart_item.id
  product_id: string;
  quantity: number;
  product: CartProduct;
}

export function CartPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()); // lưu cart_item.id
  const [selectAll, setSelectAll] = useState(false);

  // Load giỏ hàng
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

  // Xử lý thêm sản phẩm từ reorder vào cart
  const handleReorderItems = async () => {
    if (!token) return;
    
    try {
      const reorderDataStr = localStorage.getItem('reorder_items');
      if (!reorderDataStr) {
        // Không có reorder data, chỉ load cart bình thường
        await loadCart();
        return;
      }

      const reorderData = JSON.parse(reorderDataStr);
      
      // Kiểm tra timestamp (chỉ xử lý trong 5 phút)
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - reorderData.timestamp > fiveMinutes) {
        localStorage.removeItem('reorder_items');
        await loadCart();
        return;
      }

      // Thêm từng sản phẩm vào cart
      for (const item of reorderData.items) {
        try {
          await api('/cart/items', {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              product_id: item.product_id,
              quantity: item.quantity,
            }),
          });
        } catch (err) {
          console.error(`Error adding product ${item.product_id} to cart:`, err);
        }
      }

      // Xóa reorder data sau khi đã thêm vào cart
      localStorage.removeItem('reorder_items');
      
      // Reload cart để hiển thị items mới
      await loadCart();
    } catch (err) {
      console.error('Error handling reorder items:', err);
      localStorage.removeItem('reorder_items');
      await loadCart();
    }
  };

  useEffect(() => { 
    // Xử lý reorder items trước, sau đó load cart
    (async () => {
      await handleReorderItems();
    })();
  }, [token]);

  // ✅ Tính tổng tiền dựa trên cart_item.id
  const total = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (selectedItems.has(it.id)) {
          return sum + Number(it.product.price || 0) * it.quantity;
        }
        return sum;
      }, 0),
    [items, selectedItems]
  );

  // Cập nhật số lượng
  const updateQty = async (product_id: string, quantity: number) => {
    try {
      await api(`/cart/items/${product_id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id, quantity }),
      });
      setItems(prev =>
        prev.map(it => (it.product_id === product_id ? { ...it, quantity } : it))
      );
    } catch (err: any) {
      alert(err?.message || 'Cập nhật số lượng thất bại');
    }
  };

  // Xóa sản phẩm
  const removeItem = async (product_id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await api(`/cart/items/${product_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(prev => prev.filter(it => it.product_id !== product_id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        // Xóa cả cart_item.id tương ứng
        const removedItem = items.find(it => it.product_id === product_id);
        if (removedItem) newSet.delete(removedItem.id);
        return newSet;
      });
    } catch (err: any) {
      alert(err?.message || 'Xóa sản phẩm thất bại');
    }
  };

  // ✅ Toggle chọn 1 sản phẩm theo cart_item.id
  const toggleItem = (cartItemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cartItemId)) newSet.delete(cartItemId);
      else newSet.add(cartItemId);
      return newSet;
    });
  };

  // ✅ Toggle chọn tất cả theo cart_item.id
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(it => it.id)));
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    setSelectAll(items.length > 0 && selectedItems.size === items.length);
  }, [selectedItems, items]);

  // ✅ Gửi cart_item.id lên server khi checkout
  const checkout = async () => {
    if (selectedItems.size === 0) {
      alert('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }
    try {
      const selectedCartItems = Array.from(selectedItems); // chuyển Set thành Array
    console.log('Selected cart items:', selectedCartItems); 
    console.log('ở đây');// Kiểm tra dữ liệu
      await api('/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cart_item_ids: Array.from(selectedItems) }),
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
    <div className="bg-gray-50 min-h-screen">{/* Header */}
        <Header />
      <div className="max-w-7xl mx-auto p-4">
        
        <div className="bg-white rounded-sm shadow-sm mb-3">
          <div className="px-5 py-4 grid grid-cols-12 gap-4 text-sm text-gray-600 font-medium">
            <div className="col-span-5 flex items-center">
              <input 
                type="checkbox" 
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-4 h-4 mr-3"
              />
              <span>Sản Phẩm</span>
            </div>
            <div className="col-span-2 text-center text-gray-500">Đơn Giá</div>
            <div className="col-span-2 text-center text-gray-500">Số Lượng</div>
            <div className="col-span-2 text-center text-gray-500">Số Tiền</div>
            <div className="col-span-1 text-center text-gray-500">Thao Tác</div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-sm shadow-sm p-20 text-center">
            <div className="text-gray-400 text-lg">Giỏ hàng của bạn còn trống</div>
          </div>
        ) : (
          <>
            {/* Product List */}
            <div className="space-y-3 mb-3">
              {items.map(it => {
                const isSelected = selectedItems.has(it.id);
                const itemTotal = Number(it.product?.price || 0) * it.quantity;

                return (
                  <div key={it.id} className="bg-white rounded-sm shadow-sm">
                    <div className="px-5 py-4 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5 flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(it.id)}
                          className="w-4 h-4 mr-3 flex-shrink-0"
                        />
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-20 h-20 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0 border">
                            {it.product?.images?.length ? (
                              <img
                                src={it.product.images[0]}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-800 line-clamp-2">
                              {it.product?.title || it.product_id}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 text-center">
                        <div className="text-gray-900 font-medium">
                          ₫{Number(it.product?.price || 0).toLocaleString('vi-VN')}
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border rounded-sm">
                          <button
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 border-r"
                            onClick={() =>
                              updateQty(it.product_id, Math.max(1, it.quantity - 1))
                            }
                            disabled={it.quantity <= 1}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={e =>
                              updateQty(it.product_id, Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-12 h-8 text-center border-0 focus:outline-none text-gray-900"
                          />
                          <button
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 border-l"
                            onClick={() => updateQty(it.product_id, it.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-center">
                        <div className="text-orange-500 font-medium">
                          ₫{itemTotal.toLocaleString('vi-VN')}
                        </div>
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          className="text-gray-600 hover:text-red-500 text-sm"
                          onClick={() => removeItem(it.product_id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Checkout Bar */}
            <div className="bg-white rounded-sm shadow-sm sticky bottom-0">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 mr-2"
                    />
                    <span className="text-sm">Chọn Tất Cả ({items.length})</span>
                  </label>
                  <button
  className="text-sm text-gray-700 hover:text-gray-900"
  onClick={async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Xóa ${selectedItems.size} sản phẩm đã chọn?`)) return;
    
    try {
      // Get product_ids of selected items
      const itemsToDelete = items.filter(it => selectedItems.has(it.id));
      
      // Delete from backend
      await Promise.all(
        itemsToDelete.map(it =>
          api(`/cart/items/${it.product_id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      
      // Update frontend state
      setItems(prev => prev.filter(it => !selectedItems.has(it.id)));
      setSelectedItems(new Set());
    } catch (err: any) {
      alert(err?.message || 'Xóa sản phẩm thất bại');
    }
  }}
>
  Xóa
</button>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Tổng thanh toán ({selectedItems.size} Sản phẩm):
                    </div>
                    <div className="text-2xl text-orange-500 font-medium">
                      ₫{total.toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <button
                    onClick={checkout}
                    className="px-16 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-sm transition"
                  >
                    Mua Hàng
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div><Footer />
    </div>
  );
}
