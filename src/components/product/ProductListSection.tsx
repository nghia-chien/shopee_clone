import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuthStore } from "../../store/auth";

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

interface Props {
  title?: string;
  products: Product[];
}

export function ProductListSection({ title = "Gợi Ý Hôm Nay", products }: Props) {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const addToCart = async (product_id: string) => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await api(`/cart/items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id, quantity: 1 }),
      });
      alert('Đã thêm vào giỏ hàng');
    } catch (err: any) {
      alert(err?.message || 'Lỗi thêm giỏ hàng');
    }
  };

  if (!products || products.length === 0)
    return (
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-gray-600 text-lg uppercase font-bold mb-4">{title}</h2>
        <p className="text-gray-500 text-center py-8">
          Chưa có sản phẩm nổi bật hôm nay.
        </p>
      </section>
    );

  return (
    // <section className="bg-white rounded-lg shadow-sm p-6">
      // <div className="flex items-center justify-between mb-4">
      //   <h2 className="text-gray-600 text-lg uppercase font-bold">{title}</h2>
      // </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <div className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
              {product.images?.length ? (
                <img
                  src={product.images[0]}
                  alt={product.title ?? product.id}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <svg
                  className="w-10 h-10 text-gray-400 absolute inset-0 m-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}

              {product.freeShip && (
                <div className="absolute bottom-0 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded-tr">
                  Freeship
                </div>
              )}
            </div>

            <div className="p-2">
              <div className="text-sm text-gray-800 line-clamp-2 mb-2 h-10">
                {product.title ?? product.name}
              </div>

              <div className="flex items-center justify-between mb-2">
                {product.price ? (
                  <span className="text-orange-500 font-bold text-base">
                    ₫{product.price.toLocaleString("vi-VN")}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Đang cập nhật</span>
                )}
                {product.sold && (
                  <span className="text-xs text-gray-500">
                    Đã bán {product.sold.toLocaleString("vi-VN")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                {product.rating && (
                  <span className="text-xs text-gray-500">
                    ({product.rating.toLocaleString("vi-VN")})
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{product.location ?? "Việt Nam"}</span>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  className="flex-1 text-center border border-gray-300 rounded py-2 hover:bg-gray-50"
                  onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
                >
                  Xem chi tiết
                </button>
                <button
                  className="flex-1 text-center bg-orange-500 text-white rounded py-2 hover:bg-orange-600"
                  onClick={(e) => { e.stopPropagation(); addToCart(product.id); }}
                >
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    //   <div className="flex justify-center mt-6">
    //     <button className="px-8 py-3 border border-gray-300 rounded-sm hover:bg-gray-50 hover:border-orange-500 transition font-medium">
    //       Xem thêm
    //     </button>
    //   </div>
    // </section>
  );
}