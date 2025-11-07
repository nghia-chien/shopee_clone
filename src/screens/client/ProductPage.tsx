import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useState } from "react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { ProductListSection } from "../../components/product/ProductListSection";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";

export function ProductPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  // Lấy dữ liệu sản phẩm theo id
  // Giả định cấu trúc data: {..., title, rating, reviews, sold, price, discount, images: [], description, tags: [], stock, seller: {logo, name, address}}
  const { data } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => api<any>(`/products/${params.id}`),
    enabled: Boolean(params.id),
  });
  
  
  const { data: sellerProducts } = useQuery({
    queryKey: ["seller-products", data?.seller?.id],
    queryFn: () => api<{ items: any[] }>(`/products?seller_id=${data?.seller?.id}`),
    enabled: Boolean(data?.seller?.id),
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", data?.id],
    queryFn: async () => {
      // Ưu tiên theo thứ tự: tags > seller_id > random
      if (data?.tags?.length) {
        // Tìm theo tag đầu tiên (có thể mở rộng sau)
        return api<{ items: any[] }>(
          `/products?tag=${encodeURIComponent(data.tags[0])}`
        );
      } else if (data?.seller?.id) {
        // Nếu không có tag, fallback theo seller_id
        return api<{ items: any[] }>(
          `/products?seller_id=${data.seller.id}`
        );
      } else {
        // Cuối cùng: lấy ngẫu nhiên một số sản phẩm khác
        return api<{ items: any[] }>(`/products?limit=10`);
      }
    },
    enabled: Boolean(data?.id),
  });

  if (!data) return <div className="p-4 text-center">{t("product.loading")}</div>;

  // (Yêu cầu 3) Tính giá sau giảm giá
  const priceAfterDiscount = data.discount
    ? (data.price * (100 - data.discount)) / 100
    : data.price;

  const addToCart = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await api(`/cart/items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: params.id, quantity }),
      });
      alert('Đã thêm vào giỏ hàng');
    } catch (err: any) {
      alert(err?.message || 'Lỗi thêm giỏ hàng');
    }
  };

  const buyNow = async () => {
    try {
      await addToCart();
      navigate('/cart');
    } catch {}
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      {/* VÙNG THÔNG TIN CHÍNH */}
      <div className="max-w-6xl mx-auto bg-white p-6 mt-4 shadow-sm rounded-md grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CỘT TRÁI: ẢNH SẢN PHẨM (Yêu cầu 1) */}
        <div>
          
          {/* Ảnh chính */}
          <img
            src={selectedImage || data.images?.[0] || "https://placehold.co/400x400"}
            alt={data.title}
            className="rounded-lg border object-cover w-full h-96"
          />

          {/* Các ảnh nhỏ phía dưới */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {data.images?.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                alt={`thumbnail-${i}`}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 rounded-md border cursor-pointer object-cover ${
                  selectedImage === img ? "ring-2 ring-orange-500" : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN SẢN PHẨM */}
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-left">{data.title}</h1>

          {/* (Yêu cầu 2) Rating, Đánh giá, Đã bán */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center text-yellow-500">
              <Star className="w-4 h-4 fill-yellow-500" />{" "}
              <span className="ml-1">{data.rating ?? "Chưa có"}</span>
            </div>
            <span>|</span>
            {/* Giả định data.reviews là số lượng đánh giá */}
            <span>{t("product.reviews")}: {data.reviews ?? "0"}</span> 
            <span>|</span>
            <span>{t("product.sold")}: {data.sold ?? "0"}</span>
          </div>

          {/* (Yêu cầu 3) Giá tiền */}
          <div className="flex items-baseline gap-3 bg-gray-100 p-4 rounded">
            <span className="text-3xl font-bold text-orange-600">
              {priceAfterDiscount.toLocaleString()} ₫
            </span>
            {data.discount && (
              <>
                <span className="text-gray-400 line-through">
                  {data.price.toLocaleString()} ₫
                </span>
                <span className="text-red-600 text-sm font-semibold">
                  -{data.discount}%
                </span>
              </>
            )}
          </div>

          {/* (Yêu cầu 4) Voucher + vận chuyển */}
          <div className="border-t border-b py-2 text-sm text-left text-gray-700">
            <div>{t("product.voucher")}: <span className="text-orange-600">Giảm 2k, 3k</span></div>
            <div>{t("product.shipping")}: <span>Miễn phí đơn từ 50k</span></div>
          </div>

          {/* Số lượng */}
          <div className="flex items-center gap-3 pt-2">
            <span>{t("product.quantity")}:</span>
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

          {/* Nút hành động */}
          <div className="flex items-center gap-3 pt-3">
            <button onClick={addToCart} className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded">
              {t("product.add_to_cart")}
            </button>
            <button onClick={buyNow} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded">
              {t("product.buy_now")}
            </button>
          </div>

          {/* (Yêu cầu 5) Thông tin shop */}
          
        </div>
      </div>
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md">
        <div className="flex items-center justify-between mt-5 border-t pt-3">
          <div className="flex items-center gap-3">
            <img
              src={data.seller?.logo || "https://placehold.co/60x60"}
              alt="shop logo"
              className="w-12 h-12 rounded-full border"
            />
            <div>
              <div className="font-semibold text-gray-800">{data.seller?.name}</div>
              <div className="text-sm text-gray-500">{data.seller?.address || "Đang cập nhật"}</div>
            </div>
            <button className="border px-4 py-1 rounded hover:bg-gray-100">{t("product.chat_now")}</button>
            <button className="border px-4 py-1 rounded hover:bg-gray-100">{t("product.view_shop")}</button>
          </div>
        </div>
      </div>
      {/* (Yêu cầu 6) CHI TIẾT SẢN PHẨM */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <h2 className="text-lg font-semibold mb-3">{t("product.product_details")}</h2>
        <div className="text-sm text-gray-700 space-y-2">
          <div>• Tags: {data.tags?.join(", ") || t("updating")}</div>
          <div>• {t("product.stock")}: {data.stock > 0 ? 'Còn hàng' : 'Hết hàng'}</div>
          <div>• {t("product.seller_address")}: {data.seller?.address || t("updating")}</div>
        </div>
      </div>

      {/* (Yêu cầu 7) MÔ TẢ SẢN PHẨM */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <h2 className="text-lg font-semibold mb-3">{t("product.description")}</h2>
        <p className="text-sm text-gray-700 whitespace-pre-line">{data.description}</p>
      </div>

      {/* (Yêu cầu 8) ĐÁNH GIÁ SẢN PHẨM */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <h2 className="text-2xl font-semibold mb-3">{t("product.reviews")}</h2>
        <p className="text-sm text-gray-500">{t("product.reviews_notyet")}</p>
      </div>

      {/* (Yêu cầu 9) SẢN PHẨM KHÁC CỦA SHOP */}
      {/* (Yêu cầu 9) SẢN PHẨM KHÁC CỦA SHOP */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <ProductListSection
          title={t("product.other_products_by_shop")}
          // Chỉ lấy sản phẩm có cùng seller_id và khác id hiện tại
          products={
            sellerProducts?.items
              ?.filter(p => p.seller_id === data.seller?.id && p.id !== data.id)
              ?.slice(0, 10) || []
          }
          horizontal
        />
      </div>


      {/* (Yêu cầu 10) SẢN PHẨM LIÊN QUAN */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <ProductListSection
          title={t("product.you_may_also_like")}
          products={relatedProducts?.items?.filter(p => p.id !== data.id) || []}
          lazyLoad
        />
      </div>

      <Footer />
    </div>
  );
}