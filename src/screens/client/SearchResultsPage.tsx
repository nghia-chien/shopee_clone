import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/userapi/client";
import { ProductListSection } from "../../components/product/ProductListSection"; //
import FeaturedShops  from "../../components/shops/FeaturedShops"; 
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
interface Product {
  id: string;
  title: string;
  price: number;
  images?: string[];
  seller?: { id: string; name: string };
}

interface Shop {
  id: string;
  name: string;
}


export default function SearchResultsPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";
  const type = params.get("type") || "product"; // 'shop' hoặc 'product'


  const { data: results = { products: [], shops: [] }, isLoading } = useQuery({
  queryKey: ["search", query],
  queryFn: async () => {
    if (!query) return { products: [], shops: [] };
    const res = await api<{ products: Product[]; shops: Shop[] }>(
      `/products/search?q=${encodeURIComponent(query)}`
    );
    return res;
  },
  enabled: !!query,
});


  if (isLoading) return <p>Đang tải...</p>;
  if (!query) return <p>Nhập từ khóa để tìm kiếm</p>;


return (
  <div className="bg-gray-50 min-h-screen"><Header/>
    <div className="container mx-auto p-4">
      

      {/* --- Nếu không có kết quả --- */}
      {results.products.length === 0 && results.shops.length === 0 ? (
        <p>Không tìm thấy kết quả nào</p>
      ) : (
        <>
          {/* --- Shop Section --- */}
          {results.shops.length > 0 && (
            <FeaturedShops
              shops={results.shops.map((shop) => ({
                shop_id: shop.id,
                shop_name: shop.name,
                total_products: (shop as any).total_products ?? 0,
                avg_rating: (shop as any).avg_rating ?? 0,
              }))}
            />
          )}


          {/* --- Product Section --- */}
          {type !== "shop" && results.products.length > 0 && (
            <ProductListSection
              title="Sản phẩm"
              products={results.products}
              lazyLoad={true} // ✅ cuộn vô hạn
              horizontal={false} // ✅ dạng lưới
            />
          )}
        </>
      )}
      
    </div><Footer/></div>
  );
}
