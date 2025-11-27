import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
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
import { Footer } from "../../components/layout/Footer";
import { Header } from "../../components/layout/Header";
import { ProductListSection } from "../../components/product/ProductListSection";

interface EventProduct {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  images?: string[];
  sold?: number;
  discount?: number;
}

export default function EventPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  // Flash sale states
  const [flashProducts, setFlashProducts] = useState<FlashSaleProduct[]>([]);
  const [flashLoading, setFlashLoading] = useState(true);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState<Date | null>(null);

  // Voucher states
  const [adminVouchers, setAdminVouchers] = useState<Voucher[]>([]);
  const [userVouchers, setUserVouchers] = useState<UserVoucherEntry[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(true);
  const [savingVoucherId, setSavingVoucherId] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState("");

  // Product states
  const [eventProducts, setEventProducts] = useState<EventProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const mainBanners = [
    { id: 1, image: "/bannerbig1.png", link: "/flash-sale", alt: "Banner 1" },
    { id: 2, image: "/bannerbig2.png", link: "/flash-sale", alt: "Banner 2" },
    { id: 3, image: "/bannerbig3.png", link: "/flash-sale", alt: "Banner 3" },
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 4000,
  };

  // Utility functions
  const formatPrice = (value?: number) =>
    value ? value.toLocaleString("vi-VN") : "0";

  const isSaved = (voucherId: string) =>
    userVouchers.some((entry) => entry.voucher.id === voucherId);

  // Fetch flash sale products
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        setFlashLoading(true);
        const res = await getFlashSaleProducts({ limit: 12 });
        setFlashProducts(res.products || []);
        
        // Set flash sale end time (24 hours from now as default)
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 24);
        setFlashSaleEndTime(endTime);
      } catch (error) {
        console.error("Không thể tải flash sale:", error);
      } finally {
        setFlashLoading(false);
      }
    };
    fetchFlashSale();
  }, []);

  // Fetch event products
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

  // Fetch admin vouchers
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

  // Fetch user vouchers
  useEffect(() => {
    if (!token) {
      setUserVouchers([]);
      return;
    }
    getUserVouchers(token)
      .then((res) => setUserVouchers(res.vouchers || []))
      .catch((error) => console.error("Không thể tải voucher của bạn:", error));
  }, [token]);

  // Update countdown every second


  // Event handlers
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

  // Filter flash sale vouchers
  const flashSaleVouchers = adminVouchers.filter((voucher) =>
    voucher.code.startsWith("FLASHSALE")
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Main Banner Slider */}
        <section className="rounded-2xl overflow-hidden shadow-sm">
          <Slider {...sliderSettings}>
            {mainBanners.map((banner) => (
              <a key={banner.id} href={banner.link}>
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </Slider>
        </section>

        {/* Flash Sale Products */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-orange-500 font-semibold uppercase">
              Flash Sale
            </p>
            <button
              onClick={() => navigate("/flash-sale")}
              className="text-orange-500 font-semibold hover:text-orange-600 flex items-center gap-2 transition"
            >
              Xem thêm
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
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
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-orange-500 transition">
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

        {/* Secondary Banner */}
        <section className="rounded-2xl overflow-hidden shadow-sm">
          <img
            src="/bannerbig2.png"
            alt="Banner khuyến mãi"
            className="w-full h-full object-cover"
          />
        </section>

        {/* Admin Vouchers */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-gray-900 uppercase">
              Voucher độc quyền
            </p>
            {token ? (
              <p className="text-sm text-gray-500">
                {userVouchers.length} voucher đã lưu
              </p>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition"
              >
                Đăng nhập để lưu nhanh
              </button>
            )}
          </div>

          {voucherError && (
            <p className="text-sm text-red-500">{voucherError}</p>
          )}

          {voucherLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 animate-pulse h-24"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : flashSaleVouchers.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-xl">
              Chưa có voucher nào
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flashSaleVouchers.map((voucher) => {
                const discountLabel =
                  voucher.discount_type === "PERCENT"
                    ? `${voucher.discount_value}%`
                    : `₫${Number(voucher.discount_value).toLocaleString("vi-VN")}`;
                const minOrder = Number(voucher.min_order_amount ?? 0);
                const isVoucherSaved = isSaved(voucher.id);
                const isShopVoucher = voucher.type === "SHOP";

                return (
                  <div
                    key={voucher.id}
                    className="border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-orange-600">
                          {voucher.code}
                        </h3>
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
                      {isShopVoucher ? (
                        <button
                          onClick={() => !isVoucherSaved && handleSaveVoucher(voucher.id)}
                          disabled={savingVoucherId === voucher.id || isVoucherSaved}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            isVoucherSaved
                              ? "bg-orange-500 text-white cursor-default"
                              : "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                          }`}
                        >
                          {savingVoucherId === voucher.id
                            ? "Đang lưu..."
                            : isVoucherSaved
                            ? "Đã lưu"
                            : "Lưu mã"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                          Tự động áp dụng
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Product List Section */}
        <ProductListSection
          title="Đề xuất"
          products={eventProducts}
          horizontal={false}
          lazyLoad={true}
        />
      </div>

      <Footer />
    </div>
  );
}