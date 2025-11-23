import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/userapi/client";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { ProductListSection } from "../../components/product/ProductListSection";
import CategoryFilters from "../../components/home/CategoryFilters";
import SearchSortBar from "../../components/home/SearchSortBar";

interface CategoryProduct {
  id: string;
  title: string;
  price: string | number;
  images?: string[];
}

interface Product {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  images?: string[];
  sold?: number;
  rating?: number;
  location?: string;
  freeShip?: boolean;
  discount?: number;
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  // Fetch category info first - get it from products endpoint
  const { data: categoryData } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      if (!slug) return null;
      try {
        // Use slug to generate category name
        const name = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return { id: slug, name };
      } catch {
        return null;
      }
    },
    enabled: !!slug,
  });

  // Fetch products - use the existing endpoint for now, apply filters in frontend
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["category-products", slug, params.toString()],
    queryFn: async () => {
      if (!slug) return { items: [], total: 0 };
      
      try {
        // Fetch all products from category
        const categoryProducts = await api<CategoryProduct[]>(`/categories/slug/${slug}/products`);
        
        // Convert to Product format and apply filters
        let filteredItems: Product[] = categoryProducts.map(p => ({
          id: p.id,
          title: p.title,
          price: typeof p.price === 'string' ? Number(p.price) : p.price,
          images: p.images,
        }));
        
        // Price filters
        const priceMin = params.get("price_min");
        const priceMax = params.get("price_max");
        if (priceMin) {
          const min = Number(priceMin);
          filteredItems = filteredItems.filter(p => (p.price || 0) >= min);
        }
        if (priceMax) {
          const max = Number(priceMax);
          filteredItems = filteredItems.filter(p => (p.price || 0) <= max);
        }
        
        // Rating filter
        const rating = params.get("rating");
        if (rating) {
          const minRating = Number(rating);
          filteredItems = filteredItems.filter(p => (p.rating || 0) >= minRating);
        }

        // Sort products
        const sort = params.get("sort") || "newest";
        const order = params.get("order") || "desc";
        
        filteredItems.sort((a, b) => {
          if (sort === "newest") {
            // For newest, we don't have created_at, so keep original order
            return 0;
          } else if (sort === "rating_desc") {
            return (b.rating || 0) - (a.rating || 0);
          } else if (sort === "price") {
            const priceA = a.price || 0;
            const priceB = b.price || 0;
            return order === "asc" ? priceA - priceB : priceB - priceA;
          }
          return 0;
        });

        // Note: Voucher and shop_type filters would require additional API calls
        // For now, we'll skip them in category page

        return { items: filteredItems, total: filteredItems.length };
      } catch (err) {
        console.error("Error fetching category products:", err);
        return { items: [], total: 0 };
      }
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="container mx-auto p-4">
          <p>Đang tải...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <div className="container mx-auto p-4">
          <p>Danh mục không hợp lệ</p>
        </div>
        <Footer />
      </div>
    );
  }

  const products = productsData?.items || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="container mx-auto p-4 flex gap-4">
        
        {/* FILTERS */}
        <CategoryFilters categorySlug={slug} />

        {/* KẾT QUẢ */}
        <div className="flex-1">
          <SearchSortBar />
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p>Đang tải...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-gray-600 text-lg uppercase font-bold mb-4">
                {categoryData?.name || "Danh mục"}
              </h2>
              <p className="text-gray-500 text-center py-8">
                Không có sản phẩm trong danh mục này.
              </p>
            </div>
          ) : (
            <ProductListSection
              title={categoryData?.name || "Danh mục"}
              products={products}
              lazyLoad={true}
              horizontal={false}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
