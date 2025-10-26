import { Request, Response } from 'express';
import { prisma } from '../utils/prisma'; // đường dẫn có thể tùy theo cấu trúc project của bạn

// 🧾 Lấy toàn bộ giỏ hàng của người dùng
export async function listCartItemsController(req: Request & { user?: { id: string } }, res: Response) {
	try {
		const userId = req.user?.id; // yêu cầu middleware auth gán req.user
		const items = await prisma.cartItem.findMany({
			where: { userId },
			include: { product: true },
		});

		return res.json({ items });
	} catch (error) {
		console.error('Error fetching cart items:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

// ➕ Thêm sản phẩm vào giỏ hàng
export async function addToCartController(req: Request & { user?: { id: string } }, res: Response) {
	try {
		const userId = req.user?.id;
		const { productId, quantity } = req.body;

		if (!productId || !quantity || isNaN(Number(quantity))) {
			return res.status(400).json({ message: 'Invalid input data' });
		}

		const existingItem = await prisma.cartItem.findUnique({
			where: {
				userId_productId: {
					userId: userId ?? '',
					productId,
				},
			},
		});

		let cartItem;

		if (existingItem) {
			// Nếu sản phẩm đã có, cộng thêm số lượng
			cartItem = await prisma.cartItem.update({
				where: { id: existingItem.id },
				data: { quantity: existingItem.quantity + Number(quantity) },
			});
		} else {
			// Nếu chưa có, tạo mới
			cartItem = await prisma.cartItem.create({
				data: {
					userId: userId ?? '',
					productId,
					quantity: Number(quantity),
				},
			});
		}

		return res.json(cartItem);
	} catch (error) {
		console.error('Error adding to cart:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

// ✏️ Cập nhật số lượng sản phẩm trong giỏ
export async function updateCartItemController(req: Request & { user?: { id: string } }, res: Response) {
	try {
		const userId = req.user?.id;
		const { productId, quantity } = req.body;

		if (!productId || isNaN(Number(quantity))) {
			return res.status(400).json({ message: 'Invalid input data' });
		}

		const cartItem = await prisma.cartItem.findUnique({
			where: {
				userId_productId: {
					userId: userId ?? '',
					productId,
				},
			},
		});

		if (!cartItem) {
			return res.status(404).json({ message: 'Item not found in cart' });
		}

		const updated = await prisma.cartItem.update({
			where: { id: cartItem.id },
			data: { quantity: Number(quantity) },
		});

		return res.json(updated);
	} catch (error) {
		console.error('Error updating cart item:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

// 🗑️ Xóa sản phẩm khỏi giỏ hàng
export async function removeCartItemController(req: Request & { user?: { id: string } }, res: Response) {
	try {
		const userId = req.user?.id;
		const { productId } = req.params;

		const cartItem = await prisma.cartItem.findUnique({
			where: {
				userId_productId: {
					userId: userId ?? '',
					productId,
				},
			},
		});

		if (!cartItem) {
			return res.status(404).json({ message: 'Item not found in cart' });
		}

		await prisma.cartItem.delete({ where: { id: cartItem.id } });

		return res.json({ message: 'Item removed from cart' });
	} catch (error) {
		console.error('Error removing cart item:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}
