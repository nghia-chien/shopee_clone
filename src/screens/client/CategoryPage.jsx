import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function CategoryPage() {
  const { categoryId } = useParams(); // Lấy từ URL: /category/:categoryId
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`/api/categories/${categoryId}/products`);
        setProducts(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId]);

  if (loading) return <div>Đang tải...</div>;
  if (products.length === 0) return <div>Không có sản phẩm trong danh mục này</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sản phẩm</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded p-2 shadow-sm">
            <img
              src={product.image || "/placeholder.png"}
              alt={product.title}
              className="w-full h-40 object-cover mb-2 rounded"
            />
            <h2 className="text-sm font-semibold">{product.title}</h2>
            <p className="text-red-500 font-bold">{product.price}₫</p>
          </div>
        ))}
      </div>
    </div>
  );
}
