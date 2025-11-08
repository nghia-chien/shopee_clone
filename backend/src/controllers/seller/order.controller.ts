import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';
import { sendEmail } from '../../utils/email';

/**
 * 🛒 Tạo đơn hàng mới từ giỏ hàng (Seller mua hàng)
 */
export async function createSellerOrderController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Lấy giỏ hàng của seller
    const cart_items = await prisma.cart_item.findMany({
      where: { seller_id },
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

    // ✅ Tạo đơn hàng + order_items
    const order = await prisma.orders.create({
      data: {
        seller_id, // Seller mua hàng
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
    await prisma.cart_item.deleteMany({ where: { seller_id } });

    // 📧 Gửi email xác nhận đơn hàng cho seller đã mua (nếu có SMTP)
    const to = order.seller?.email;
    if (to) {
      const html = `
        <h2>Đơn hàng đã được tạo</h2>
        <p>Mã đơn: ${order.id}</p>
        <p>Tổng tiền: ${Number(order.total).toLocaleString('vi-VN')} VND</p>
        <p>Trạng thái: ${order.status}</p>
      `;
      await sendEmail(to, 'Xác nhận tạo đơn hàng', html);
    }

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
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await prisma.orders.findMany({
      where: { seller_id }, // Orders mà seller đã mua
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
      orderBy: { created_at: 'desc' },
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
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Lấy tất cả products của seller
    const sellerProducts = await prisma.product.findMany({
      where: { seller_id },
      select: { id: true },
    });

    const product_ids = sellerProducts.map((p) => p.id);

    // ✅ Lấy các order_items có products của seller
    const order_items = await prisma.order_item.findMany({
      where: {
        product_id: { in: product_ids },
      },
      include: {
        product: true,
        orders: {
          include: {
            user: {
              select: { name: true, email: true, phone_number: true },
            },
            seller: {
              select: { name: true, email: true, phone_number: true },
            },
          },
        },
      },
      orderBy: { orders: { created_at: 'desc' } },
    });

    // ✅ Nhóm theo orders
    const orderMap = new Map();
    order_items.forEach((item) => {
      const order_id = item.orders.id;
      if (!orderMap.has(order_id)) {
        orderMap.set(order_id, {
          ...item.orders,
          items: [],
        });
      }
      orderMap.get(order_id).items.push(item);
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
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    const order = await prisma.orders.findFirst({
      where: {
        id,
        OR: [
          { seller_id }, // Seller đã mua đơn này
          {
            items: {
              some: {
                product: {
                  seller_id, // Hoặc seller đã bán sản phẩm trong đơn này
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
          select: { name: true, email: true, phone_number: true },
        },
        seller: {
          select: { name: true, email: true, phone_number: true },
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

