import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';
import { sendEmail } from '../../utils/email';
import { createThreadIfNotExist, sendSystemMessage } from '../../services/chat.service';

const ALLOWED = new Set(['pending', 'accepted', 'cancelled', 'completed']);
const FULFILLMENT_MAP: Record<string, string | null> = {
  pending: null,
  accepted: 'processing',
  completed: 'delivered',
  cancelled: 'cancelled',
};

export async function updateSellerOrderStatusController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params; // id của seller_order
    const { status } = req.body as { status: string };

    if (!status || !ALLOWED.has(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Kiểm tra seller sở hữu seller_order
    const sellerOrder = await prisma.seller_order.findFirst({
      where: {
        id,
        seller_id,
      },
      include: {
        orders: { include: { user: true } },
        shipping_order: true,
      },
    });

    if (!sellerOrder) return res.status(404).json({ message: 'Seller order not found or not owned' });

    const fulfillmentStatus = FULFILLMENT_MAP[status] ?? null;

    // Cập nhật trạng thái
    const updatedSellerOrder = await prisma.seller_order.update({
      where: { id },
      data: {
        seller_status: status,
        ...(fulfillmentStatus ? { fulfillment_status: fulfillmentStatus } : {}),
      },
      include: {
        orders: { include: { user: true } },
        shipping_order: true,
      },
    });

    if (fulfillmentStatus) {
      await prisma.orders.update({
        where: { id: updatedSellerOrder.order_id },
        data: { fulfillment_status: fulfillmentStatus },
      }).catch((err) => console.error('Failed to sync fulfillment status to orders table:', err));
    }

    if (status === 'accepted') {
      const shippingOrder = updatedSellerOrder.shipping_order;
      if (shippingOrder) {
        if (!shippingOrder.ghn_order_code) {
          try {
            const { retryShippingOrder } = await import('../../services/shippingRetry.service');
            await retryShippingOrder({ shippingOrderId: shippingOrder.id, maxRetries: 2 });
          } catch (retryError) {
            console.error('Failed to trigger GHN order creation after seller accepted:', retryError);
          }
        }
      } else {
        console.warn('Seller accepted order but shipping_order not found:', id);
      }
    }

    // Gửi email cho buyer
    const buyerEmail = updatedSellerOrder.orders.user?.email;
    if (buyerEmail) {
      const html = `
        <h2>Đơn hàng cập nhật trạng thái</h2>
        <p>Mã đơn: ${updatedSellerOrder.orders.id}</p>
        <p>Trạng thái của shop ${req.seller?.name}: ${updatedSellerOrder.seller_status}</p>
      `;
      await sendEmail(buyerEmail, 'Cập nhật trạng thái đơn hàng', html);
    }

    // Gửi tin nhắn hệ thống trong chat thread (nếu status là accepted, completed, hoặc cancelled)
    if (updatedSellerOrder.orders.user_id && ['accepted', 'completed', 'cancelled'].includes(status)) {
      try {
        // Tìm hoặc tạo thread giữa user và seller
        const thread = await createThreadIfNotExist(
          updatedSellerOrder.orders.user_id,
          seller_id
        );

        // Gửi tin nhắn hệ thống
        await sendSystemMessage(thread.id, updatedSellerOrder.order_id, status);
      } catch (chatError) {
        // Log lỗi nhưng không fail request nếu chat có vấn đề
        console.error('Error sending system message:', chatError);
      }
    }

    return res.json({ sellerOrder: updatedSellerOrder });
  } catch (error) {
    console.error('updateSellerOrderStatusController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
