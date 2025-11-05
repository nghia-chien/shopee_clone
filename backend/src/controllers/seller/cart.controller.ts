import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';

// 🧾 Lấy giỏ hàng của Seller (khi Seller mua hàng)
export async function listSellerCartController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const items = await prisma.cartItem.findMany({
      where: { sellerId },
      include: { product: true },
    });

    return res.json({ items });
  } catch (error) {
    console.error('Error fetching seller cart items:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// ➕ Thêm sản phẩm vào giỏ hàng (Seller mua hàng)
export async function addToSellerCartController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, quantity } = req.body;

    if (!productId || !quantity || isNaN(Number(quantity))) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    // ✅ Không cho Seller mua sản phẩm của chính mình
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerId === sellerId) {
      return res.status(400).json({ message: 'Cannot add your own product to cart' });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        sellerId_productId: {
          sellerId,
          productId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + Number(quantity) },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          sellerId,
          productId,
          quantity: Number(quantity),
        },
        include: { product: true },
      });
    }

    return res.json(cartItem);
  } catch (error: any) {
    console.error('Error adding to seller cart:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// ✏️ Cập nhật số lượng
export async function updateSellerCartItemController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, quantity } = req.body;

    if (!productId || isNaN(Number(quantity))) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        sellerId_productId: {
          sellerId,
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
      include: { product: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating seller cart item:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// 🗑️ Xóa sản phẩm khỏi giỏ hàng
export async function removeSellerCartItemController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        sellerId_productId: {
          sellerId,
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
    console.error('Error removing seller cart item:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

