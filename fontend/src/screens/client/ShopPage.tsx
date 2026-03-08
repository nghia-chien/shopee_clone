import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/userapi/client";
import FeaturedShops from "../../components/shops/FeaturedShops";
import { ProductListSection } from "../../components/product/ProductListSection";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { fetchPublicVouchers, saveVoucher, getUserVouchers } from "../../api/userapi/vouchers";
import type { Voucher } from "../../api/userapi/vouchers";
import { useAuthStore } from "../../store/auth";
import type { UserVoucherEntry } from "../../api/userapi/vouchers";

interface Product {
  id: string;
  title: string;
  price: number;
  rating: number,
  images: string[];
  category?: { id: string; name: string } | string | null;
  seller_name?: string;
}

interface ShopSummary {
  shop_id: string;
  shop_name: string;
  total_products: number;
  avg_rating: number  ;
  avatar?: string; // thêm logo nếu có
}

export default function ShopPage() {
  const { seller_id } = useParams<{ seller_id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [shopInfo, setShopInfo] = useState<ShopSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopVouchers, setShopVouchers] = useState<Voucher[]>([]);
  const [savingVoucherId, setSavingVoucherId] = useState<string | null>(null);
  const [userVouchers, setUserVouchers] = useState<UserVoucherEntry[]>([]);

  // Lấy voucher đã lưu của user
  useEffect(() => {
    if (!token) return;
    getUserVouchers(token).then(data => setUserVouchers(data.vouchers || []));
  }, [token]);

  const isSaved = (voucherId: string) =>
    userVouchers.some(uv => uv.voucher.id === voucherId);

  // Lấy thông tin shop + sản phẩm
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Shop info
        const shopRes = await api<{ shop: ShopSummary }>(`/shops/${seller_id}`);
        setShopInfo(shopRes.shop);
  
        // 2. Products
        const productRes = await api<{ items: Product[] }>(`/shops/${seller_id}/products`);
        
        const items = productRes.items || [];
        setProducts(items);

        const uniqueCategories = Array.from(
          new Map(
            items
              .filter((p) => p.category)
              .map((p) => {
                if (typeof p.category === "object" && p.category !== null) {
                  return [p.category.id, { id: p.category.id, name: p.category.name }];
                }
                return [String(p.category), { id: String(p.category), name: String(p.category) }];
              })
          ).values()
        );
        setCategories(uniqueCategories);

      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu shop:", error);
      } finally {
        setLoading(false);
      }
    };

    if (seller_id) fetchData();
  }, [seller_id]);

  // Lấy voucher public của shop
  useEffect(() => {
    const loadVouchers = async () => {
      if (!seller_id) {
        setShopVouchers([]);
        return;
      }
      try {
        const data = await fetchPublicVouchers({ seller_id });
        setShopVouchers(data.vouchers || []);
      } catch (error) {
        console.error("Không thể tải voucher của shop:", error);
      }
    };
    loadVouchers();
  }, [seller_id]);

  // Lưu voucher
  const handleSaveVoucher = async (voucherId: string) => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      setSavingVoucherId(voucherId);
      const savedVoucher = await saveVoucher(voucherId, token);

      // Cập nhật state userVouchers ngay lập tức
      setUserVouchers(prev => [...prev, savedVoucher.saved]);
      alert("Đã lưu voucher vào kho của bạn");
    } catch (error: any) {
      alert(error?.message || "Không thể lưu voucher");
    } finally {
      setSavingVoucherId(null);
    }
  };


  // Lọc sản phẩm theo danh mục
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => {
      if (!p.category) return false;
      if (typeof p.category === "object") return p.category.id === selectedCategory;
      return p.category === selectedCategory;
    });
  }, [products, selectedCategory]);

  // Lọc voucher shop theo source và product_id
// Lọc voucher shop toàn shop và gắn trạng thái đã lưu
const filteredShopVouchers = useMemo(() => {
  return shopVouchers
    .filter(v => v.source === "SELLER" && v.product_id === null)
    .map(v => ({
      ...v,
      saved: userVouchers.some(uv => uv.voucher.id === v.id && uv.saved_at),
    }));
}, [shopVouchers, userVouchers]);



  if (loading) return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  if (!shopInfo) return <div className="text-center py-10">Không tìm thấy shop</div>;

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <FeaturedShops
          shops={[{
            shop_id: shopInfo.shop_id,
            shop_name: shopInfo.shop_name,
            total_products: shopInfo.total_products,
            avg_rating:Number(shopInfo.avg_rating) || 0,
            avatar: shopInfo.avatar || ""  // ✅ Thêm avatar
          }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="flex flex-col gap-3 bg-white">
            {filteredShopVouchers.length ? (
              filteredShopVouchers.map((v) => {
                const voucherId = String(v.id);
                const discountLabel =
                  v.discount_type === "PERCENT"
                    ? `${v.discount_value}%`
                    : `${Number(v.discount_value).toLocaleString("vi-VN")}₫`;
                const minOrder = Number(v.min_order_amount ?? 0);
                const endAtLabel = v.end_at ? new Date(v.end_at).toLocaleDateString("vi-VN") : "Không rõ";

                return (
                  <div
                    key={voucherId}
                    className="border border-dashed border-orange-400 px-4 py-2 rounded-md text-sm text-gray-700 flex items-center justify-between bg-orange-50 flex-wrap gap-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-orange-600">{discountLabel}</span>
                      {minOrder > 0 && (
                        <span>Đơn tối thiểu {minOrder.toLocaleString("vi-VN")}₫</span>
                      )}
                      <span className="text-xs text-gray-500">HSD: {endAtLabel}</span>
                    </div>

                    <button
                      onClick={() => handleSaveVoucher(voucherId)}
                      disabled={v.saved || savingVoucherId === voucherId}
                      className="px-4 py-1 rounded-full border border-orange-500 text-orange-600 text-xs font-semibold hover:bg-orange-500 hover:text-white transition disabled:opacity-50"
                    >
                      {v.saved ? "Đã lưu" : savingVoucherId === voucherId ? "Đang lưu..." : "Lưu voucher"}
                    </button>
                  </div>
                );
              })
            ) : null }

            </div>
          </div>
        

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full border transition ${
                !selectedCategory
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              Tất cả
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full border transition ${
                  selectedCategory === cat.id
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <ProductListSection
          title={
            selectedCategory
              ? `Danh mục: ${categories.find((c) => c.id === selectedCategory)?.name || ""}`
              : "Tất cả sản phẩm"
          }
          products={filteredProducts}
        />
      </div>
      <Footer />
    </div>
  );
}
