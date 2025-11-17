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