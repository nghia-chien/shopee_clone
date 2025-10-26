export async function listOrders(userId: string) {
	return [];
}

export async function createOrder(userId: string, payload: unknown) {
	return { id: 'order_1', userId, payload };
}

export async function getOrderById(id: string) {
	return { id };
}
