import { Request, Response } from 'express';
import { prisma } from '../utils/prisma'; // đường dẫn có thể tùy theo cấu trúc project của bạn

// 🧾 Lấy toàn bộ giỏ hàng của người dùng
export async function listcart_itemsController(req: Request & { user?: { id: string } }, res: Response) {
	try {
		const user_id = req.user?.id; // yêu cầu middleware auth gán req.user
		const items = await prisma.cart_item.findMany({
			where: { user_id },
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
		const user_id = req.user?.id;
		const { product_id, quantity } = req.body;

		if (!product_id || !quantity || isNaN(Number(quantity))) {
			return res.status(400).json({ message: 'Invalid input data' });
		}

		const existingItem = await prisma.cart_item.findUnique({
			where: {
				user_id_product_id: {
					user_id: user_id ?? '',
					product_id,
				},
			},
		});

		let cart_item;

		if (existingItem) {
			// Nếu sản phẩm đã có, cộng thêm số lượng
			cart_item = await prisma.cart_item.update({
				where: { id: existingItem.id },
				data: { quantity: existingItem.quantity + Number(quantity) },
			});
		} else {
			// Nếu chưa có, tạo mới
			cart_item = await prisma.cart_item.create({
				data: {
					user_id: user_id ?? '',
					product_id,
					quantity: Number(quantity),
				},
			});
		}

		return res.json(cart_item);
	} catch (error) {
		console.error('Error adding to cart:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

// ✏️ Cập nhật số lượng sản phẩm trong giỏ
export async function updatecart_itemController(req: Request & { user?: { id: string } }, res: Response) {
	try {
		const user_id = req.user?.id;
		const { product_id, quantity } = req.body;

		if (!product_id || isNaN(Number(quantity))) {
			return res.status(400).json({ message: 'Invalid input data' });
		}

		const cart_item = await prisma.cart_item.findUnique({
			where: {
				user_id_product_id: {
					user_id: user_id ?? '',
					product_id,
				},
			},
		});

		if (!cart_item) {
			return res.status(404).json({ message: 'Item not found in cart' });
		}

		const updated = await prisma.cart_item.update({
			where: { id: cart_item.id },
			data: { quantity: Number(quantity) },
		});

		return res.json(updated);
	} catch (error) {
		console.error('Error updating cart item:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

// 🗑️ Xóa sản phẩm khỏi giỏ hàng
export async function removecart_itemController(req: Request & { user?: { id: string } }, res: Response) {
	try {
		const user_id = req.user?.id;
		const { product_id } = req.params;

		const cart_item = await prisma.cart_item.findUnique({
			where: {
				user_id_product_id: {
					user_id: user_id ?? '',
					product_id,
				},
			},
		});

		if (!cart_item) {
			return res.status(404).json({ message: 'Item not found in cart' });
		}

		await prisma.cart_item.delete({ where: { id: cart_item.id } });

		return res.json({ message: 'Item removed from cart' });
	} catch (error) {
		console.error('Error removing cart item:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

export const getCartCountController = async (
  req: Request & { user?: { id: string } },
  res: Response
) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const distinctProducts = await prisma.cart_item.groupBy({
      by: ["product_id"],
      where: { user_id },
    });

    const count = distinctProducts.length;

    return res.json({ count });
  } catch (err) {
    console.error("Failed to get cart count:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
