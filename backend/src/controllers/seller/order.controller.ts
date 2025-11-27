import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';
import { sendEmail } from '../../utils/email';

/** 
 * 📦 Lấy danh sách đơn hàng đã bán của seller
 */
export async function listSellerSoldOrdersController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const orders = await prisma.seller_order.findMany({
    where: { seller_id },
    include: {
      orders: {
        include: {
          user: { select: { name: true, email: true, phone_number: true } },
          order_item: {
            include: {
              product: { select: { id: true, title: true, images: true } },
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });


    return res.json({ orders });
  } catch (error) {
    console.error('❌ listSellerSoldOrdersController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 🔍 Lấy chi tiết một đơn hàng của seller
 */
export async function getSellerOrderController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;

    const sellerOrder = await prisma.seller_order.findFirst({
      where: { id, seller_id },
      include: {
        orders: {
          include: {
            user: { select: { name: true, email: true, phone_number: true } },
            order_item: { // từ orders lấy ra các sản phẩm
              include: {
                product: { select: { id: true, title: true, images: true } },
              },
            },
          },
        },
      },
    });


    if (!sellerOrder) return res.status(404).json({ message: 'Seller order not found' });

    return res.json({ sellerOrder });
  } catch (error) {
    console.error('❌ getSellerOrderController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getSellerOrderTimelineController(req: SellerRequest, res: Response) {
  try {
    // TODO: implement seller order timeline retrieval
    return res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    console.error('❌ getSellerOrderTimelineController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateSellerOrderTrackingController(req: SellerRequest, res: Response) {
  try {
    // TODO: implement seller order tracking update
    return res.status(501).json({ message: 'Not implemented yet' });
  } catch (error) {
    console.error('❌ updateSellerOrderTrackingController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

