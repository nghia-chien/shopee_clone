import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/userapi/client";
import { useRef, useState, useEffect, useMemo } from "react"; // Thêm useEffect
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useTranslation } from "react-i18next";
import { Star, AlertCircle } from "lucide-react"; // Thêm AlertCircle
import { ProductListSection } from "../../components/product/ProductListSection";
import { ReviewSection } from "../../components/review/ReviewSection";
import { useAuthStore } from "../../store/auth";
import { useNavigate } from "react-router-dom";
import { useChatWidgetStore } from "../../store/chatWidget";
import { ChatWidget } from "../../components/chat/ChatWidget";

export function ProductPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const lastUpdateId = useRef<number>(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null); 
  const [variantError, setVariantError] = useState<string | null>(null); 
  const { openChat } = useChatWidgetStore();

  
  const { data } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => api<any>(`/products/${params.id}`),
    enabled: Boolean(params.id),
  });

  // Tính toán stock hiện tại
  const currentStock = useMemo(() => {
    if (!data) return 0;
    
    if (selectedVariant) {
      return selectedVariant.stock || 0;
    }
    
    return data.stock || 0;
  }, [data, selectedVariant]);

  // Kiểm tra nếu sản phẩm hết hàng
  const isOutOfStock = currentStock === 0;

  // Kiểm tra nếu có variant nhưng chưa chọn
  const hasVariants = data?.product_variant?.length > 0;
  const isVariantRequired = hasVariants && !selectedVariant;

  // Tự động chọn variant đầu tiên còn hàng nếu có
  useEffect(() => {
    if (data?.product_variant?.length > 0 && !selectedVariant) {
      const availableVariant = data.product_variant.find((v: any) => v.stock > 0);
      if (availableVariant) {
        setSelectedVariant(availableVariant);
        setSelectedImage(availableVariant.image || data.images?.[0] || null);
      }
    }
  }, [data, selectedVariant]);

  // Cập nhật quantity khi stock thay đổi
  useEffect(() => {
    if (quantity > currentStock && currentStock > 0) {
      setQuantity(currentStock);
    }
  }, [currentStock, quantity]);

  const { data: sellerProducts } = useQuery({
    queryKey: ["seller-products", data?.seller?.id],
    queryFn: () => api<{ items: any[] }>(`/products?seller_id=${data?.seller?.id}`),
    enabled: Boolean(data?.seller?.id),
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", data?.id],
    queryFn: async () => {
      if (data?.tags?.length) {
        return api<{ items: any[] }>(
          `/products?tag=${encodeURIComponent(data.tags[0])}`
        );
      } else if (data?.seller?.id) {
        return api<{ items: any[] }>(
          `/products?seller_id=${data.seller.id}`
        );
      } else {
        return api<{ items: any[] }>(`/products?limit=10`);
      }
    },
    enabled: Boolean(data?.id),
  });

  if (!data) return <div className="p-4 text-center">{t("product.loading")}</div>;

  const priceToShow = selectedVariant?.price ?? data.price;
  const discountToShow = selectedVariant?.discount ?? data.discount;

  const priceAfterDiscount = discountToShow
    ? (priceToShow * (100 - discountToShow)) / 100
    : priceToShow;

  const validateBeforeAddToCart = (): boolean => {
    setStockError(null);
    setVariantError(null);

    // Kiểm tra variant
    if (hasVariants && !selectedVariant) {
      setVariantError("Vui lòng chọn phân loại sản phẩm");
      return false;
    }

    // Kiểm tra stock
    if (isOutOfStock) {
      setStockError("Sản phẩm đã hết hàng");
      return false;
    }

    // Kiểm tra số lượng không vượt quá stock
    if (quantity > currentStock) {
      setStockError(`Chỉ còn ${currentStock} sản phẩm`);
      return false;
    }

    // Kiểm tra số lượng hợp lệ
    if (quantity < 1) {
      setStockError("Số lượng phải lớn hơn 0");
      return false;
    }

    return true;
  };

  const addToCart = async () => {
    // Kiểm tra trước khi thêm vào giỏ hàng
    if (!validateBeforeAddToCart()) {
      return;
    }

    if (isAddingToCart) return;

    if (!token) {
      navigate('/login');
      return;
    }

    setIsAddingToCart(true);
    setStockError(null);
    setVariantError(null);

    const requestBody = {
      product_id: params.id,
      variant_id: selectedVariant?.id || null,
      quantity
    };

    try {
      const updateId = Date.now();
      lastUpdateId.current = updateId;

      queryClient.setQueryData<number>(["cart-count"], (oldCount = 0) => {
        if (updateId >= lastUpdateId.current) {
          const newCount = oldCount + quantity;
          return newCount;
        }
        console.log(`⏸️ Skip update [${updateId}], newer update exists`);
        return oldCount;
      });

      await api(`/cart/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      await queryClient.refetchQueries({ queryKey: ["cart-count"] });


    } catch (err: any) {
      console.error('❌ Lỗi khi gọi API:', err);

      // Rollback atomic
      queryClient.setQueryData<number>(["cart-count"], (oldCount = 0) => {
        const newCount = Math.max(0, oldCount - quantity);
        console.log(`↩️ Rollback: ${oldCount} → ${newCount}`);
        return newCount;
      });

      // Kiểm tra lỗi stock từ backend
      if (err.message?.includes('stock') || err.message?.includes('hết hàng')) {
        setStockError(err.message);
        alert(`Lỗi: ${err.message}. Vui lòng chọn lại số lượng.`);
      } else {
        alert(err?.message || 'Lỗi thêm giỏ hàng');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const buyNow = async () => {
    // Kiểm tra trước khi mua
    if (!validateBeforeAddToCart()) {
      return;
    }

    try {
      await addToCart();
      navigate('/cart');
    } catch (error) {
      console.error('Lỗi khi mua ngay:', error);
    }
  };
const handleChatWithSeller = () => {
    if (!data.seller || !data.seller.id || !data.seller.name) {
      alert('Không thể liên hệ với người bán lúc này');
      return;
    }
    
    openChat(data.seller.id, data.seller.name);
  };
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />


        <div className="max-w-6xl mx-auto p-6 mt-4 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-orange-500 cursor-pointer hover:text-orange-600" onClick={() => navigate('/')}>
            Trang chủ
          </span>
          <span>/</span>
          <span 
            className="text-orange-500 cursor-pointer hover:text-orange-600" 
            onClick={() => navigate(`/category/${data.category.slug}`)}
          >
            {data.category.name}
          </span>
          <span>/</span>
         <span className="text-gray-900 font-medium max-w-lg truncate">
            {data.title} {/* Giới hạn tối đa 32rem (512px) */}
          </span>
        </div>


      {/* VÙNG THÔNG TIN CHÍNH */}
      <div className=" bg-white  shadow-sm rounded-md grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CỘT TRÁI: ẢNH SẢN PHẨM */}
        <div>
          <img
            src={selectedImage || data.images?.[0] || "https://placehold.co/400x400"}
            alt={data.title}
            className="rounded-lg border object-cover w-full h-96"
          />

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

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center text-yellow-500">
              <Star className="w-4 h-4 fill-yellow-500" />{" "}
              <span className="ml-1">{data.ratingAvg ?? "Chưa có"}</span>
            </div>
            <span>|</span>
            <span>{t("product.reviews")}: {data.reviewCount ?? "0"}</span>
            <span>|</span>
            <span>{t("product.sold")}: {data.sold ?? "0"}</span>
            <span>|</span>
            
          </div>

          {/* Giá tiền */}
          <div className="flex items-baseline gap-3 bg-gray-100 p-4 rounded">
            <span className="text-3xl font-bold text-orange-600">
              {(Number(discountToShow ? priceAfterDiscount : priceToShow)
                .toLocaleString("vi-VN"))}
              <span className="text-[16px] relative top-[-8px] ml-0.5">₫</span>
            </span>

            {discountToShow > 0 && (
              <>
                <span className="text-gray-400 line-through">
                  {Number(priceToShow).toLocaleString("vi-VN")}
                  <span className="text-[16px] relative top-[-8px] ml-0.5">₫</span>
                </span>

                <span className="text-red-600 text-sm font-semibold">
                  -{discountToShow}%
                </span>
              </>
            )}
          </div>

          {/* Chọn variant */}
         {data.product_variant?.length > 0 && (
  <div className="space-y-2 pt-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium">{t("product.select_variant")}:</span>
      
    </div>

    <div
      className={`${
        data.product_variant.length > 15 ? "max-h-32 overflow-y-auto pr-1" : ""
      }`}
    >
      
        <div className="flex flex-wrap gap-2">
  {data.product_variant.map((v: any) => {
    const isOutOfStock = v.stock === 0;
    const isSelected = selectedVariant?.id === v.id;

    return (
      <button
        key={v.id}
        onClick={() => {
          if (isOutOfStock) {
            setVariantError(`"${v.title}" hết hàng`);
            return;
          }
          setSelectedVariant(v);
          setSelectedImage(v.image || data.images?.[0] || null);
          setVariantError(null);
        }}
        disabled={isOutOfStock}
        className={`
          border rounded px-2 py-1 text-xs whitespace-nowrap transition
          ${isSelected 
            ? "bg-orange-500 text-white border-orange-500" 
            : "bg-white border-gray-300"
          }
          ${isOutOfStock 
            ? "opacity-60 cursor-not-allowed line-through" 
            : "hover:border-orange-400 hover:bg-orange-50"
          }
        `}
      >
        {v.title}
      </button>
    );
  })}

      </div>
    </div>
  </div>
)}


          {/* Số lượng với validation */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3">
              <span>{t("product.quantity")}:</span>
              <div className="flex items-center border rounded">
                <button
                  onClick={() => {
                    if (quantity > 1) {
                      setQuantity(q => q - 1);
                      setStockError(null);
                    }
                  }}
                  disabled={quantity <= 1 || isOutOfStock}
                  className={`px-3 py-1 ${quantity <= 1 || isOutOfStock ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                >
                  -
                </button>
                <span className="px-4 min-w-[40px] text-center">{quantity}</span>
                <button
                  onClick={() => {
                    if (quantity < currentStock) {
                      setQuantity(q => q + 1);
                      setStockError(null);
                    } else {
                      setStockError(`Chỉ còn ${currentStock} sản phẩm`);
                    }
                  }}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className={`px-3 py-1 ${quantity >= currentStock || isOutOfStock ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                >
                  +
                </button>
              </div>
              
            </div>
            
            {/* Error message for stock */}
            {stockError && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {stockError}
              </div>
            )}
          </div>

          {/* Nút hành động với validation */}
          <div className="flex items-center gap-3 pt-3">
            <button 
              onClick={addToCart} 
              disabled={isAddingToCart || isOutOfStock || isVariantRequired}
              className={`
                px-5 py-2 font-semibold rounded transition-colors
                ${isAddingToCart || isOutOfStock || isVariantRequired
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                }
              `}
            >
              {isAddingToCart 
                ? 'Đang thêm...' 
                : isOutOfStock 
                  ? 'Hết hàng' 
                  : isVariantRequired
                    ? 'Chọn phân loại'
                    : t("product.add_to_cart")
              }
            </button>
            
            <button 
              onClick={buyNow} 
              disabled={isOutOfStock || isVariantRequired}
              className={`
                px-5 py-2 font-semibold rounded transition-colors
                ${isOutOfStock || isVariantRequired
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                }
              `}
            >
              {isOutOfStock 
                ? 'Hết hàng' 
                : isVariantRequired
                  ? 'Chọn phân loại'
                  : t("product.buy_now")
              }
            </button>
          </div>

          {/* Warning message */}
          {(isOutOfStock || isVariantRequired) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2 text-yellow-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  {isOutOfStock && <p>Sản phẩm hiện đang hết hàng. Vui lòng quay lại sau.</p>}
                  {isVariantRequired && <p>Vui lòng chọn phân loại sản phẩm trước khi thêm vào giỏ hàng hoặc mua.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Phần còn lại của code giữ nguyên */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md">
        <div className="flex items-center justify-between mt-5 border-t pt-3">
          <div className="flex items-center gap-3">
            <img
              src={data.seller?.avatar || "https://placehold.co/60x60"}
              alt="shop logo"
              className="w-12 h-12 rounded-full border"
            />
            <div>
              <div className="font-semibold text-gray-800">{data.seller?.name}</div>
            </div>
            <button 
            onClick={handleChatWithSeller}
            className="border px-4 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2 text-sm"
          >
            
            {t("product.chat_now")}
          </button>
            <button 
              className="border px-4 py-1 rounded hover:bg-gray-100"
              onClick={() => navigate(`/shop/${data?.seller?.id}`)}
            >
              {t("product.view_shop")}
            </button>
          </div>
        </div>
      </div>

      {/* Các phần khác giữ nguyên */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <h2 className="text-lg font-semibold mb-3">{t("product.product_details")}</h2>
        <div className="text-sm text-gray-700 space-y-2">
          <div>• Tags: {data.tags?.join(", ") || t("updating")}</div>
          <div>• {t("product.seller_name")}: {data.seller?.name || t("updating")}</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <h2 className="text-lg font-semibold mb-3">{t("product.description")}</h2>
        <div className="text-sm text-gray-700 space-y-2">
          {JSON.parse(data.description)?.map((block: any, idx: number) => {
            if (block.type === "text") return <p key={idx}>{block.content}</p>;
            if (block.type === "image")
              return (
                <img
                  key={idx}
                  src={block.content}
                  alt={`desc-${idx}`}
                  className="w-full rounded-md"
                />
              );
            return null;
          })}
        </div>
      </div>

      {/* Reviews Section */}
      {data?.id && data?.seller?.id && (
        <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md">
          <ReviewSection productId={data.id} sellerId={data.seller.id} />
        </div>
      )}

      {/* Sản phẩm khác của shop */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <ProductListSection
          title={t("product.other_products_by_shop")}
          products={
            sellerProducts?.items
              ?.filter(p => p.seller_id === data.seller?.id && p.id !== data.id)
              ?.slice(0, 10) || []
          }
          horizontal
        />
      </div>

      {/* Sản phẩm liên quan */}
      <div className="max-w-6xl mx-auto bg-white mt-4 p-6 shadow-sm rounded-md text-left">
        <ProductListSection
          title={t("product.you_may_also_like")}
          products={relatedProducts?.items?.filter(p => p.id !== data.id) || []}
          lazyLoad
        />
      </div>
</div><ChatWidget />
      <Footer />
    </div>
  );
}