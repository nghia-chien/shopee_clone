import { useState, useEffect } from "react";
import { fetchSellerProducts } from "../../api/sellerProducts";
import { UploadImage } from "../../components/seller/UploadImage";

export const SellerDashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sellerToken");
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
