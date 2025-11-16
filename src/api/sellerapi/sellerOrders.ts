const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";



// Lấy danh sách các order mà seller có sản phẩm
export async function getSellerSoldOrders(token: string) {
  const res = await fetch(`${API_URL}/seller/order/sold`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch sold orders');
  return res.json(); // trả về seller_order[]
}

// Lấy chi tiết seller_order
export async function getSellerOrderDetails(token: string, seller_order_id: string) {
  const res = await fetch(`${API_URL}/seller/order/${seller_order_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch seller order details');
  return res.json(); // trả về seller_order chi tiết, kèm items
}


// Get seller analytics
export async function getSellerAnalytics(token: string, days: number = 30) {
  const res = await fetch(`${API_URL}/seller/analytics/analytics?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// Get seller stats
export async function getSellerStats(token: string) {
  const res = await fetch(`${API_URL}/seller/analytics/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// Cập nhật trạng thái seller_order (pending/accepted/cancelled/completed)
export async function updateSellerOrderStatus(
  token: string,
  seller_order_id: string,
  status: 'pending' | 'accepted' | 'cancelled' | 'completed'
) {
  const res = await fetch(`${API_URL}/seller/order/${seller_order_id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update seller order status');
  return res.json(); // trả về seller_order đã cập nhật
}