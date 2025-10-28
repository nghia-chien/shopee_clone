const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function fetchSellerProducts(token: string) {
  const res = await fetch(`${API_URL}/seller/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
