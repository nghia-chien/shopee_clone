import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// Kiểu request có user
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * 📦 Lấy danh sách đơn hàng của người dùng hiện tại
 */
// Lấy tất cả seller_order của user, kèm thông tin product
export async function listOrdersController(req: AuthenticatedRequest, res: Response) {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const sellerOrders = await prisma.seller_order.findMany({
      where: {
        orders: {
          user_id
        }
      },
      include: {
        orders: {
          include: {
            order_item: {
              include: { product: true }
            }
          }
        },
        seller: true
      },
      orderBy: { created_at: 'desc' }
    });

    const mapped = sellerOrders.map(so => {
      const items = so.orders.order_item.filter(oi => oi.product.seller_id === so.seller_id);
      return {
        id: so.id,
        order_id: so.order_id,
        seller: so.seller,
        total: Number(so.total),
        status: so.seller_status || 'pending',
        created_at: so.created_at,
        items: items.map(i => ({
          id: i.id,
          product_id: i.product_id,
          title: i.product.title,
          images: i.product.images,
          price: Number(i.price),
          quantity: i.quantity
        }))
      };
    });

    return res.json({ data: mapped });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * 🛒 Tạo đơn hàng mới từ giỏ hàng
 */
export async function createOrderController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { cart_item_ids } = req.body as { cart_item_ids?: string[] };

    // Lấy chi tiết các item được chọn trong giỏ hàng
    const cart_items = await prisma.cart_item.findMany({
      where: {
        user_id: req.user.id,
        id: { in: cart_item_ids },
      },
      include: { product: true },
    });

    if (cart_items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Tính tổng tiền order
    const total = cart_items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

    // Tạo order cùng order_item
    const order = await prisma.orders.create({
      data: {
        user_id: req.user.id,
        total,
        status: 'pending',
        order_item: {
          create: cart_items.map((item) => ({
            product_id: item.product_id,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        order_item: { include: { product: true } },
      },
    });

    // Nhóm order_item theo seller_id để tạo seller_order
    const sellerMap = new Map<string, typeof cart_items>();
    cart_items.forEach((item) => {
      const sellerId = item.product.seller_id;
      if (!sellerMap.has(sellerId)) sellerMap.set(sellerId, []);
      sellerMap.get(sellerId)!.push(item);
    });

    // Tạo seller_order cho từng seller
    const sellerOrders = [];
    for (const [seller_id, items] of sellerMap) {
      const sellerTotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
      const sellerOrder = await prisma.seller_order.create({
        data: {
          order_id: order.id,
          seller_id,
          total: sellerTotal,
          seller_status: 'pending',
          created_at: order.created_at,
          updated_at: order.updated_at,
        },
      });
      sellerOrders.push(sellerOrder);
    }

    // Xóa các cart_item đã chọn
    await prisma.cart_item.deleteMany({
      where: { user_id: req.user.id, id: { in: cart_item_ids } },
    });

    return res.status(201).json({ order, sellerOrders });
  } catch (error) {
    console.error('❌ createOrderController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}



/**
 * 🔍 Lấy chi tiết một đơn hàng hoặc tất cả đơn hàng
 */
export async function getOrdersController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Lấy tất cả đơn hàng của user, kèm order_item + product + seller_order
    const orders = await prisma.orders.findMany({
      where: { user_id: req.user.id },
      include: {
        order_item: { 
          include: { 
            product: true 
          } 
        },
        seller_order: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }, // mới nhất lên đầu
    });

    return res.status(200).json({ items: orders }); // ⚡ trả về array
  } catch (error) {
    console.error('❌ getOrdersController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
