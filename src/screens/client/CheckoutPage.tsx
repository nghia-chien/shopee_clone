import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { useAuthStore } from '../../store/auth';
import { api } from '../../api/userapi/client';
import { getUserVouchers } from '../../api/userapi/vouchers';
import type { UserVoucherEntry, Voucher } from '../../api/userapi/vouchers';
import {
  type Address,
  createAddress,
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
  stock: number;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: CartProduct;
}

interface ShopInfo {
  shop_id: string;
  shop_name: string;
  phone_number?: string;
  address?: string;
  follower_count?: string;
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
    description: 'Nhận từ 23 Th11 - 26 Th11',
    fee: 1000,
  },
  {
    id: 'standard',
    label: 'Tiết kiệm',
    description: 'Nhận từ 22 Th11 - 23 Th11',
    fee: 0,
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
  const [note, setNote] = useState('');
  const [shopInfos, setShopInfos] = useState<Record<string, ShopInfo>>({});
  const [voucherEntries, setVoucherEntries] = useState<UserVoucherEntry[]>([]);
  const [fetchingVoucher, setFetchingVoucher] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: user?.name || '',
    phone: user?.phone_number || '',
    address_line: '',
    city: '',
    district: '',
    ward: '',
    is_default: true,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const fetchedShopIds = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    if (!token || !preselectedVoucher) return;
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
  }, [token, preselectedVoucher]);

  const loadAddresses = useCallback(async () => {
    if (!token) return;
    try {
      setAddressLoading(true);
      const data = await getAddresses();
      setAddresses(data.addresses || []);
      if ((data.addresses || []).length === 0) {
        setShowAddressForm(true);
      }
    } catch (error: any) {
      console.error('Không thể tải địa chỉ:', error);
      setAddressError(error?.message || 'Không thể tải địa chỉ');
    } finally {
      setAddressLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

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

  const appliedVoucher = useMemo(() => {
    if (!preselectedVoucher) return null;
    const entry = voucherEntries.find((v) => v.voucher.code === preselectedVoucher);
    if (!entry) return null;
    return evaluateVoucher(entry.voucher, items);
  }, [preselectedVoucher, voucherEntries, items]);

  const defaultAddress = useMemo(() => {
    if (!addresses.length) return null;
    return addresses.find((addr) => addr.is_default) ?? addresses[0];
  }, [addresses]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0),
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

  const finalizeOrder = useCallback(
    async (options?: { paymentIntent?: string }) => {
      if (!token) {
        navigate('/login');
        return;
      }
      if (!cartItemIds.length) {
        alert('Không có sản phẩm để đặt hàng');
        return;
      }
      if (!defaultAddress) {
        alert('Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng');
        return;
      }
      try {
        setPlacingOrder(true);
        await api('/orders', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            cart_item_ids: cartItemIds,
            voucher_code: preselectedVoucher || undefined,
            payment_method: paymentMethod,
            shipping_option: shippingOption,
            note: note?.trim() || undefined,
            shipping_address_id: defaultAddress.id,
            paypal_order_id: options?.paymentIntent,
          }),
        });
        alert('Đặt hàng thành công');
        navigate('/user/orders');
      } catch (error: any) {
        console.error('Đặt hàng thất bại:', error);
        alert(error?.message || 'Đặt hàng thất bại');
      } finally {
        setPlacingOrder(false);
      }
    },
    [
      cartItemIds,
      defaultAddress,
      navigate,
      note,
      paymentMethod,
      preselectedVoucher,
      shippingOption,
      token,
    ]
  );

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'PAYPAL') {
      
      alert('Vui lòng sử dụng nút PayPal để hoàn tất thanh toán.');
      return;
    }
    await finalizeOrder();
  };

  const handleAddressFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSavingAddress(true);
      setAddressError(null);
      await createAddress(addressForm);
      await loadAddresses();
      setShowAddressForm(false);
      setAddressForm({
        full_name: user?.name || '',
        phone: user?.phone_number || '',
        address_line: '',
        city: '',
        district: '',
        ward: '',
        is_default: false,
      });
    } catch (error: any) {
      setAddressError(error?.message || 'Không thể lưu địa chỉ');
    } finally {
      setSavingAddress(false);
    }
  };

  const ensurePaypalScript = useCallback(() => {
    if (window.paypal) {
      return Promise.resolve(true);
    }
    if (!VITE_PAYPAL_CLIENT_ID) {
      setPaypalError('VITE_PAYPAL_CLIENT_ID chưa được cấu hình.');
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
    
      // Xóa button cũ nếu có
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
            className="px-6 py-2 bg-orange-500 text-white rounded-sm"
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
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-orange-500 cursor-pointer" onClick={() => navigate('/cart')}>
            Giỏ hàng
          </span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Thanh toán</span>
        </div>

        <div className="bg-white rounded-sm shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm uppercase font-semibold">Địa chỉ nhận hàng</p>
              {addressLoading ? (
                <p className="text-gray-500 text-sm">Đang tải địa chỉ...</p>
              ) : defaultAddress ? (
                <>
                  <p className="text-gray-900 font-medium">
                    {defaultAddress.full_name} | {defaultAddress.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    {defaultAddress.address_line}, {defaultAddress.ward}, {defaultAddress.district},{' '}
                    {defaultAddress.city}
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded">
                    Địa chỉ mặc định
                  </span>
                </>
              ) : (
                <p className="text-sm text-red-500">Bạn chưa có địa chỉ nhận hàng.</p>
              )}
            </div>
            <button
              className="text-sm text-orange-500 font-medium"
              onClick={() => setShowAddressForm((prev) => !prev)}
            >
              {defaultAddress ? 'Thêm địa chỉ mới' : 'Thêm địa chỉ'}
            </button>
          </div>
          {addressError && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded p-3">
              {addressError}
            </div>
          )}
          {showAddressForm && (
            <form className="grid md:grid-cols-2 gap-4 pt-4 border-t" onSubmit={handleAddressFormSubmit}>
              <input
                required
                placeholder="Họ và tên"
                value={addressForm.full_name}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, full_name: e.target.value }))}
                className="border rounded-sm px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Số điện thoại"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="border rounded-sm px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Địa chỉ cụ thể"
                value={addressForm.address_line}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, address_line: e.target.value }))}
                className="border rounded-sm px-3 py-2 text-sm md:col-span-2"
              />
              <input
                required
                placeholder="Phường/Xã"
                value={addressForm.ward}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, ward: e.target.value }))}
                className="border rounded-sm px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Quận/Huyện"
                value={addressForm.district}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                className="border rounded-sm px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Tỉnh/Thành phố"
                value={addressForm.city}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                className="border rounded-sm px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))
                  }
                />
                Đặt làm địa chỉ mặc định
              </label>
              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-sm text-sm disabled:opacity-50"
                  disabled={savingAddress}
                >
                  {savingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}
                </button>
                <button
                  type="button"
                  className="text-sm text-gray-600"
                  onClick={() => setShowAddressForm(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white rounded-sm shadow-sm">
          <div className="px-5 py-4 grid grid-cols-12 gap-4 text-sm text-gray-600 font-medium border-b">
            <div className="col-span-5">Sản phẩm</div>
            <div className="col-span-2 text-center">Đơn giá</div>
            <div className="col-span-2 text-center">Số lượng</div>
            <div className="col-span-2 text-center">Thành tiền</div>
            <div className="col-span-1 text-center">Ghi chú</div>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Đang tải sản phẩm...</div>
          ) : (
            <div className="divide-y">
              {groupedItems.map(([sellerId, sellerItems]) => {
                const shop = sellerId !== 'unknown' ? shopInfos[sellerId] : undefined;
                return (
                  <div key={sellerId}>
                    <div className="px-5 py-3 flex items-center gap-2 text-sm text-gray-700 bg-orange-50">
                      <span className="text-orange-500 font-semibold uppercase text-xs border border-orange-200 px-2 py-0.5 rounded-sm">
                        Yêu thích
                      </span>
                      <span className="font-medium">
                        {shop?.shop_name || `Shop ${sellerId.slice(-4)}`}
                      </span>
                    </div>
                    {sellerItems.map((item) => {
                      const itemTotal = Number(item.product.price || 0) * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="px-5 py-4 grid grid-cols-12 gap-4 items-center text-sm text-gray-700"
                        >
                          <div className="col-span-5 flex items-center gap-3">
                            <div className="w-20 h-20 border rounded-sm overflow-hidden bg-gray-100">
                              {item.product.images?.length ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.title || item.product_id}
                                  className="w-full h-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 line-clamp-2">
                                {item.product.title || item.product_id}
                              </p>
                              <p className="text-xs text-gray-500">
                                Phân loại: {item.product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-2 text-center text-gray-900 font-medium">
                            ₫{Number(item.product.price || 0).toLocaleString('vi-VN')}
                          </div>
                          <div className="col-span-2 text-center">{item.quantity}</div>
                          <div className="col-span-2 text-center text-orange-500 font-semibold">
                            ₫{itemTotal.toLocaleString('vi-VN')}
                          </div>
                          <div className="col-span-1 text-center">
                            <input
                              type="text"
                              className="w-full border rounded-sm px-2 py-1 text-xs"
                              placeholder="Lưu ý"
                              onChange={(e) => setNote(e.target.value)}
                            />
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

        <div className="bg-white rounded-sm shadow-sm p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-900 font-semibold">Phương thức vận chuyển</h3>
              <button className="text-sm text-blue-500">Thay đổi</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {SHIPPING_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`border rounded-sm p-4 flex items-center justify-between cursor-pointer ${
                    shippingOption === option.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-500 font-semibold">
                      {option.fee === 0 ? 'Miễn phí' : `₫${option.fee.toLocaleString('vi-VN')}`}
                    </p>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingOption === option.id}
                      onChange={() => setShippingOption(option.id)}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-gray-900 font-semibold mb-3">Shopee Voucher</h3>
            {fetchingVoucher ? (
              <p className="text-sm text-gray-500">Đang kiểm tra voucher...</p>
            ) : preselectedVoucher && appliedVoucher ? (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold">
                  {preselectedVoucher}
                </span>
                <span>Ước tính giảm {appliedVoucher.discount.toLocaleString('vi-VN')}₫</span>
                <button
                  className="text-xs text-gray-500"
                  onClick={() => navigate('/cart')}
                >
                  Thay đổi voucher
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Không có voucher được áp dụng</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-sm shadow-sm p-5 space-y-4">
          <h3 className="text-gray-900 font-semibold">Phương thức thanh toán</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label
              className={`border rounded-md p-4 cursor-pointer flex items-start gap-3 ${
                paymentMethod === 'COD' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                <p className="text-sm text-gray-600">
                  Phù hợp cho đơn nội địa. Người mua thanh toán tiền mặt khi nhận hàng.
                </p>
              </div>
            </label>

            <label
              className={`border rounded-md p-4 cursor-pointer flex flex-col gap-3 ${
                paymentMethod === 'PAYPAL' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'PAYPAL'}
                  onChange={() => setPaymentMethod('PAYPAL')}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-gray-900">Thanh toán bằng PayPal</p>
                  <p className="text-sm text-gray-600">
                    Khung tích hợp sẵn cho PayPal. Sau khi kết nối API, nút thanh toán sẽ hiển thị
                    tại đây.
                  </p>
                </div>
              </div>
              <div
                ref={paypalContainerRef}
                className="w-full min-h-[64px] border border-dashed border-gray-300 rounded-md flex items-center justify-center text-xs text-gray-500"
              >
                {paypalReady
                  ? 'PayPal đang tải...'
                  : 'Khu vực nhúng PayPal Button – cấu hình SDK để hiển thị nút.'}
              </div>
              {paypalError && (
                <p className="text-xs text-red-500">
                  {paypalError} – kiểm tra client ID và API backend của PayPal.
                </p>
              )}
            </label>
          </div>
        </div>

        <div className="bg-white rounded-sm shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Tổng tiền hàng</span>
            <span>₫{subtotal.toLocaleString('vi-VN')}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Voucher giảm</span>
            <span className="text-green-600">
              -₫{voucherDiscount.toLocaleString('vi-VN')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Phí vận chuyển</span>
            <span>{shippingFee === 0 ? 'Miễn phí' : `₫${shippingFee.toLocaleString('vi-VN')}`}</span>
          </div>
          <div className="flex items-center justify-between text-2xl font-semibold text-orange-500 pt-2 border-t">
            <span>Tổng thanh toán</span>
            <span>₫{payableTotal.toLocaleString('vi-VN')}</span>
          </div>
          <div className="text-right">
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || loading || (!defaultAddress && !addressLoading)}
              className="px-8 py-3 bg-orange-500 text-white rounded-sm hover:bg-orange-600 disabled:opacity-50"
            >
              {paymentMethod === 'PAYPAL' ? 'Thanh toán bằng PayPal' : 'Đặt hàng'}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-right">
            Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo Điều khoản Shopee.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default CheckoutPage;

