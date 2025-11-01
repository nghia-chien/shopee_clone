import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useState } from "react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useTranslation } from "react-i18next";

export function ProductPage() {
  const { t } = useTranslation();
  const params = useParams();
  const { data } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => api<any>(`/products/${params.id}`),
    enabled: Boolean(params.id),
  });

  const [quantity, setQuantity] = useState(1);

  if (!data) return <div className="p-4 text-center">{t("loading")}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      {/* MAIN PRODUCT SECTION */}
      <div className="max-w-6xl mx-auto bg-white p-6 mt-4 shadow-sm rounded-md grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Images */}
        <div>
          {data.images?.length ? (
            <div className="grid grid-cols-2 gap-3">
              {data.images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt={data.name}
                  className="rounded-lg border object-cover w-full h-56"
                />
              ))}
            </div>
          ) : (
            <img
              src="https://placehold.co/400x400"
              alt="no image"
              className="rounded-lg border w-full object-cover"
            />
          )}
        </div>

        {/* RIGHT: Product info */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{data.title}</h1>
          <p className="text-gray-600 text-sm">{data.description || t("no_description")}</p>

          <div className="text-2xl text-orange-600 font-bold">
            {t("price")}: {data.price?.toLocaleString()} ₫
          </div>

          <div className="text-sm text-gray-700">{t("stock")}: {data.stock}</div>
          <div className="text-sm">
            {t("seller")}:{" "}
            <span className="font-semibold">{data.seller?.name || data.sellerId}</span>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span>{t("quantity")}:</span>
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-3 py-1 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="px-3 py-1 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded">
              {t("add_to_cart")}
            </button>
            <button className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded">
              {t("buy_now")}
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCT DETAILS */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md">
        <h2 className="text-lg font-semibold mb-3">{t("product_details")}</h2>
        <p className="text-sm text-gray-700 whitespace-pre-line">
          {data.details || t("updating")}
        </p>
      </div>

      {/* OTHER PRODUCTS BY SAME SELLER */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md">
        <h2 className="text-lg font-semibold mb-4">{t("other_products_by_shop")}</h2>
        {/* TODO: hiển thị product cùng sellerId */}
        <p className="text-sm text-gray-500">{t("updating")}</p>
      </div>

      {/* RELATED PRODUCTS */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md">
        <h2 className="text-lg font-semibold mb-4">{t("you_may_also_like")}</h2>
        {/* TODO: hiển thị product khác */}
        <p className="text-sm text-gray-500">{t("updating")}</p>
      </div>

      <Footer />
    </div>
  );
}
