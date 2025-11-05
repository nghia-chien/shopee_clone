const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Get seller orders (orders seller purchased)
export async function getSellerOrders(token: string) {
  const res = await fetch(`${API_URL}/seller/order/purchased`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

// Get seller sold orders (orders with seller's products)
export async function getSellerSoldOrders(token: string) {
  const res = await fetch(`${API_URL}/seller/order/sold`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch sold orders');
  return res.json();
}

// Get order details
export async function getSellerOrderDetails(token: string, orderId: string) {
  const res = await fetch(`${API_URL}/seller/order/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch order details');
  return res.json();
}

// Create order from cart
export async function createSellerOrder(token: string) {
  const res = await fetch(`${API_URL}/seller/order`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
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

// Update order status (accept/cancel/complete)
export async function updateSellerOrderStatus(token: string, orderId: string, status: 'accepted' | 'cancelled' | 'completed' | 'pending') {
  const res = await fetch(`${API_URL}/seller/order/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

