// frontend/api/orders.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getUserOrders(token: string) {
  const res = await fetch(`${API_URL}/orders/orders/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json(); // trả về seller_order[] đã map sẵn
}
