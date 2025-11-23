const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(init?.headers ?? {}),
		},
	});
	if (!res.ok) {
		throw new Error(`API error: ${res.status}`);
	}
	return (await res.json()) as T;
}
export async function getUserOrders(token: string) {
	const res = await fetch(`${API_URL}/orders`, {
	  headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) throw new Error('Failed to fetch orders');
	return res.json(); // trả về seller_order[] đã map sẵn
  }

// Product interface
export interface Product {
	id: string;
	title: string;
	images: string[];
	price: string;
}

// Lấy sản phẩm theo slug category
export async function getProductsByCategorySlug(slug: string): Promise<Product[]> {
	return api<Product[]>(`/categories/slug/${slug}/products`);
}

// Lấy danh sách categories
export interface Category {
	id: string;
	name: string;
	slug: string;
	icon: string;
}
export async function getCategories(): Promise<Category[]> {
	return api<Category[]>('/categories');
}

// Lấy attributes theo slug
export async function getCategoryAttributes(slug: string): Promise<any> {
	return api(`/categories/slug/${slug}/attributes`);
}

// Lấy category tree
export async function getCategoryTree(): Promise<any> {
	return api('/categories/tree');
}

export interface MallShop {
  id: string;
  name: string;
  logo?: string;
  rating: number;
  isOfficial: boolean;
}

export async function getMallShops(): Promise<MallShop[]> {
  const res = await fetch(`${API_URL}/shops/mall`);
  if (!res.ok) throw new Error("Failed to fetch mall shops");
  return res.json();
}

// Flash Sale Product interface
export interface FlashSaleProduct {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  stock: number;
  sold: number;
  seller: {
    id: string;
    name: string;
    shop_mall: string | null;
  };
  voucher: {
    id: string;
    code: string;
    end_at: string;
  };
}

export interface FlashSaleProductsResponse {
  products: FlashSaleProduct[];
  total: number;
}

// Lấy flash sale products
export async function getFlashSaleProducts(params?: { shop_status?: string; limit?: number }): Promise<FlashSaleProductsResponse> {
  const query = new URLSearchParams();
  if (params?.shop_status) query.append('shop_status', params.shop_status);
  if (params?.limit) query.append('limit', params.limit.toString());
  const qs = query.toString();
  return api<FlashSaleProductsResponse>(`/products/flash-sale${qs ? `?${qs}` : ''}`);
}