import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';
import { HomeLayout } from '../../components/layout/HomeLayout';
import { useAuthStore } from '../../store/auth';
import { HeaderLayout } from '../../components/layout/HeaderLayout';

export function HomePage() {
  const { user } = useAuthStore();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => api<{ items: { id: string; title?: string; images?: string[]; price?: number }[] }>('/products'),
  });

  if (isLoading) {
    return (
      
      <HeaderLayout>
        <div className="text-center text-gray-500">Loading products...</div>
      </HeaderLayout>
    );
  }

  if (isError) {
    return (
      <HeaderLayout>
      
        <div className="text-center text-red-500">Error: {(error as any)?.message || 'Something went wrong'}</div>
      </HeaderLayout>
    );
  }

  return (
      <HomeLayout>
        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
  <h2 className="text-2xl font-bold mb-6">Sản phẩm nổi bật</h2>
  {/* Nếu data chưa có hoặc rỗng */}
  {(!data?.items || data.items.length === 0) ? (
    <p className="text-gray-500 text-center py-8">Gợi ý hôm nay.</p>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {data.items.map((p) => (
        <div
          key={p.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
        >
          {/* Product Image */}
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
            {p.images && p.images.length > 0 ? (
              <img
                src={p.images[0]}
                alt={p.title ?? p.id}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-12 h-12 text-gray-400"
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
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            <Link
              to={`/products/${p.id}`}
              className="hover:text-orange-500 transition-colors"
            >
              {p.title ?? p.id}
            </Link>
          </h3>

          {/* Price */}
          {p.price && (
            <p className="text-orange-500 font-bold text-lg">
              {p.price.toLocaleString('vi-VN')} ₫
            </p>
          )}
          
            {/* Discount / Freeship badges */}
            {/* {p.discount && p.discount > 0 && (
              <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-bl">
                -{p.discount}%
              </div>
            )}
            {p.freeShip && (
              <div className="absolute bottom-0 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded-tr">
                Freeship
              </div>
            )}
          </div> */}

          {/* Product Info */}
          {/* <div className="p-2">
            <div className="text-sm text-gray-800 line-clamp-2 mb-1 h-10">
              {p.title}
            </div> */}

            {/* Price */}
            {/* {p.price && (
              <p className="text-orange-500 font-bold text-base mb-1">
                ₫{p.price.toLocaleString('vi-VN')}
              </p>
            )} */}

            {/* Sold / Rating */}
            {/* <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Đã bán {p.sold ?? 0}</span>
              <span>{p.ratingCount ?? 0} ★</span>
            </div> */}

            {/* Location */}
            {/* <div className="text-xs text-gray-500">{p.location ?? 'Việt Nam'}</div> */}
          </div>

      ))}
    </div>
  )}
</div>

      </HomeLayout>
    
  );
}
