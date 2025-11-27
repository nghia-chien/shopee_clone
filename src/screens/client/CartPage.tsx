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

interface CartProductVariant {
  id: string;
  title?: string;
  price?: number;
  image?: string;
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string; // Đảm bảo product có id
    seller_id?: string | null;
    title?: string;
    images?: string[];
    price: number;
    stock: number;
  };
  variant?: CartProductVariant;
}

export function CartPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
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
        await loadCart();
        return;
      }

      const reorderData = JSON.parse(reorderDataStr);
      
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - reorderData.timestamp > fiveMinutes) {
        localStorage.removeItem('reorder_items');
        await loadCart();
        return;
      }

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
              variant_id: item.variant_id || null,
              quantity: item.quantity,
            }),
          });
        } catch (err) {
          console.error(`Error adding product ${item.product_id} to cart:`, err);
        }
      }

      localStorage.removeItem('reorder_items');
      await loadCart();
    } catch (err) {
      console.error('Error handling reorder items:', err);
      localStorage.removeItem('reorder_items');
      await loadCart();
    }
  };

  useEffect(() => { 
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

  // Tính tổng tiền
  const total = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (selectedItems.has(it.id)) {
          const price = it.variant?.price ?? it.product?.price ?? 0;
          return sum + price * it.quantity;
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
    
    if (voucher.source !== 'ADMIN') {
      applicableItems = applicableItems.filter((it) => it.product.seller_id === voucher.seller_id);
    }
    
    if (voucher.product_id) {
      applicableItems = applicableItems.filter((it) => it.product.id === voucher.product_id);
    }
    
    if (applicableItems.length === 0) return null;
    
    const base = applicableItems.reduce(
      (sum, it) => {
        const price = it.variant?.price ?? it.product.price;
        return sum + Number(price || 0) * it.quantity;
      },
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

        if (v.status !== 'ACTIVE') return false;
        if (now < new Date(v.start_at).getTime() || now > new Date(v.end_at).getTime()) return false;

        if (v.usage_limit_per_user && entry.usage_count >= v.usage_limit_per_user) return false;

        let applicableItems = items.filter(it => selectedItems.has(it.id));
        if (v.source !== 'ADMIN') {
          applicableItems = applicableItems.filter(it => it.product.seller_id === v.seller_id);
        }
        if (v.product_id) {
          applicableItems = applicableItems.filter(it => it.product.id === v.product_id);
        }
        if (applicableItems.length === 0) return false;

        const base = applicableItems.reduce((sum, it) => {
          const price = it.variant?.price ?? it.product.price;
          return sum + Number(price || 0) * it.quantity;
        }, 0);
        
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

  // Cập nhật số lượng - ĐÃ SỬA
  const updateQty = async (cartItem: CartItem, quantity: number) => {
    try {
      await api('/cart/items', {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          product_id: cartItem.product.id, 
          variant_id: cartItem.variant?.id || null,
          quantity 
        }),
      });
      setItems(prev =>
        prev.map(it => 
          it.id === cartItem.id 
            ? { ...it, quantity } 
            : it
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Cập nhật số lượng thất bại');
    }
  };

  // Xóa sản phẩm - ĐÃ SỬA HOÀN TOÀN
  const removeItem = async (cartItem: CartItem) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      const product_id = cartItem.product.id;
      const variant_id = cartItem.variant?.id || null;
      
      let url = `/cart/items/${product_id}`;
      if (variant_id) {
        url += `/${variant_id}`;
      }
      
      console.log('🗑️ Deleting cart item:', { product_id, variant_id, url });
      
      await api(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Cập nhật state
      setItems(prev => prev.filter(it => it.id !== cartItem.id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItem.id);
        return newSet;
      });
    } catch (err: any) {
      console.error('❌ Error deleting item:', err);
      alert(err?.message || 'Xóa sản phẩm thất bại');
    }
  };

  // Toggle chọn 1 sản phẩm
  const toggleItem = (cartItemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cartItemId)) newSet.delete(cartItemId);
      else newSet.add(cartItemId);
      return newSet;
    });
  };

  // Toggle chọn tất cả
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

  // Gửi cart_item.id lên server khi checkout
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
                const productPrice = it.variant?.price ?? it.product?.price ?? 0;
                const productImage = it.variant?.image || it.product?.images?.[0];
                const itemTotal = productPrice * it.quantity;

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
                            {productImage ? (
                              <img src={productImage} className="w-full h-full object-cover" />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-left text-gray-800">
                              {it.product?.title || it.product.id}
                            </div>
                            {/* Hiển thị variant nếu có */}
                            {it.variant && (
                              <div className="text-xs text-gray-500 mt-1">
                                Phân loại: {it.variant.title}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 text-center">
                        <div className="text-gray-900 font-medium">
                          {Number(productPrice).toLocaleString('vi-VN')}₫
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border rounded-sm">
                          <button
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 border-r"
                            onClick={() =>
                              updateQty(it, Math.max(1, it.quantity - 1))
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
                              updateQty(it, Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-12 h-8 text-center border-0 focus:outline-none text-gray-900"
                          />
                          <button
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 border-l"
                            onClick={() => updateQty(it, it.quantity + 1)}
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
                          onClick={() => removeItem(it)}
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
                        const itemsToDelete = items.filter(it => selectedItems.has(it.id));
                        
                        // Sử dụng Promise.allSettled để không bị dừng khi có lỗi
                        const results = await Promise.allSettled(
                          itemsToDelete.map(it => {
                            const variantId = it.variant?.id;
                            let url = `/cart/items/${it.product.id}`;
                            if (variantId) {
                              url += `/${variantId}`;
                            }
                            return api(url, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                          })
                        );

                        // Kiểm tra kết quả
                        const failedDeletes = results.filter((result, index) => 
                          result.status === 'rejected'
                        );

                        if (failedDeletes.length > 0) {
                          console.error('Some items failed to delete:', failedDeletes);
                        }

                        // Cập nhật UI dù có lỗi hay không
                        setItems(prev => prev.filter(it => !selectedItems.has(it.id)));
                        setSelectedItems(new Set());
                        
                        if (failedDeletes.length > 0) {
                          alert(`Đã xóa ${itemsToDelete.length - failedDeletes.length} sản phẩm, ${failedDeletes.length} sản phẩm xóa thất bại`);
                        }
                      } catch (err: any) {
                        console.error('❌ Error bulk deleting:', err);
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