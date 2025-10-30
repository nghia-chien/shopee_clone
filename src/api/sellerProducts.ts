import { useSellerAuthStore } from '../store/SellerAuth';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function uploadSellerImage(file: File) {
  // Lấy token từ store
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_URL}/seller/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // <--- đây là quan trọng
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url as string;
}




// Fetch seller products
export async function fetchSellerProducts(token: string) {
  const res = await fetch(`${API_URL}/seller/product`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}
