export async function listOrders(user_id: string) {
	return [];
}

export async function createOrder(user_id: string, payload: unknown) {
	return { id: 'order_1', user_id, payload };
}

export async function getOrderById(id: string) {
	return { id };
}
