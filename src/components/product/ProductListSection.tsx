import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


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
  horizontal?: boolean; 
  lazyLoad?: boolean;   
}


export function ProductListSection({title = "Gợi Ý Hôm Nay", products,horizontal = false,lazyLoad = false,
}: Props) {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(lazyLoad ? 30 : products.length);


   useEffect(() => {
    if (!lazyLoad) return;
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        setVisibleCount((prev) => Math.min(prev + 30, products.length));
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lazyLoad, products.length]);
    const displayedProducts = horizontal
    ? products.slice(0, 10)
    : products.slice(0, visibleCount);
  
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
    <section className=" rounded-lg  p-6 w-full">
      <div className="flex items-center  justify-between mb-4">
        <h2 className="text-gray-600 text-lg uppercase font-bold">{title}</h2>
      </div>

      {/* --- Layout chính --- */}
      {horizontal ? (
        <div className="w-full max-w-[1200px] flex gap-3 overflow-x-auto scrollbar-hide mx-auto">

          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
            
function ProductCard({ product }: { product: Product }) {
  return (
    <> 
    <div
      className="w-[180px] h-[320px] flex-shrink-0 bg-white rounded-sm overflow-hidden 
                 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
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
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
        {product.freeShip && (
          <div className="absolute bottom-0 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded-tr">
            Freeship
          </div>
        )}
      </div>

      <div className="p-2">
        <div className="text-sm text-start text-gray-800 line-clamp-2 mb-2 h-10">
          {product.title ?? product.name}
        </div>

        {/* TODO:  thêm bảng: tạo dữ liệu đã bán bao nhiêu cho sản phẩm có id này  */}
        <div className="flex items-center justify-between mb-2">
          {product.price ? (
            <span className="text-orange-500 font-bold text-base">
              {Number(product.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              <span className="text-[10px] relative top-[-4px] ml-0.5">₫</span>
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
              <svg
                key={i}
                className={`w-3 h-3 ${i < Math.round(product.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
      </div>
          </div>
</>
  );
}
   

