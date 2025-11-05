import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// Kiểu request có user
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * 📦 Lấy danh sách đơn hàng của người dùng hiện tại
 */
export async function listOrdersController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await prisma.orders.findMany({
      where: { user_id: req.user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { creat_at: 'desc' },
    });

    return res.json({ items: orders });
  } catch (error) {
    console.error('❌ listOrdersController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 🛒 Tạo đơn hàng mới từ giỏ hàng
 */
export async function createOrderController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Lấy giỏ hàng của user
    const cart_items = await prisma.cart_item.findMany({
      where: { user_id: req.user.id },
      include: { product: true },
    });

    if (cart_items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // ✅ Tính tổng tiền
    const total = cart_items.reduce((sum, item) => {
      const price = Number(item.product.price);
      return sum + price * item.quantity;
    }, 0);

    // ✅ Tạo đơn hàng + OrderItems
    const order = await prisma.orders.create({
      data: {
        user_id: req.user.id,
        total,
        status: 'pending',
        items: {
          create: cart_items.map((item) => ({
            product_id: item.product_id,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // ✅ Xóa giỏ hàng sau khi đặt đơn
    await prisma.cart_item.deleteMany({ where: { user_id: req.user.id } });

    return res.status(201).json(order);
  } catch (error) {
    console.error('❌ createOrderController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 🔍 Lấy chi tiết một đơn hàng
 */
export async function getOrderController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const order = await prisma.orders.findFirst({
      where: { id, user_id: req.user.id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('❌ getOrderController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
