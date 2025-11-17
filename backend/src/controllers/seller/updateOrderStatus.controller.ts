import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';
import { sendEmail } from '../../utils/email';
import { createThreadIfNotExist, sendSystemMessage } from '../../services/chat.service';

const ALLOWED = new Set(['pending', 'accepted', 'cancelled', 'completed']);

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
      },
    });

    if (!sellerOrder) return res.status(404).json({ message: 'Seller order not found or not owned' });

    // Cập nhật trạng thái
    const updatedSellerOrder = await prisma.seller_order.update({
      where: { id },
      data: { seller_status: status },
      include: {
        orders: { include: { user: true } },
      },
    });

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
