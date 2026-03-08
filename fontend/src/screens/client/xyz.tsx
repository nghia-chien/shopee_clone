import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  getFlashSaleProducts,
  type FlashSaleProduct,
} from "../../api/userapi/client";
import {
  fetchPublicVouchers,
  getUserVouchers,
  saveVoucher,
  type UserVoucherEntry,
  type Voucher,
} from "../../api/userapi/vouchers";
import { useAuthStore } from "../../store/auth";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";

interface EventProduct {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  images?: string[];
  sold?: number;
  discount?: number;
}

export default function TestPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [flashProducts, setFlashProducts] = useState<FlashSaleProduct[]>([]);
  const [flashLoading, setFlashLoading] = useState(true);

  const [adminVouchers, setAdminVouchers] = useState<Voucher[]>([]);
  const [userVouchers, setUserVouchers] = useState<UserVoucherEntry[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(true);
  const [savingVoucherId, setSavingVoucherId] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState("");

  const [eventProducts, setEventProducts] = useState<EventProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const formatPrice = (value?: number) =>
    value ? value.toLocaleString("vi-VN") : "0";

  const isSaved = (voucherId: string) =>
    userVouchers.some((entry) => entry.voucher.id === voucherId);

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        setFlashLoading(true);
        const res = await getFlashSaleProducts({ limit: 12 });
        setFlashProducts(res.products || []);
      } catch (error) {
        console.error("Không thể tải flash sale:", error);
      } finally {
        setFlashLoading(false);
      }
    };
    fetchFlashSale();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        setProductsError("");
        const res = await api<{ items: EventProduct[] }>("/products?limit=12");
        setEventProducts(res.items || []);
      } catch (error: any) {
        setProductsError(error?.message || "Không thể tải sản phẩm");
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        setVoucherLoading(true);
        setVoucherError("");
        const res = await fetchPublicVouchers({ source: "ADMIN" });
        setAdminVouchers(res.vouchers || []);
      } catch (error: any) {
        setVoucherError(error?.message || "Không thể tải voucher");
      } finally {
        setVoucherLoading(false);
      }
    };
    loadVouchers();
  }, []);

  useEffect(() => {
    if (!token) {
      setUserVouchers([]);
      return;
    }
    getUserVouchers(token)
      .then((res) => setUserVouchers(res.vouchers || []))
      .catch((error) => console.error("Không thể tải voucher của bạn:", error));
  }, [token]);

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleSaveVoucher = async (voucherId: string) => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setSavingVoucherId(voucherId);
      await saveVoucher(voucherId, token);
      const res = await getUserVouchers(token);
      setUserVouchers(res.vouchers || []);
    } catch (error: any) {
      alert(error?.message || "Không thể lưu voucher");
    } finally {
      setSavingVoucherId(null);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Banner chính */}
        <section className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-orange-500 to-pink-500">
          <div className="relative h-48 md:h-64 flex items-center justify-between px-8">
            <div className="text-white max-w-md">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">XEM LIVE - SÂN DEAL SỐC</h1>
              <p className="text-lg md:text-xl opacity-90">DEAL SIÊU RẺ CHO GIỚI TRẺ</p>
              <button className="mt-4 bg-white text-orange-500 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                Xem ngay
              </button>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold text-center">LIVE<br />NOW</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sản phẩm có voucher riêng */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sản phẩm có voucher riêng</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Đang bán
                </span>
                <span>•</span>
                <span className="text-orange-500 font-semibold">Giảm tới 45K</span>
              </div>
            </div>
            <button className="text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1">
              Xem tất cả
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {flashLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="animate-pulse">
                  <div className="w-full h-32 bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {flashProducts.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition cursor-pointer group"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="relative mb-2">
                    {product.images?.length ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg" />
                    )}
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Voucher
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-orange-500">
                    {product.title}
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-500 font-bold text-sm">
                      ₫{formatPrice(product.price)}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-gray-400 text-xs line-through">
                        ₫{formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Đã bán {product.sold || 0}</span>
                    {product.discount && (
                      <span className="text-green-600">-{product.discount}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Banner phụ */}
        <section className="rounded-2xl overflow-hidden shadow-sm">
          <img
            src="/bannerbig2.png"
            alt="Khuyến mãi đặc biệt"
            className="w-full h-32 md:h-40 object-cover"
          />
        </section>

        {/* Voucher để user lưu */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Voucher để lưu</h2>
              <p className="text-sm text-gray-600">Lưu voucher và sử dụng cho đơn hàng tiếp theo</p>
            </div>
            {token && (
              <span className="text-sm text-gray-500">
                {userVouchers.length} voucher đã lưu
              </span>
            )}
          </div>

          {voucherError && (
            <p className="text-sm text-red-500 mb-4">{voucherError}</p>
          )}

          {voucherLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="border-2 border-dashed border-gray-300 rounded-xl p-4 animate-pulse h-24">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : adminVouchers.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-xl">
              Chưa có voucher nào
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminVouchers.map((voucher) => {
                const discountLabel =
                  voucher.discount_type === "PERCENT"
                    ? `${voucher.discount_value}%`
                    : `₫${Number(voucher.discount_value).toLocaleString("vi-VN")}`;
                const minOrder = Number(voucher.min_order_amount ?? 0);
                const isVoucherSaved = isSaved(voucher.id);
                
                return (
                  <div
                    key={voucher.id}
                    className={`border-2 border-dashed rounded-xl p-4 ${
                      isVoucherSaved 
                        ? 'border-orange-300 bg-orange-50' 
                        : 'border-orange-300 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-orange-600">{voucher.code}</h3>
                        <p className="text-sm text-gray-700 font-semibold">
                          Giảm {discountLabel}
                        </p>
                        {minOrder > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Đơn tối thiểu ₫{minOrder.toLocaleString("vi-VN")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        HSD: {new Date(voucher.end_at).toLocaleDateString("vi-VN")}
                      </span>
                      <button
                        onClick={() => !isVoucherSaved && handleSaveVoucher(voucher.id)}
                        disabled={savingVoucherId === voucher.id || isVoucherSaved}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                          isVoucherSaved
                            ? 'bg-orange-500 text-white cursor-default'
                            : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
                        }`}
                      >
                        {savingVoucherId === voucher.id 
                          ? "Đang lưu..." 
                          : isVoucherSaved 
                            ? "Đã lưu" 
                            : "Lưu mã"
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!token && (
            <div className="text-center mt-6">
              <button
                onClick={() => navigate("/login")}
                className="text-orange-500 font-semibold hover:text-orange-600"
              >
                Đăng nhập để lưu voucher
              </button>
            </div>
          )}
        </section>

        {/* Sản phẩm có voucher chung */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sản phẩm áp dụng voucher chung</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                  DEAL45K
                </span>
                <span>Áp dụng cho tất cả sản phẩm</span>
              </div>
            </div>
            <button className="text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1">
              Xem thêm
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="animate-pulse">
                  <div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {eventProducts.slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition cursor-pointer group"
                  onClick={() => handleProductClick(product.id)}
                >
                  {product.images?.length ? (
                    <img
                      src={product.images[0]}
                      alt={product.title || product.name || "Sản phẩm"}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-lg mb-3" />
                  )}
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-orange-500">
                    {product.title || product.name || "Sản phẩm"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-500 font-bold">
                      ₫{formatPrice(product.price)}
                    </span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Dùng DEAL45K
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sản phẩm thường */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sản phẩm đề xuất</h2>
            <button className="text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-1">
              Xem thêm
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {productsError && (
            <p className="text-sm text-red-500 mb-4">{productsError}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {eventProducts.slice(8, 14).map((product) => (
              <div
                key={product.id}
                className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition cursor-pointer group"
                onClick={() => handleProductClick(product.id)}
              >
                {product.images?.length ? (
                  <img
                    src={product.images[0]}
                    alt={product.title || product.name || "Sản phẩm"}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-2" />
                )}
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-orange-500">
                  {product.title || product.name || "Sản phẩm"}
                </p>
                <p className="text-orange-500 font-bold text-sm">
                  ₫{formatPrice(product.price)}
                </p>
                {product.discount && (
                  <p className="text-xs text-green-600 mt-1">Giảm {product.discount}%</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}