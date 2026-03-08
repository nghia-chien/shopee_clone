import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth";
import { ProductListSection } from "../../components/product/ProductListSection"; //
import FeaturedShops  from "../../components/shops/FeaturedShops"; 
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import SearchFilters from "../../components/home/SearchFilters";
import SearchSortBar from "../../components/home/SearchSortBar";
interface Product {
  id: string;
  title: string;
  price: number;
  images?: string[];
  seller?: { id: string; name: string };
}
interface Shop {
  shop_id: string;
  shop_name: string;
  total_products: number;
  avg_rating: number ;
  avatar?: string; // thêm logo nếu có
}


export default function SearchResultsPage() {
  const location = useLocation();
  const { token } = useAuthStore();
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";
  const type = params.get("type") || "product"; // 'shop' hoặc 'product'

  // Build query string with all filters
  const buildSearchQuery = () => {
    const searchParams = new URLSearchParams();
    searchParams.set("q", query);
    searchParams.set("type", type); // Giữ tham số type
    
    // Chỉ thêm filters khi tìm sản phẩm (không áp dụng khi tìm shop)
    if (type === "product") {
      // Price filters
      const priceMin = params.get("price_min");
      const priceMax = params.get("price_max");
      if (priceMin) searchParams.set("price_min", priceMin);
      if (priceMax) searchParams.set("price_max", priceMax);
      
      // Rating filter
      const rating = params.get("rating");
      if (rating) searchParams.set("rating", rating);
      
      // Voucher filters
      if (params.get("voucher_product") === "1") searchParams.set("voucher_product", "1");
      if (params.get("voucher_platform") === "1") searchParams.set("voucher_platform", "1");
      if (params.get("voucher_saved") === "1") searchParams.set("voucher_saved", "1");
      
      // Shop type filter
      const shopType = params.get("shop_type");
      if (shopType) searchParams.set("shop_type", shopType);
      
      // Sort filters
      const sort = params.get("sort");
      const order = params.get("order");
      if (sort) searchParams.set("sort", sort);
      if (order) searchParams.set("order", order);
    }
    
    return searchParams.toString();
  };

  const { data: results = { products: [], shops: [] }, isLoading } = useQuery({
    queryKey: ["search", query, type, params.toString()], // Include type and all params in queryKey
    queryFn: async () => {
      if (!query) return { products: [], shops: [] };
      
      const queryString = buildSearchQuery();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add token if available (for voucher_saved filter)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/products/search?${queryString}`,
        { headers }
      );
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      return res.json() as Promise<{ products: Product[]; shops: Shop[] }>;
    },
    enabled: !!query,
  });


  if (isLoading) return <p>Đang tải...</p>;
  if (!query) return <p>Nhập từ khóa để tìm kiếm</p>;


  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="container mx-auto p-4 flex gap-4">
        
        {/* FILTERS - Chỉ hiển thị khi tìm sản phẩm */}
        {type === "product" && <SearchFilters />}

        {/* KẾT QUẢ */}
        <div className="flex-1">
        <SearchSortBar />
          {isLoading && <p>Đang tải...</p>}
          {!query && <p>Nhập từ khóa để tìm kiếm</p>}

          {results.products.length === 0 && results.shops.length === 0 ? (
            <p>Không tìm thấy kết quả nào</p>
          ) : (
            <>
              {results.shops.length > 0 && (
                <FeaturedShops shops={results.shops} />
              )}

              {results.products.length > 0 && (
                <ProductListSection
                  title="Sản phẩm"
                  products={results.products}
                  lazyLoad={true}
                  horizontal={false}
                />
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}