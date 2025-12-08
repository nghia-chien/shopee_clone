import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { api } from '../../api/userapi/client';
import { useNavigate } from 'react-router-dom';
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { getUserVouchers } from '../../api/userapi/vouchers';
import type { UserVoucherEntry, Voucher } from '../../api/userapi/vouchers';
import { useQueryClient } from "@tanstack/react-query";
import VoucherDialog from '../../components/voucher/VoucherDialog'
import { ProductListSection } from '../../components/product/ProductListSection';


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
  const queryClient = useQueryClient();
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);

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
      .map(entry => {
        const v = entry.voucher;
        let isApplicable = true;
        let reason = '';
  
        // Kiểm tra các điều kiện
        if (v.status !== 'ACTIVE') {
          isApplicable = false;
          reason = 'Voucher không khả dụng';
        } else if (now < new Date(v.start_at).getTime()) {
          isApplicable = false;
          reason = 'Voucher chưa bắt đầu';
        } else if (now > new Date(v.end_at).getTime()) {
          isApplicable = false;
          reason = 'Voucher đã hết hạn';
        } else if (v.usage_limit_per_user && entry.usage_count >= v.usage_limit_per_user) {
          isApplicable = false;
          reason = 'Đã dùng hết lượt';
        } else {
          // Kiểm tra điều kiện sản phẩm
          let applicableItems = items.filter(it => selectedItems.has(it.id));
          
          if (v.source !== 'ADMIN') {
            applicableItems = applicableItems.filter(it => it.product.seller_id === v.seller_id);
            if (applicableItems.length === 0) {
              isApplicable = false;
              reason = 'Không áp dụng cho shop này';
            }
          }
          
          if (v.product_id) {
            applicableItems = applicableItems.filter(it => it.product.id === v.product_id);
            if (applicableItems.length === 0) {
              isApplicable = false;
              reason = 'Chỉ áp dụng cho sản phẩm cụ thể';
            }
          }
          
          if (applicableItems.length > 0) {
            const base = applicableItems.reduce((sum, it) => {
              const price = it.variant?.price ?? it.product.price;
              return sum + Number(price || 0) * it.quantity;
            }, 0);
            
            if (v.min_order_amount && base < Number(v.min_order_amount)) {
              isApplicable = false;
              reason = `Đơn tối thiểu ${Number(v.min_order_amount).toLocaleString('vi-VN')}₫`;
            }
          } else {
            isApplicable = false;
            reason = 'Không áp dụng cho sản phẩm đã chọn';
          }
        }
  
        return {
          ...entry,
          isApplicable,
          reason,
          preview: isApplicable ? evaluateVoucher(v) : null
        };
      });
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
    // Kiểm tra stock trước khi cập nhật
    if (quantity > cartItem.product.stock) {
      
      return;
    }
    
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

  const removeItem = async (cartItem: CartItem) => {
    const currentCount = queryClient.getQueryData<number>(["cart-count"]) || 0;
    queryClient.setQueryData(["cart-count"], Math.max(0, currentCount - cartItem.quantity));
    
    try {
      const product_id = cartItem.product.id;
      const variant_id = cartItem.variant?.id || null;
      
      let url = `/cart/items/${product_id}`;
      if (variant_id) {
        url += `/${variant_id}`;
      }
      
      await api(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setItems(prev => prev.filter(it => it.id !== cartItem.id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItem.id);
        return newSet;
      });
      queryClient.refetchQueries({ queryKey: ["cart-count"] });

    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      console.error('❌ Error deleting item:', err);
      alert(err?.message || 'Xóa sản phẩm thất bại');
    }
  };

  // Toggle chọn 1 sản phẩm - ĐÃ THÊM KIỂM TRA STOCK
  const toggleItem = (cartItemId: string) => {
    const item = items.find(it => it.id === cartItemId);
    if (!item) return;
    
    // Không cho chọn nếu stock = 0
    if (item.product.stock === 0) {
      alert('Sản phẩm đã hết hàng');
      return;
    }
    
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cartItemId)) newSet.delete(cartItemId);
      else newSet.add(cartItemId);
      return newSet;
    });
  };

  // Toggle chọn tất cả - ĐÃ THÊM KIỂM TRA STOCK
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      // Chỉ chọn những sản phẩm còn hàng
      const availableItems = items.filter(it => it.product.stock > 0);
      setSelectedItems(new Set(availableItems.map(it => it.id)));
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    setSelectAll(items.length > 0 && selectedItems.size === items.length);
  }, [selectedItems, items]);

  // Kiểm tra trước khi checkout - ĐÃ THÊM KIỂM TRA STOCK
  const proceedToCheckout = () => {
    if (selectedItems.size === 0) {
      alert('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }
    
    // Kiểm tra stock của tất cả sản phẩm được chọn
    const outOfStockItems = items.filter(it => 
      selectedItems.has(it.id) && it.product.stock === 0
    );
    
    const lowStockItems = items.filter(it =>
      selectedItems.has(it.id) && it.quantity > it.product.stock
    );
    
    if (outOfStockItems.length > 0) {
      const productNames = outOfStockItems.map(it => it.product.title || it.product.id).join(', ');
      alert(`Các sản phẩm sau đã hết hàng: ${productNames}. Vui lòng bỏ chọn để tiếp tục.`);
      return;
    }
    
    if (lowStockItems.length > 0) {
      const productNames = lowStockItems.map(it => 
        `${it.product.title || it.product.id} (chỉ còn ${it.product.stock})`
      ).join(', ');
      alert(`Số lượng đặt vượt quá tồn kho: ${productNames}. Vui lòng điều chỉnh số lượng.`);
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
                disabled={items.filter(it => it.product.stock > 0).length === 0} // Vô hiệu hóa nếu không có sản phẩm nào còn hàng
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
                const productPrice = it.variant?.price ?? it.product?.price ?? 0;
                const productImage = it.variant?.image || it.product?.images?.[0];
                const itemTotal = productPrice * it.quantity;
                const isOutOfStock = it.product.stock === 0;
                const isLowStock = it.quantity > it.product.stock && it.product.stock > 0;

                return (
                  <div key={it.id} className={`bg-white rounded-sm shadow-sm ${isOutOfStock ? 'opacity-70' : ''}`}>
                    <div className="px-5 py-4 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5 flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(it.id)}
                          className="w-4 h-4 mr-3 flex-shrink-0"
                          disabled={isOutOfStock} // Vô hiệu hóa checkbox nếu hết hàng
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
                            {/* Hiển thị thông báo stock */}
                            {isOutOfStock ? (
                              <div className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Đã hết hàng
                              </div>
                            ) : isLowStock ? (
                              <div className="text-xs text-orange-500 font-medium mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Sản phẩm chỉ còn {it.product.stock}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 text-center">
                        <div className={`${isOutOfStock ? 'text-gray-400' : 'text-gray-900'} font-medium`}>
                          {Number(productPrice).toLocaleString('vi-VN')}₫
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border rounded-sm">
                          <button
                            className={`w-8 h-8 flex items-center justify-center text-gray-600 border-r ${
                              isOutOfStock ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                            }`}
                            onClick={() =>
                              !isOutOfStock && updateQty(it, Math.max(1, it.quantity - 1))
                            }
                            disabled={isOutOfStock || it.quantity <= 1}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={it.product.stock} // Giới hạn max bằng stock
                            value={it.quantity}
                            onChange={e =>
                              !isOutOfStock && updateQty(it, Math.max(1, Number(e.target.value) || 1))
                            }
                            className={`w-12 h-8 text-center border-0 focus:outline-none ${
                              isOutOfStock ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900'
                            }`}
                            disabled={isOutOfStock}
                          />
                          <button
                            className={`w-8 h-8 flex items-center justify-center text-gray-600 border-l ${
                              isOutOfStock ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => !isOutOfStock && updateQty(it, it.quantity + 1)}
                            disabled={isOutOfStock || it.quantity >= it.product.stock}
                          >
                            +
                          </button>
                        </div>
                        
                      </div>

                      <div className="col-span-2 text-center">
                        <div className={`font-medium ${isOutOfStock ? 'text-gray-400' : 'text-orange-500'}`}>
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
              {/* Voucher selection */}
              {token && (
                <div className="bg-white rounded-sm shadow-sm sticky bottom-0">
                  <div className="px-5 py-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center justify-end mr-10 gap-2">
                        
                        <span className="text-sm text-gray-700 ">shoppe voucher:</span>
                      </div>
                      
                      {/* Button bên phải */}
                      <div className="flex items-center">
                        <button
                          onClick={() => setIsVoucherDialogOpen(true)}
                          className="px-4 py-2 text-sm text-blue-500 hover:text-blue-900 rounded-md transition mr-2 flex items-center gap-2"
                        >
                          Chọn Voucher
                          {applicableVouchers.length > 0 && (
                            <span className="bg-white text-gray-500 text-xs px-2 py-0.5 rounded-full">
                              ({applicableVouchers.length})
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <VoucherDialog
                isOpen={isVoucherDialogOpen}
                onClose={() => setIsVoucherDialogOpen(false)}
                applicableVouchers={applicableVouchers}
                selectedVoucherCode={selectedVoucherCode}
                setSelectedVoucherCode={setSelectedVoucherCode}
                evaluateVoucher={evaluateVoucher}
                voucherLoading={voucherLoading}
              />
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 mr-2"
                      disabled={items.filter(it => it.product.stock > 0).length === 0}
                    />
                    <span className="text-sm">
                      Chọn Tất Cả ({items.length})
                      <span className="text-xs text-gray-500 ml-1">
                        ({items.filter(it => it.product.stock > 0).length} sản phẩm còn hàng)
                      </span>
                    </span>
                  </label>
                  <button
                    className="text-sm text-gray-700 hover:text-gray-900"
                    onClick={async () => {
                      if (selectedItems.size === 0) return;
                      
                      try {
                        const itemsToDelete = items.filter(it => selectedItems.has(it.id));
                        queryClient.setQueryData<number>(["cart-count"], 0);
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

                        const failedDeletes = results.filter((result) => 
                          result.status === 'rejected'
                        );

                        if (failedDeletes.length > 0) {
                          console.error('Some items failed to delete:', failedDeletes);
                        }
                        setItems(prev => prev.filter(it => !selectedItems.has(it.id)));
                        setSelectedItems(new Set());
                        queryClient.invalidateQueries({ queryKey: ["cart-count"] });
                        
                        if (failedDeletes.length > 0) {
                          alert(`Đã xóa ${itemsToDelete.length - failedDeletes.length} sản phẩm, ${failedDeletes.length} sản phẩm xóa thất bại`);
                        } 
                      } catch (err: any) {
                        queryClient.invalidateQueries({ queryKey: ["cart-count"] });
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
                    disabled={selectedItems.size === 0 || items.some(it => 
                      selectedItems.has(it.id) && (it.product.stock === 0 || it.quantity > it.product.stock)
                    )}
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