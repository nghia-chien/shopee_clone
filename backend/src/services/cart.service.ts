export async function getCart(userId: string) {
	return { userId, items: [] };
}

export async function addToCart(userId: string, productId: string, quantity: number) {
	return { userId, productId, quantity };
}

export async function removeFromCart(userId: string, productId: string) {
	return { userId, productId };
}
