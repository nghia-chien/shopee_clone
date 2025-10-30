import { useState, useEffect } from "react";
import { fetchSellerProducts } from "../../api/sellerProducts";
import { UploadImage } from "../../components/seller/UploadImage";
import { useSellerAuthStore } from "../../store/SellerAuth";

export const SellerDashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = useSellerAuthStore.getState().token;
    if (!token) {
      setError("You must be logged in as seller.");
      return;
    }

    fetchSellerProducts(token)
      .then(data => setProducts(data.products || []))
      .catch(err => setError(err.message || "Failed to fetch products"));
  }, []);

  return (
    <div>
      <h1>Seller Dashboard</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <section>
        <h2>Upload New Product</h2>
        <UploadImage productId="new" />
      </section>

      <section>
        <h2>Your Products</h2>
        {products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
          <ul>
            {products.map(p => (
              <li key={p.id}>
                {p.title} - {p.stock} in stock - ${p.price}

                {/* imageimage */}
                <div className="relative w-1/3 aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
