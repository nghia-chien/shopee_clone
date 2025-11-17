import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/userapi/client";
import FeaturedShops from "../../components/shops/FeaturedShops";
import { ProductListSection } from "../../components/product/ProductListSection";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  category?: { id: string; name: string } | string | null;
  seller_name?: string;
}

interface ShopSummary {
  shop_id: string;
  shop_name: string;
  total_products: number;
  avg_rating: number | null;
  vouchers?: { id: string; discount: number; min_order: number }[];
}

export default function ShopPage() {
  const { seller_id } = useParams<{ seller_id: string }>();
  const [shopInfo, setShopInfo] = useState<ShopSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const shopRes = await api<{ shop: ShopSummary }>(`/shops/${seller_id}`);
        setShopInfo(shopRes.shop);

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

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => {
      if (!p.category) return false;
      if (typeof p.category === "object") return p.category.id === selectedCategory;
      return p.category === selectedCategory;
    });
  }, [products, selectedCategory]);

  if (loading) return <div className="text-center py-10">Đang tải dữ liệu...</div>;
  if (!shopInfo) return <div className="text-center py-10">Không tìm thấy shop</div>;

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <FeaturedShops
          shops={[
            {
              shop_id: shopInfo.shop_id,
              shop_name: shopInfo.shop_name,
              total_products: shopInfo.total_products,
              avg_rating: typeof shopInfo.avg_rating === "number" ? shopInfo.avg_rating : 0,
            },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="md:col-span-3 bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">🎟️ Voucher của shop</h3>
            <div className="flex flex-wrap gap-3">
              {shopInfo?.vouchers?.length ? (
                shopInfo.vouchers.map((v) => (
                  <div
                    key={v.id}
                    className="border border-dashed border-orange-400 px-4 py-2 rounded-md text-sm text-gray-700 flex items-center gap-2 bg-orange-50"
                  >
                    <span className="font-semibold text-orange-600">{v.discount}%</span>
                    <span>cho đơn từ {v.min_order.toLocaleString()}₫</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Chưa có voucher nào</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold mb-3">✨ Gợi ý cho bạn</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="hover:text-orange-500 cursor-pointer">Sản phẩm bán chạy</li>
              <li className="hover:text-orange-500 cursor-pointer">Sản phẩm giảm giá</li>
              <li className="hover:text-orange-500 cursor-pointer">Mới về hôm nay</li>
              <li className="hover:text-orange-500 cursor-pointer">Gợi ý theo xu hướng</li>
            </ul>
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
