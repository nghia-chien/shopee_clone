import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { AddressDialog } from '../../components/shipping/AddressDialog'; // Import AddressDialog
import { useAuthStore } from '../../store/auth';
import { api } from '../../api/userapi/client';
import { getUserVouchers } from '../../api/userapi/vouchers';
import type { UserVoucherEntry, Voucher } from '../../api/userapi/vouchers';
import {
  type Address,
  getAddresses,
} from '../../api/userapi/account';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => { render: (container: HTMLElement | string) => void };
    };
  }
}

interface CartProduct {
  seller_id: string | null | undefined;
  id: string;
  title?: string;
  images?: string[];
  price: number;
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
  product: CartProduct;
  variant?: CartProductVariant;
}

interface ShopInfo {
  shop_id: string;
  shop_name: string;
  phone_number?: string;
  address?: string;
  follower_count?: string;
  avg_rating?:number;
  avatar?:string;
  shop_mall?:string | 'bth';
}

type PaymentMethod = 'COD' | 'PAYPAL';

interface CheckoutLocationState {
  cartItemIds?: string[];
  voucherCode?: string | null;
} 

const VITE_PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
const PAYPAL_CREATE_ORDER_API =
  import.meta.env.VITE_PAYPAL_CREATE_ORDER_API ?? '/paypal/create-order';
const PAYPAL_CAPTURE_ORDER_API =
  import.meta.env.VITE_PAYPAL_CAPTURE_ORDER_API ?? '/paypal/capture-order';
const PAYPAL_VND_RATE =
  Number(import.meta.env.VITE_PAYPAL_VND_RATE || '24000') > 0
    ? Number(import.meta.env.VITE_PAYPAL_VND_RATE || '24000')
    : 24000;

const SHIPPING_OPTIONS = [
  {
    id: 'fast',
    label: 'Nhanh',
    description: 'Nhận từ 2-3 ngày',
    fee: 30000,
  },
  {
    id: 'standard',
    label: 'Tiết kiệm',
    description: 'Nhận từ 4-7 ngày',
    fee: 15000,
  },
];

function evaluateVoucher(
  voucher: Voucher,
  items: CartItem[]
): { discount: number; base: number } | null {
  const now = Date.now();
  

  if (voucher.status !== 'ACTIVE') return null;
  if (now < new Date(voucher.start_at).getTime() || now > new Date(voucher.end_at).getTime()) {
    return null;
  }

  let applicableItems = [...items];

  if (voucher.source !== 'ADMIN') {
    applicableItems = applicableItems.filter((it) => it.product.seller_id === voucher.seller_id);
  }

  if (voucher.product_id) {
    applicableItems = applicableItems.filter((it) => it.product.id === voucher.product_id);
  }
  
  if (applicableItems.length === 0) {
    return null;
  }

  // Calculate base amount using variant price if available
  const base = applicableItems.reduce(
    (sum, it) => {
      const price = it.variant?.price ?? it.product.price;
      return sum + Number(price || 0) * it.quantity;
    },
    0
  );


  const minOrder = Number(voucher.min_order_amount ?? 0);
  if (minOrder > 0 && base < minOrder) {
    return null;
  }
  let discount =
    voucher.discount_type === 'PERCENT'
      ? (base * Number(voucher.discount_value)) / 100
      : Number(voucher.discount_value);
      

  if (voucher.discount_type === 'PERCENT' && voucher.max_discount_amount) {
    discount = Math.min(discount, Number(voucher.max_discount_amount));
  }
  
  discount = Math.min(discount, base);
  if (discount <= 0) {
    return null;
  }
  return { discount, base };
}

export function CheckoutPage() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as CheckoutLocationState) || {};
  const cartItemIds = state.cartItemIds ?? [];
  const preselectedVoucher = state.voucherCode ?? '';

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [shippingOption, setShippingOption] = useState<string>(SHIPPING_OPTIONS[0].id);
  const [shopInfos, setShopInfos] = useState<Record<string, ShopInfo>>({});
  const [voucherEntries, setVoucherEntries] = useState<UserVoucherEntry[]>([]);
  const [fetchingVoucher, setFetchingVoucher] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const fetchedShopIds = useRef<Set<string>>(new Set());

  // Load cart items for checkout
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!cartItemIds.length) {
      navigate('/cart');
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await api<{ items: CartItem[] }>('/cart', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const selected = data.items?.filter((item) => cartItemIds.includes(item.id)) ?? [];
        if (!selected.length) {
          alert('Không tìm thấy sản phẩm đã chọn, vui lòng chọn lại.');
          navigate('/cart');
          return;
        }
        setItems(selected);
      } catch (error: any) {
        console.error('Không thể tải giỏ hàng cho checkout:', error);
        alert(error?.message || 'Không thể tải dữ liệu giỏ hàng');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, cartItemIds, navigate]);

  // Load user vouchers
  useEffect(() => {
    if (!token) return;
    const fetchVoucher = async () => {
      try {
        setFetchingVoucher(true);
        const data = await getUserVouchers(token);
        setVoucherEntries(data.vouchers || []);
      } catch (error) {
        console.error('Không thể tải voucher:', error);
      } finally {
        setFetchingVoucher(false);
      }
    };
    fetchVoucher();
  }, [token]);

  // Load user addresses và chọn địa chỉ mặc định
  const loadAddresses = useCallback(async () => {
    if (!token) return;
    try {
      setAddressLoading(true);
      const data = await getAddresses();
      const addressList = data.addresses || [];
      setAddresses(addressList);
      
      // Tìm địa chỉ mặc định hoặc đầu tiên
      const defaultAddr = addressList.find(addr => addr.is_default) || addressList[0];
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      }
    } catch (error: any) {
      console.error('Không thể tải địa chỉ:', error);
    } finally {
      setAddressLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAddresses();
  }, [token]);

  // Load shop information
  useEffect(() => {
    const uniqueSellerIds = Array.from(
      new Set(items.map((it) => it.product.seller_id).filter(Boolean) as string[])
    );
    uniqueSellerIds.forEach((sellerId) => {
      if (!fetchedShopIds.current.has(sellerId)) {
        fetchedShopIds.current.add(sellerId);
        api<{ shop: ShopInfo }>(`/shops/${sellerId}`)
          .then((res) => {
            if (res?.shop) {
              setShopInfos((prev) => ({ ...prev, [sellerId]: res.shop }));
            }
          })
          .catch((error) => console.error('Không thể tải thông tin shop:', error));
      }
    });
  }, [items]);

  // Calculate applied voucher
  const appliedVoucher = useMemo(() => {
    if (!preselectedVoucher) return null;
    const entry = voucherEntries.find((v) => v.voucher.code === preselectedVoucher);
    if (!entry) return null;
    return evaluateVoucher(entry.voucher, items);
  }, [preselectedVoucher, voucherEntries, items]);

  // Calculate prices
  const subtotal = useMemo(
    () => items.reduce((sum, item) => {
      const price = item.variant?.price ?? item.product.price;
      return sum + Number(price || 0) * item.quantity;
    }, 0),
    [items]
  );

  const shippingFee =
    SHIPPING_OPTIONS.find((opt) => opt.id === shippingOption)?.fee ?? SHIPPING_OPTIONS[0].fee;
  const voucherDiscount = appliedVoucher?.discount ?? 0;
  const payableTotal = Math.max(0, subtotal - voucherDiscount) + shippingFee;
  const conversionRate = PAYPAL_VND_RATE;
  const paypalAmountUSD = useMemo(() => {
    if (!conversionRate || conversionRate <= 0) return Math.max(0.01, Number((payableTotal / 24000).toFixed(2)));
    return Math.max(0.01, Number((payableTotal / conversionRate).toFixed(2)));
  }, [payableTotal, conversionRate]);

  // Group items by seller
  const groupedItems = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    items.forEach((item) => {
      const key = item.product.seller_id || 'unknown';
      const current = map.get(key) ?? [];
      current.push(item);
      map.set(key, current);
    });
    return Array.from(map.entries());
  }, [items]);

  // Xử lý chọn địa chỉ từ dialog
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setAddressDialogOpen(false);
  };

  // Finalize order function
  const finalizeOrder = useCallback(
    async (options?: { paymentIntent?: string }) => {
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Reset error
      setOrderError(null);
      
      // Kiểm tra đơn giản: có địa chỉ không
      if (!selectedAddress) {
        setOrderError('Địa chỉ hoặc  không đúng');
        return;
      }
      
      // Kiểm tra đơn giản: số điện thoại không trống
      if (!selectedAddress.phone || selectedAddress.phone.trim().length < 10) {
        setOrderError(' số điện thoại không đúng');
        return;
      }
      
      // Kiểm tra địa chỉ có đủ thông tin
      if (!selectedAddress.address_line || !selectedAddress.city || !selectedAddress.district || !selectedAddress.ward) {
        setOrderError('Địa chỉ hoặc không đúng');
        return;
      }
      
      if (!cartItemIds.length) {
        setOrderError('Không có sản phẩm để đặt hàng');
        return;
      }
      
      try {
        setPlacingOrder(true);
        
        await api('/orders', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cart_item_ids: cartItemIds,
            voucher_code: preselectedVoucher || undefined,
            payment_method: paymentMethod,
            shipping_option: shippingOption,
            address_id: selectedAddress.id,
            paypal_order_id: options?.paymentIntent,
          }),
        });
        
        navigate('/user/orders');
      } catch (error: any) {
        console.error('Đặt hàng thất bại:', error);
        // Nếu server trả lỗi về địa chỉ/số điện thoại
        const errorMessage = error?.response?.data?.message || '';
        if (errorMessage.toLowerCase().includes('address') || 
            errorMessage.toLowerCase().includes('phone') ||
            errorMessage.toLowerCase().includes('địa chỉ') ||
            errorMessage.toLowerCase().includes('số điện thoại')) {
          setOrderError(errorMessage + ' không đúng');
        } else {
          setOrderError('Đặt hàng thất bại. Vui lòng thử lại sau.');
        }
      } finally {
        setPlacingOrder(false);
      }
    },
    [
      cartItemIds,
      selectedAddress,
      navigate,
      paymentMethod,
      preselectedVoucher,
      shippingOption,
      token,
    ]
  );

  // Handle place order
  const handlePlaceOrder = async () => {
    if (paymentMethod === 'PAYPAL') {
      alert('Vui lòng sử dụng nút PayPal để hoàn tất thanh toán.');
      return;
    }
    
    setOrderError(null);
    await finalizeOrder();
  };

  // PayPal integration
  const ensurePaypalScript = useCallback(() => {
    if (window.paypal) {
      return Promise.resolve(true);
    }
    if (!VITE_PAYPAL_CLIENT_ID) {
      setPaypalError('PayPal chưa được cấu hình.');
      return Promise.reject(new Error('PayPal client id missing'));
    }
    return new Promise<boolean>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${VITE_PAYPAL_CLIENT_ID}&currency=USD`;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Không thể tải SDK PayPal'));
      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    if (paymentMethod !== 'PAYPAL') return;
    
    let mounted = true;
    setPaypalError(null);
    
    const renderPayPalButtons = async () => {
      try {
        await ensurePaypalScript();
        if (!mounted || !window.paypal || !paypalContainerRef.current) return;
        
        setPaypalReady(true);
        
        // Clear previous buttons
        paypalContainerRef.current.innerHTML = '';
        
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
          },
          createOrder: async () => {
            if (!VITE_PAYPAL_CLIENT_ID) {
              throw new Error('Chưa cấu hình PayPal Client ID');
            }
            try {
              const res = await api<{ orderId: string }>(PAYPAL_CREATE_ORDER_API, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  amount: paypalAmountUSD,
                  currency: 'USD',
                  original_amount_vnd: payableTotal,
                  conversion_rate: conversionRate,
                  cart_item_ids: cartItemIds,
                }),
              });
              return res.orderId;
            } catch (error: any) {
              setPaypalError(error?.message || 'Không tạo được đơn PayPal');
              throw error;
            }
          },
          onApprove: async (data: { orderID: string }) => {
            try {
              await api(PAYPAL_CAPTURE_ORDER_API, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId: data.orderID }),
              });
              await finalizeOrder({ paymentIntent: data.orderID });
            } catch (error: any) {
              console.error('PayPal capture error', error);
              setPaypalError(error?.message || 'Không thể xác nhận thanh toán PayPal');
            }
          },
          onError: (err: any) => {
            console.error('PayPal error', err);
            setPaypalError(err?.message || 'PayPal gặp lỗi');
          },
        }).render(paypalContainerRef.current);
      } catch (error: any) {
        if (!mounted) return;
        setPaypalError(error?.message || 'Không thể khởi tạo PayPal');
      }
    };
    
    renderPayPalButtons();
    
    return () => {
      mounted = false;
    };
  }, [paymentMethod, ensurePaypalScript, paypalAmountUSD, conversionRate, cartItemIds, finalizeOrder, payableTotal]);

  if (!cartItemIds.length) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
          <p className="text-gray-600">Không có sản phẩm nào được chọn để thanh toán.</p>
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-2 bg-orange-500 text-white rounded-sm hover:bg-orange-600 transition-colors"
          >
            Quay lại giỏ hàng
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-orange-500 cursor-pointer hover:text-orange-600" onClick={() => navigate('/cart')}>
            Giỏ hàng
          </span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Thanh toán</span>
        </div>

        {/* Shipping Address với AddressDialog */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm uppercase font-semibold mb-2">Địa chỉ nhận hàng</p>
              {addressLoading ? (
                <p className="text-gray-500 text-sm">Đang tải địa chỉ...</p>
              ) : selectedAddress ? (
                <>
                  <p className="text-gray-900 font-medium">
                    {selectedAddress.full_name} | {selectedAddress.phone}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedAddress.address_line}, {selectedAddress.ward}, {selectedAddress.district},{' '}
                    {selectedAddress.city}
                  </p>
                  {selectedAddress.is_default && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded">
                      Địa chỉ mặc định
                    </span>
                  )}
                </>
              ) : (
                <p className="text-sm text-red-500">Bạn chưa có địa chỉ nhận hàng.</p>
              )}
            </div>
            <button
              className="text-sm text-orange-500 font-medium hover:text-orange-600"
              onClick={() => setAddressDialogOpen(true)}
            >
              {selectedAddress ? 'Thay đổi' : 'Thêm địa chỉ'}
            </button>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 grid grid-cols-12 gap-4 text-sm text-gray-600 font-medium border-b bg-gray-50">
            <div className="col-span-5">Sản phẩm</div>
            <div className="col-span-2 text-center">Đơn giá</div>
            <div className="col-span-2 text-center">Số lượng</div>
            <div className="col-span-2 text-center">Thành tiền</div>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Đang tải sản phẩm...</div>
          ) : (
            <div className="divide-y">
              {groupedItems.map(([sellerId, sellerItems]) => {
                const shop = sellerId !== 'unknown' ? shopInfos[sellerId] : undefined;
                return (
                  <div key={sellerId}>
                    <div className="px-6 py-3 flex items-center gap-2 text-sm text-gray-700 bg-orange-50">
                      <span className="text-orange-500 font-semibold uppercase text-xs border border-orange-200 px-2 py-0.5 rounded">
                        Shop
                      </span>
                      <span className="font-medium">
                        {shop?.shop_name || `Shop ${sellerId.slice(-4)}`}
                      </span>
                    </div>
                    {sellerItems.map((item) => {
                      const price = item.variant?.price ?? item.product.price;
                      const itemTotal = Number(price || 0) * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="px-6 py-4 grid grid-cols-12 gap-4 items-center text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="col-span-5 flex items-center gap-3">
                            <div className="w-20 h-20 border rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {item.product.images?.[0] ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.title || item.product.id}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 line-clamp-2 font-medium">
                                {item.product.title || item.product.id}
                              </p>
                              {item.variant && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Phân loại: {item.variant.title}
                                </p>
                              )}
                              
                            </div>
                          </div>
                          <div className="col-span-2 text-center text-gray-900 font-medium">
                            ₫{Number(price || 0).toLocaleString('vi-VN')}
                          </div>
                          <div className="col-span-2 text-center text-gray-600">
                            {item.quantity}
                          </div>
                          <div className="col-span-2 text-center text-orange-500 font-semibold">
                            ₫{itemTotal.toLocaleString('vi-VN')}
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shipping Options */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Phương thức vận chuyển</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {SHIPPING_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`border rounded-lg p-4 flex items-center justify-between cursor-pointer transition-all ${
                    shippingOption === option.id 
                      ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="text-orange-500 font-semibold">
                      {option.fee === 0 ? 'Miễn phí' : `₫${option.fee.toLocaleString('vi-VN')}`}
                    </p>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingOption === option.id}
                      onChange={() => setShippingOption(option.id)}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Voucher Section */}
          <div className="border-t pt-6">
            <h3 className="text-gray-900 font-semibold mb-4">Voucher</h3>
            {fetchingVoucher ? (
              <p className="text-sm text-gray-500">Đang kiểm tra voucher...</p>
            ) : preselectedVoucher && appliedVoucher ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {preselectedVoucher}
                  </span>
                  <span className="text-sm text-gray-700">
                    Giảm {appliedVoucher.discount.toLocaleString('vi-VN')}₫
                  </span>
                </div>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => navigate('/cart')}
                >
                  Thay đổi
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Không có voucher được áp dụng</p>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h3 className="text-gray-900 font-semibold">Phương thức thanh toán</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* COD Option */}
            <label
              className={`border rounded-lg p-4 cursor-pointer flex items-start gap-3 transition-all ${
                paymentMethod === 'COD' 
                  ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200' 
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
                className="mt-1 text-orange-500 focus:ring-orange-500"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                <p className="text-sm text-gray-600 mt-1">
                  Phù hợp cho đơn nội địa. Thanh toán tiền mặt khi nhận hàng.
                </p>
              </div>
            </label>

            {/* PayPal Option */}
            <label
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                paymentMethod === 'PAYPAL' 
                  ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200' 
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'PAYPAL'}
                  onChange={() => setPaymentMethod('PAYPAL')}
                  className="mt-1 text-orange-500 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Thanh toán bằng PayPal</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Thanh toán an toàn qua PayPal với thẻ Visa, MasterCard hoặc tài khoản PayPal.
                  </p>
                </div>
              </div>
              {paymentMethod === 'PAYPAL' && (
                <div
                  ref={paypalContainerRef}
                  className="w-full min-h-[48px] border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-500 bg-gray-50"
                >
                  {paypalReady ? 'Đang tải PayPal...' : 'Paypal đang xác nhận đơn vui lòng chờ...'}
                </div>
              )}
              {paypalError && (
                <p className="text-xs text-red-500 mt-2">
                  {paypalError}
                </p>
              )}
            </label>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-gray-900 font-semibold text-lg">Tổng thanh toán</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Tổng tiền hàng</span>
              <span>₫{subtotal.toLocaleString('vi-VN')}</span>
            </div>
            
            {voucherDiscount > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Giảm giá voucher</span>
                <span className="text-green-600">
                  -₫{voucherDiscount.toLocaleString('vi-VN')}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? 'Miễn phí' : `₫${shippingFee.toLocaleString('vi-VN')}`}</span>
            </div>
            
            <div className="flex items-center justify-between text-2xl font-semibold text-orange-500 pt-3 border-t">
              <span>Tổng thanh toán</span>
              <span>₫{payableTotal.toLocaleString('vi-VN')}</span>
            </div>
          </div>
          {orderError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600 text-center">
              {orderError}
            </div>
          )}
          <div className="text-right pt-4">
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || loading || !selectedAddress}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {placingOrder ? 'Đang xử lý...' : paymentMethod === 'PAYPAL' ? 'Tiếp tục với PayPal' : 'Đặt hàng'}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center pt-2">
            Bằng cách nhấn "Đặt hàng", bạn đồng ý với{' '}
            <a href="#" className="text-orange-500 hover:underline">Điều khoản dịch vụ</a> của chúng tôi
          </p>
        </div>
      </div>
      <Footer />
      
      {/* Address Dialog */}
      <AddressDialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        onSelect={handleAddressSelect}
        currentAddressId={selectedAddress?.id}
      />
    </div>
  );
}

export default CheckoutPage;