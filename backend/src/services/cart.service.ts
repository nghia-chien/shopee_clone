export async function getCart(user_id: string) {
	return { user_id, items: [] };
}

export async function addToCart(user_id: string, product_id: string, quantity: number) {
	return { user_id, product_id, quantity };
}

export async function removeFromCart(user_id: string, product_id: string) {
	return { user_id, product_id };
}
