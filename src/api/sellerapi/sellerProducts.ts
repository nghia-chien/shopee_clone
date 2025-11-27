import { useSellerAuthStore } from '../../store/SellerAuth';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Upload image
export async function uploadSellerImage(file: File) {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_URL}/seller/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url as string;
}

// Fetch seller products
export async function fetchSellerProducts(token: string) {
  try {
    console.log('Fetching products with token:', token ? 'Token exists' : 'No token');
    console.log('API_URL:', API_URL);
    
    const res = await fetch(`${API_URL}/seller/product`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}. ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Products data received:', data);
    return data;
  } catch (error) {
    console.error('Fetch products error:', error);
    throw error;
  }
}

// Get seller product by ID
export async function getSellerProductById(token: string, productId: string) {
  try {
    console.log('Fetching product by ID:', productId);
    console.log('API_URL:', API_URL);
    
    const res = await fetch(`${API_URL}/seller/product/${productId}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}. ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Product data received:', data);
    return data;
  } catch (error) {
    console.error('Fetch product by ID error:', error);
    throw error;
  }
}

// Create seller product
export async function createSellerProduct(token: string, productData: {
  title: string;
  description: Array<{ type: "text" | "image"; content: string }>;
  images: string[];
  price?: number;
  stock?: number;
  categoryId: string;
  attributes?: Record<string, any>;
  discount?: number;
  rating?: number;
  tags?: string;
  variants?: Array<{ title: string; price: number; stock: number; image?: string }>;
}) {
  const res = await fetch(`${API_URL}/seller/product`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(productData),
  });

  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

// Update seller product
export async function updateSellerProduct(token: string, product_id: string, data: {
  title?: string;
  description?: Array<{ type: "text" | "image"; content: string }>;
  images?: string[];
  price?: number;
  stock?: number;
  categoryId?: string;
  attributes?: Record<string, any>;
  discount?: number;
  rating?: number;
  tags?: string;
  status?: "active" | "inactive";
  variants?: Array<{ title: string; price: number; stock: number; image?: string }>;
}) {
  const res = await fetch(`${API_URL}/seller/product/${product_id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
}

// Delete seller product
export async function deleteSellerProduct(token: string, product_id: string) {
  const res = await fetch(`${API_URL}/seller/product/${product_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

// Update product status
export async function updateProductStatus(token: string, product_id: string, status: "active" | "inactive") {
  const res = await fetch(`${API_URL}/seller/product/${product_id}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error('Failed to update product status');
  return res.json();
}

// Categories
export async function getCategoryTree() {
  const res = await fetch(`${API_URL}/categories/tree`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function getCategoryAttributes(categoryId: string) {
  const res = await fetch(`${API_URL}/categories/${categoryId}/attributes`);
  if (!res.ok) throw new Error('Failed to fetch attributes');
  return res.json();
}