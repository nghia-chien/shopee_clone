import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';

/**
 * 🛒 Tạo đơn hàng mới từ giỏ hàng (Seller mua hàng)
 */
export async function createSellerOrderController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Lấy giỏ hàng của seller
    const cartItems = await prisma.cartItem.findMany({
      where: { sellerId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // ✅ Tính tổng tiền
    const total = cartItems.reduce((sum, item) => {
      const price = Number(item.product.price);
      return sum + price * item.quantity;
    }, 0);

    // ✅ Tạo đơn hàng + OrderItems
    const order = await prisma.orders.create({
      data: {
        sellerId, // Seller mua hàng
        total,
        status: 'pending',
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
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
    await prisma.cartItem.deleteMany({ where: { sellerId } });

    return res.status(201).json(order);
  } catch (error) {
    console.error('❌ createSellerOrderController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 📋 Lấy danh sách đơn hàng (Seller đã mua)
 */
export async function listSellerOrdersController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await prisma.orders.findMany({
      where: { sellerId }, // Orders mà seller đã mua
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ orders });
  } catch (error) {
    console.error('❌ listSellerOrdersController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 📦 Lấy đơn hàng đã bán (sản phẩm của seller được mua)
 */
export async function listSellerSoldOrdersController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Lấy tất cả products của seller
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId },
      select: { id: true },
    });

    const productIds = sellerProducts.map((p) => p.id);

    // ✅ Lấy các OrderItems có products của seller
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productId: { in: productIds },
      },
      include: {
        product: true,
        orders: {
          include: {
            user: {
              select: { name: true, email: true, phoneNumber: true },
            },
            seller: {
              select: { name: true, email: true, phoneNumber: true },
            },
          },
        },
      },
      orderBy: { orders: { createdAt: 'desc' } },
    });

    // ✅ Nhóm theo orders
    const orderMap = new Map();
    orderItems.forEach((item) => {
      const orderId = item.orders.id;
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          ...item.orders,
          items: [],
        });
      }
      orderMap.get(orderId).items.push(item);
    });

    const orders = Array.from(orderMap.values());

    return res.json({ orders });
  } catch (error) {
    console.error('❌ listSellerSoldOrdersController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 🔍 Lấy chi tiết một đơn hàng
 */
export async function getSellerOrderController(req: SellerRequest, res: Response) {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const order = await prisma.orders.findFirst({
      where: {
        id,
        OR: [
          { sellerId }, // Seller đã mua đơn này
          {
            items: {
              some: {
                product: {
                  sellerId, // Hoặc seller đã bán sản phẩm trong đơn này
                },
              },
            },
          },
        ],
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
        user: {
          select: { name: true, email: true, phoneNumber: true },
        },
        seller: {
          select: { name: true, email: true, phoneNumber: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json({ order });
  } catch (error) {
    console.error('❌ getSellerOrderController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

