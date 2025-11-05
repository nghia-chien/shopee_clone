const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Get seller cart
export async function getSellerCart(token: string) {
  const res = await fetch(`${API_URL}/seller/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

// Add to seller cart
export async function addToSellerCart(token: string, productId: string, quantity: number) {
  const res = await fetch(`${API_URL}/seller/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

// Update seller cart item
export async function updateSellerCartItem(token: string, productId: string, quantity: number) {
  const res = await fetch(`${API_URL}/seller/cart/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart');
  return res.json();
}

// Remove from seller cart
export async function removeFromSellerCart(token: string, productId: string) {
  const res = await fetch(`${API_URL}/seller/cart/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to remove from cart');
  return res.json();
}

