import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';

// 🧾 Lấy giỏ hàng của Seller (khi Seller mua hàng)
export async function listSellerCartController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const items = await prisma.cart_item.findMany({
      where: { seller_id },
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
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || isNaN(Number(quantity))) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    // ✅ Không cho Seller mua sản phẩm của chính mình
    const product = await prisma.product.findUnique({
      where: { id: product_id },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller_id === seller_id) {
      return res.status(400).json({ message: 'Cannot add your own product to cart' });
    }

    const existingItem = await prisma.cart_item.findUnique({
      where: {
        seller_id_product_id: {
          seller_id,
          product_id,
        },
      },
    });

    let cart_item;

    if (existingItem) {
      cart_item = await prisma.cart_item.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + Number(quantity) },
      });
    } else {
      cart_item = await prisma.cart_item.create({
        data: {
          seller_id,
          product_id,
          quantity: Number(quantity),
        },
        include: { product: true },
      });
    }

    return res.json(cart_item);
  } catch (error: any) {
    console.error('Error adding to seller cart:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

// ✏️ Cập nhật số lượng
export async function updateSellercart_itemController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { product_id, quantity } = req.body;

    if (!product_id || isNaN(Number(quantity))) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    const cart_item = await prisma.cart_item.findUnique({
      where: {
        seller_id_product_id: {
          seller_id,
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
      include: { product: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating seller cart item:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// 🗑️ Xóa sản phẩm khỏi giỏ hàng
export async function removeSellercart_itemController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { product_id } = req.params;

    const cart_item = await prisma.cart_item.findUnique({
      where: {
        seller_id_product_id: {
          seller_id,
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
    console.error('Error removing seller cart item:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

