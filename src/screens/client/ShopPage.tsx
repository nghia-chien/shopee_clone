import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

interface Product {
  id: string;
  title: string;
  images?: string[];
  price: number;
  seller_name: string; // dùng seller_name nếu database lưu tên seller
}

const ShopPage: React.FC = () => {
  const { seller_id } = useParams<{ seller_id: string }>(); // dùng seller_id
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seller_id) fetchProducts();
  }, [seller_id]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api<{ items: Product[] }>(`/shops/${seller_id}`);
      setProducts(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shop: {seller_id}</h1>

      {loading && <p>Đang tải...</p>}

      {products.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <li
              key={p.id}
              className="border rounded p-2 flex flex-col gap-2 hover:shadow cursor-pointer"
              onClick={() => navigate(`/product/${p.id}`)}
            >
              {p.images?.[0] && (
                <img src={p.images[0]} alt={p.title} className="w-full h-48 object-cover rounded" />
              )}
              <div className="flex flex-col">
                <p className="font-semibold truncate">{p.title}</p>
                <p className="text-gray-500 text-sm">{p.seller_name}</p>
                <p className="text-orange-500 font-bold">{p.price.toLocaleString()}₫</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>Shop này chưa có sản phẩm.</p>
      )}
    </div>
  );
};

export default ShopPage;
