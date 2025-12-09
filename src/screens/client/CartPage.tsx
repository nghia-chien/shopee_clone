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
  stock?: number; // THÊM TRƯỜNG NÀY
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
  // Thêm debug
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
    
    // Debug: kiểm tra variant stock
    console.log('Cart items with variant stock:', 
      data.items?.map(item => ({
        product_id: item.product.id,
        product_stock: item.product.stock,
        variant_id: item.variant?.id,
        variant_title: item.variant?.title,
        variant_stock: item.variant?.stock,
        has_variant: !!item.variant?.id
      }))
    );
    
    setItems(data.items || []);
  } catch (err) {
    console.error(err);
    alert('Không tải được giỏ hàng');
  } finally {
    setLoading(false);
  }
};
  // Hàm helper lấy stock thực tế (variant stock hoặc product stock)
  const getActualStock = (item: CartItem): number => {
    // Ưu tiên variant stock nếu có
    if (item.variant?.stock !== undefined && item.variant.stock !== null) {
      return item.variant.stock;
    }
    // Fallback về product stock
    return item.product.stock || 0;
  };

  // Hàm helper kiểm tra có phải variant hay không
  const hasVariant = (item: CartItem): boolean => {
    return !!item.variant?.id;
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

      // Lấy cart hiện tại
      const currentCart = await api('/cart', {
        headers: { Authorization: `Bearer ${token}` },
      }) as { items: any[] };

      // Nhóm sản phẩm cần thêm theo product_id + variant_id
      const itemsToAdd = reorderData.items;
      
      for (const item of itemsToAdd) {
        try {
          // Kiểm tra xem sản phẩm đã có trong cart chưa
          const existingItem = currentCart.items.find(cartItem => {
            // Sản phẩm có variant: so sánh cả product_id và variant_id
            if (item.variant_id) {
              return cartItem.product_id === item.product_id && 
                    cartItem.variant_id === item.variant_id;
            }
            // Sản phẩm không variant: chỉ so sánh product_id, variant_id phải null/undefined
            else {
              return cartItem.product_id === item.product_id && 
                    (!cartItem.variant_id || cartItem.variant_id === null);
            }
          });

          if (existingItem) {
            // Nếu đã có, update quantity (hoặc skip tùy logic)
            console.log('Item already in cart, skipping:', item.product_id);
            continue; // Hoặc gọi API update quantity
          }

          // Chỉ thêm nếu chưa có trong cart
          const requestBody: any = {
            product_id: item.product_id,
            quantity: item.quantity,
          };

          // CHỈ thêm variant_id nếu có giá trị
          if (item.variant_id) {
            requestBody.variant_id = item.variant_id;
          }
          // Nếu không có variant_id, KHÔNG gửi field variant_id

          await api('/cart/items', {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
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
    const actualStock = getActualStock(cartItem);
    
    // Kiểm tra stock trước khi cập nhật
    if (quantity > actualStock) {
      alert(`Số lượng vượt quá tồn kho. Chỉ còn ${actualStock} sản phẩm${hasVariant(cartItem) ? ' (variant này)' : ''}`);
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
      
      // Cập nhật UI
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
    
    const actualStock = getActualStock(item);
    
    // Không cho chọn nếu stock = 0
    if (actualStock === 0) {
      alert(`Sản phẩm${hasVariant(item) ? ' (variant này)' : ''} đã hết hàng`);
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
      // Chỉ chọn những sản phẩm còn hàng (dùng actual stock)
      const availableItems = items.filter(it => {
        const actualStock = getActualStock(it);
        return actualStock > it.quantity;
      });
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
    const outOfStockItems = items.filter(it => {
      if (!selectedItems.has(it.id)) return false;
      const actualStock = getActualStock(it);
      return actualStock === 0;
    });
    
    const lowStockItems = items.filter(it => {
      if (!selectedItems.has(it.id)) return false;
      const actualStock = getActualStock(it);
      return it.quantity > actualStock;
    });
    
    if (outOfStockItems.length > 0) {
      const productNames = outOfStockItems.map(it => {
        const name = it.product.title || it.product.id;
        const variantInfo = hasVariant(it) ? ` (${it.variant?.title})` : '';
        return `${name}${variantInfo}`;
      }).join(', ');
      
      alert(`Các sản phẩm sau đã hết hàng: ${productNames}. Vui lòng bỏ chọn để tiếp tục.`);
      return;
    }
    
    if (lowStockItems.length > 0) {
      const productNames = lowStockItems.map(it => {
        const name = it.product.title || it.product.id;
        const variantInfo = hasVariant(it) ? ` (${it.variant?.title})` : '';
        const actualStock = getActualStock(it);
        return `${name}${variantInfo} (chỉ còn ${actualStock})`;
      }).join(', ');
      
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
                const actualStock = getActualStock(it);
                const isOutOfStock = actualStock === 0;
                const isLowStock = it.quantity > actualStock && actualStock > 0;
                const variantInfo = hasVariant(it) ? ` (${it.variant?.title})` : '';

                return (
                  <div key={it.id} className={`bg-white rounded-sm shadow-sm ${isOutOfStock||isLowStock ? 'opacity-70' : ''}  `}>
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
                                
                                Đã hết hàng
                              </div>
                            ) : isLowStock ? (
                              <div className="text-xs text-orange-500 font-medium mt-1 flex items-center gap-1">
                                
                                Sản phẩm{variantInfo} chỉ còn {actualStock}
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
                          {/* Input số lượng */}
                          <input
                            type="number"
                            min={1}
                            max={getActualStock(it)} // Dùng actual stock thay vì product.stock
                            value={it.quantity}
                            onChange={e =>
                              !isOutOfStock && updateQty(it, Math.max(1, Number(e.target.value) || 1))
                            }
                            className={`w-12 h-8 text-center border-0 focus:outline-none ${
                              isOutOfStock ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-900'
                            }`}
                            disabled={isOutOfStock}
                          />

                          {/* Nút tăng số lượng */}
                          <button
                            className={`w-8 h-8 flex items-center justify-center text-gray-600 border-l ${
                              isOutOfStock ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => !isOutOfStock && updateQty(it, it.quantity + 1)}
                            disabled={isOutOfStock || it.quantity >= getActualStock(it)} // Dùng actual stock
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
                    <div className="text-sm">
                      Chọn Tất Cả ({items.length})
                      <span className="text-xs text-gray-500 ml-1">
                        ({items.filter(it => getActualStock(it) > 0).length} sản phẩm còn hàng)
                      </span>
                    </div>
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