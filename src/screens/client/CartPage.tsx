import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { api } from '../../api/userapi/client';
import { useNavigate } from 'react-router-dom';
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { getUserVouchers } from '../../api/userapi/vouchers';
import type { UserVoucherEntry, Voucher } from '../../api/userapi/vouchers';

import { ProductListSection } from '../../components/product/ProductListSection';

interface CartProduct {
  seller_id: string | null | undefined;
  id: string;
  title?: string;
  images?: string[];
  price: number;
  stock: number;
}

interface SuggestedProduct {
  id: string;
  title?: string;
  price?: number;
  images?: string[];
  rating?: number;
  sold?: number;
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
  const [userVouchers, setUserVouchers] = useState<UserVoucherEntry[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string>("");
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);

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

  useEffect(() => {
    if (!token) {
      setUserVouchers([]);
      return;
    }
    const fetchVouchers = async () => {
      try {
        setVoucherLoading(true);
        const data = await getUserVouchers(token);
        setUserVouchers(data.vouchers || []);
      } catch (error) {
        console.error(error);
      } finally {
        setVoucherLoading(false);
      }
    };
    fetchVouchers();
  }, [token]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setSuggestedLoading(true);
        const data = await api<{ items: any[] }>('/products?page=1&pageSize=12&sort=newest');
        const normalized = data.items?.map((item) => ({
          id: item.id,
          title: item.title,
          images: item.images,
          price: Number(item.price ?? 0),
          rating: item.rating,
          sold: item.sold,
        })) ?? [];
        setSuggestedProducts(normalized);
      } catch (error) {
        console.error('Không thể tải gợi ý sản phẩm:', error);
      } finally {
        setSuggestedLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

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

  const evaluateVoucher = (voucher: Voucher) => {
    const now = Date.now();
    
    if (voucher.status !== 'ACTIVE') return null;
    if (now < new Date(voucher.start_at).getTime() || now > new Date(voucher.end_at).getTime()) {
      return null;
    }
    let applicableItems = items.filter((it) => selectedItems.has(it.id));
    // For PLATFORM vouchers (source='ADMIN'), don't filter by seller_id
    // For seller vouchers, filter by seller_id
    if ( voucher.source !== 'ADMIN') {
      applicableItems = applicableItems.filter((it) => it.product.seller_id === voucher.seller_id);
    }
    if (voucher.product_id) {
      applicableItems = applicableItems.filter((it) => it.product_id === voucher.product_id);
    }
    if (applicableItems.length === 0) return null;
    const base = applicableItems.reduce(
      (sum, it) => sum + Number(it.product.price || 0) * it.quantity,
      0
    );
    const minOrder = Number(voucher.min_order_amount ?? 0);
    if (minOrder > 0 && base < minOrder) return null;
    let discount =
      voucher.discount_type === 'PERCENT'
        ? (base * Number(voucher.discount_value)) / 100
        : Number(voucher.discount_value);
    if (voucher.discount_type === 'PERCENT' && voucher.max_discount_amount) {
      discount = Math.min(discount, Number(voucher.max_discount_amount));
    }
    discount = Math.min(discount, base);
    if (discount <= 0) return null;
    return { discount, base };
  };

  const applicableVouchers = useMemo(() => {
  if (!selectedItems.size) return [];
  const now = Date.now();

  return userVouchers
    .filter(entry => {
      const v = entry.voucher;

      // 1️⃣ Voucher còn hiệu lực
      if (v.status !== 'ACTIVE') return false;
      if (now < new Date(v.start_at).getTime() || now > new Date(v.end_at).getTime()) return false;

      // 2️⃣ Voucher chưa dùng hết
      if (v.usage_limit_per_user && entry.usage_count >= v.usage_limit_per_user) return false;

      // 3️⃣ Kiểm tra product/seller
      let applicableItems = items.filter(it => selectedItems.has(it.id));
      if (v.source !== 'ADMIN') {
        applicableItems = applicableItems.filter(it => it.product.seller_id === v.seller_id);
      }
      if (v.product_id) {
        applicableItems = applicableItems.filter(it => it.product_id === v.product_id);
      }
      if (applicableItems.length === 0) return false;

      // 4️⃣ Kiểm tra min_order_amount
      const base = applicableItems.reduce((sum, it) => sum + Number(it.product.price || 0) * it.quantity, 0);
      if (v.min_order_amount && base < Number(v.min_order_amount)) return false;

      return true;
    })
    .map(entry => {
      const evalResult = evaluateVoucher(entry.voucher);
      return evalResult ? entry : null;
    })
    .filter(Boolean) as UserVoucherEntry[];
}, [userVouchers, selectedItems, items]);


  useEffect(() => {
    if (
      selectedVoucherCode &&
      !applicableVouchers.some((entry) => entry.voucher.code === selectedVoucherCode)
    ) {
      setSelectedVoucherCode("");
    }
  }, [applicableVouchers, selectedVoucherCode]);

  const selectedVoucherPreview = useMemo(() => {
    if (!selectedVoucherCode) return null;
    const entry = applicableVouchers.find((v) => v.voucher.code === selectedVoucherCode);
    if (!entry) return null;
    return evaluateVoucher(entry.voucher);
  }, [selectedVoucherCode, applicableVouchers, items]);

  const discountAmount = selectedVoucherPreview?.discount ?? 0;
  const payableTotal = Math.max(0, total - discountAmount);

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
  const proceedToCheckout = () => {
    if (selectedItems.size === 0) {
      alert('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }
    navigate('/checkout', {
      state: {
        cartItemIds: Array.from(selectedItems),
        voucherCode: selectedVoucherCode || null,
      },
    });
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Đang tải giỏ hàng...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-sm shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-700">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-semibold uppercase border border-orange-200 text-orange-500 rounded-full">
              Ưu đãi vận chuyển
            </span>
            <p>Giảm 500.000đ phí vận chuyển cho đơn tối thiểu 0đ</p>
          </div>
          <button
            onClick={() => navigate('/flash-sale')}
            className="text-sm text-orange-500 hover:text-orange-600"
          >
            Tìm hiểu thêm
          </button>
        </div>

        <div className="bg-white rounded-sm shadow-sm p-4 flex flex-wrap items-center gap-4 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Shopee Voucher</span>
            <span className="text-xs text-gray-500">Chọn hoặc nhập mã</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedVoucherCode ? (
              <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium">
                {selectedVoucherCode}
              </span>
            ) : (
              <span className="text-xs text-gray-500">Chưa chọn voucher</span>
            )}
            <button
              onClick={() => navigate('/user/vouchers')}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Chọn mã
            </button>
          </div>
        </div>

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
            {/* Voucher selection */}
            {token && (
              <div className="bg-white rounded-sm shadow-sm p-5 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Voucher của bạn</h3>
                  <button
                    onClick={() => navigate('/user/vouchers')}
                    className="text-sm text-orange-500 hover:text-orange-600"
                  >
                    Xem kho voucher
                  </button>
                </div>
                {voucherLoading ? (
                  <p className="text-sm text-gray-500">Đang tải voucher...</p>
                ) : applicableVouchers.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Không có voucher phù hợp với sản phẩm đã chọn.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {applicableVouchers.map((entry) => {
                      const preview = evaluateVoucher(entry.voucher);
                      if (!preview) return null;
                      const v = entry.voucher;
                      const discountLabel =
                        v.discount_type === 'PERCENT'
                          ? `${v.discount_value}%`
                          : `${Number(v.discount_value).toLocaleString('vi-VN')}₫`;
                      return (
                        <label
                          key={entry.id}
                          className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:border-orange-400 transition"
                        >
                          <input
                            type="radio"
                            name="voucher"
                            checked={selectedVoucherCode === v.code}
                            onChange={() => setSelectedVoucherCode(v.code)}
                          />
                          <div className="flex flex-col text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {discountLabel} - {v.code}
                              </span>
                              {(v.type === "PLATFORM" || v.source === "ADMIN") && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  PLATFORM
                                </span>
                              )}
                            </div>
                            <span>Giảm ước tính: {preview.discount.toLocaleString('vi-VN')}₫</span>
                            <span className="text-xs text-gray-500">
                              HSD: {new Date(v.end_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                    {selectedVoucherCode && (
                      <button
                        onClick={() => setSelectedVoucherCode("")}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Bỏ chọn voucher
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

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
                  <div className="text-right space-y-1">
                    <div className="text-sm text-gray-600">
                      Tạm tính ({selectedItems.size} sản phẩm): ₫{total.toLocaleString('vi-VN')}
                    </div>
                    {discountAmount > 0 && (
                      <div className="text-sm text-green-600">
                        Giảm giá: -₫{discountAmount.toLocaleString('vi-VN')}
                      </div>
                    )}
                    <div className="text-2xl text-orange-500 font-medium">
                      ₫{payableTotal.toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <button
                    onClick={proceedToCheckout}
                    className="px-16 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-sm transition disabled:opacity-50"
                    disabled={selectedItems.size === 0}
                  >
                    Mua Hàng
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        <div>
          {suggestedLoading ? (
            <div className="bg-white rounded-sm shadow-sm p-6 text-center text-sm text-gray-500">
              Đang tải gợi ý sản phẩm...
            </div>
          ) : (
            <ProductListSection title="Có thể bạn cũng thích" products={suggestedProducts} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
