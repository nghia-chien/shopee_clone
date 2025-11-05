import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { HomeLayout } from "../../components/layout/HomeLayout";
import { HeaderLayout } from "../../components/layout/HeaderLayout";
import { ProductListSection } from "../../components/product/ProductListSection";
import { useAuthStore } from "../../store/auth";

export function HomePage() {
  const { user } = useAuthStore();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      api<{ items: {
        id: string;
        title?: string;
        name?: string;
        price?: number;
        images?: string[];
        sold?: number;
        rating?: number;
        seller: {
          location?: string;
        };
        freeShip?: boolean;
        discount?: number;
      }[] }>("/products"),
  });

  if (isLoading)
    return (
      <HeaderLayout>
        <div className="text-center text-gray-500">Loading products...</div>
      </HeaderLayout>
    );

  if (isError)
    return (
      <HeaderLayout>
        <div className="text-center text-red-500">
          Error: {(error as any)?.message || "Something went wrong"}
        </div>
      </HeaderLayout>
    );

  return (
    <HomeLayout>
      <ProductListSection title="Gợi Ý Hôm Nay" products={data?.items || []} />
    </HomeLayout>
  );
}
