const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export interface Seller {
  id: string;
  email: string;
  name: string;
  phone_number?: string;
  status: string;
  rating?: number;
  address?: any;
  created_at: string;
  updated_at: string;
  _count?: {
    product: number;
    seller_order: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SellerListResponse {
  sellers: Seller[];
  pagination: PaginationMeta;
}

// Get all sellers
export async function getAdminSellers(token: string, page = 1, limit = 20, search = '', status?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(status && { status }),
  });
  
  const res = await fetch(`${API_URL}/admin/sellers?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch sellers');
  return res.json() as Promise<SellerListResponse>;
}

// Get seller by ID
export async function getAdminSeller(token: string, id: string) {
  const res = await fetch(`${API_URL}/admin/sellers/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch seller');
  return res.json() as Promise<{ seller: Seller }>;
}

// Create seller
export async function createAdminSeller(token: string, data: {
  name: string;
  email: string;
  phone_number?: string;
  password: string;
  address?: any;
  status?: 'active' | 'inactive';
}) {
  const res = await fetch(`${API_URL}/admin/sellers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create seller');
  }
  return res.json();
}

// Update seller
export async function updateAdminSeller(token: string, id: string, data: {
  name?: string;
  email?: string;
  phone_number?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  address?: any;
}) {
  const res = await fetch(`${API_URL}/admin/sellers/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update seller');
  }
  return res.json();
}

// Delete seller
export async function deleteAdminSeller(token: string, id: string) {
  const res = await fetch(`${API_URL}/admin/sellers/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete seller');
  }
  return res.json();
}

