import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';

const ALLOWED = new Set(['pending', 'accepted', 'cancelled', 'completed']);

export async function updateSellerOrderStatusController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { status } = req.body as { status: string };
    if (!status || !ALLOWED.has(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Ensure seller owns at least one item in this order (seller is the seller of products)
    const ownsOrder = await prisma.orders.findFirst({
      where: {
        id,
        items: { some: { product: { seller_id } } },
      },
      select: { id: true, status: true },
    });

    if (!ownsOrder) return res.status(404).json({ message: 'Order not found or not owned' });

    const updated = await prisma.orders.update({
      where: { id },
      data: { status },
      include: {
        items: { include: { product: true } },
      },
    });

    return res.json({ order: updated });
  } catch (error) {
    console.error('updateSellerOrderStatusController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


