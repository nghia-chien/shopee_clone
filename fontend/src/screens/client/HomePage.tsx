import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/userapi/client";
import { HomeLayout } from "../../components/layout/HomeLayout";
import { ProductListSection } from "../../components/product/ProductListSection";

export function HomePage() {
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
      <HomeLayout>
        <div className="text-center text-gray-500">Loading products...</div>
      </HomeLayout>
    );

  if (isError)
    return (
      <HomeLayout>
        <div className="text-center text-red-500">
          Error: {(error as any)?.message || "Something went wrong"}
        </div>
      </HomeLayout>
    );

  return (
    <HomeLayout>
      <ProductListSection title="Gợi Ý Hôm Nay" products={data?.items || []} />
    </HomeLayout>
  );
}