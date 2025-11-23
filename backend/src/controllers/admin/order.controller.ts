import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';

// GET ALL ORDERS
export async function getAllOrdersController(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', search = '', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { id: { contains: search as string, mode: 'insensitive' } },
        { to_name: { contains: search as string, mode: 'insensitive' } },
        { to_phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          order_item: {
            include: {
              product: {
                select: { id: true, title: true, price: true },
              },
            },
          },
          seller_order: {
            include: {
              seller: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.orders.count({ where }),
    ]);

    return res.json({
      items: orders,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getAllOrdersController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// GET ORDER BY ID
export async function getOrderByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone_number: true },
        },
        order_item: {
          include: {
            product: {
              select: { id: true, title: true, price: true, images: true },
            },
          },
        },
        seller_order: {
          include: {
            seller: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order });
  } catch (err: any) {
    console.error('getOrderByIdController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// UPDATE ORDER STATUS
export async function updateOrderController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, fulfillment_status } = req.body;

    const order = await prisma.orders.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(fulfillment_status && { fulfillment_status }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        order_item: true,
        seller_order: true,
      },
    });

    return res.json({ order, message: 'Cập nhật đơn hàng thành công' });
  } catch (err: any) {
    console.error('updateOrderController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

