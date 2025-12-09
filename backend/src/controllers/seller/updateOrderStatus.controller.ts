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

    // Kiểm tra seller sở hữu seller_order và lấy thông tin order items
    const sellerOrder = await prisma.seller_order.findFirst({
      where: {
        id,
        seller_id,
      },
      include: {
        orders: { 
          include: { 
            user: true,
            order_item: {
              include: {
                product: {
                  include: {
                    product_variant: true
                  }
                },
                product_variant: true
              }
            }
          } 
        },
        shipping_order: true,
      },
    });

    if (!sellerOrder) return res.status(404).json({ message: 'Seller order not found or not owned' });

    const fulfillmentStatus = FULFILLMENT_MAP[status] ?? null;

    // Sử dụng transaction để đảm bảo tính nhất quán
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái
      const updatedSellerOrder = await tx.seller_order.update({
        where: { id },
        data: {
          seller_status: status,
          ...(fulfillmentStatus ? { fulfillment_status: fulfillmentStatus } : {}),
        },
        include: {
          orders: { 
            include: { 
              user: true,
              order_item: {
                include: {
                  product: true,
                  product_variant: true
                }
              }
            } 
          },
          shipping_order: true,
        },
      });

      // 2. Đồng bộ fulfillment status với orders table
      if (fulfillmentStatus) {
        await tx.orders.update({
          where: { id: updatedSellerOrder.order_id },
          data: { fulfillment_status: fulfillmentStatus },
        }).catch((err) => console.error('Failed to sync fulfillment status to orders table:', err));
      }

      // ✅ 3. Xử lý stock VÀ sold khi đơn hàng được xác nhận (accepted)
          if (status === 'accepted') {
          console.log(`🔍 DEBUG: Vào phần accepted, status = ${status}`);
          console.log(`🔍 sellerOrder.orders.order_item length:`, sellerOrder.orders.order_item?.length);
          
          for (const item of sellerOrder.orders.order_item) {
            console.log(`🔍 Xử lý item: ${item.product.title}, seller_id: ${item.product.seller_id}, seller_id hiện tại: ${seller_id}`);
            
            if (item.product.seller_id !== seller_id) {
              console.log(`🔍 Bỏ qua item ${item.product.title} - không thuộc seller`);
              continue;
            }
            
            console.log(`🔍 Item ${item.product.title} thuộc về seller, sẽ cập nhật sold`);

          if (item.variant_id && item.product_variant) {
            // Kiểm tra stock variant
            const currentVariant = await tx.product_variant.findUnique({
              where: { id: item.variant_id }
            });

            if (!currentVariant || currentVariant.stock < item.quantity) {
              throw new Error(`Không đủ hàng cho biến thể: ${item.product_variant.title}`);
            }

            // Trừ stock variant
            await tx.product_variant.update({
              where: { id: item.variant_id },
              data: { stock: { decrement: item.quantity } }
            });
            console.log(`   - Trừ ${item.quantity} stock từ variant: ${item.product_variant.title}`);
            
          } else {
            // Kiểm tra stock product
            const currentProduct = await tx.product.findUnique({
              where: { id: item.product_id }
            });

            if (!currentProduct || currentProduct.stock < item.quantity) {
              throw new Error(`Không đủ hàng cho sản phẩm: ${item.product.title}`);
            }

            // Trừ stock product
            await tx.product.update({
              where: { id: item.product_id },
              data: { stock: { decrement: item.quantity } }
            });
            console.log(`   - Trừ ${item.quantity} stock từ product: ${item.product.title}`);
          }

          // ✅ TĂNG SOLD LUÔN KHI ĐƠN HÀNG ĐƯỢC CHẤP NHẬN
          // CHỈ tăng sold trong product (variant không có cột sold)
          await tx.product.update({
            where: { id: item.product_id },
            data: { sold: { increment: item.quantity } }
          });
          console.log(`   + Tăng ${item.quantity} sold cho product: ${item.product.title}`);
        }
      }

      // ✅ 4. Cộng lại stock VÀ giảm sold nếu đơn hàng bị hủy
      if (status === 'cancelled' && sellerOrder.seller_status === 'accepted') {
        console.log(`🔄 Cộng lại stock và giảm sold cho đơn hàng bị hủy ${id}`);
        
        for (const item of sellerOrder.orders.order_item) {
          if (item.product.seller_id !== seller_id) continue;

          if (item.variant_id && item.product_variant) {
            // Cộng stock variant
            await tx.product_variant.update({
              where: { id: item.variant_id },
              data: { stock: { increment: item.quantity } }
            });
            console.log(`   + Cộng ${item.quantity} stock vào variant: ${item.product_variant.title}`);
            
          } else {
            // Cộng stock product
            await tx.product.update({
              where: { id: item.product_id },
              data: { stock: { increment: item.quantity } }
            });
            console.log(`   + Cộng ${item.quantity} stock vào product: ${item.product.title}`);
          }

          // ✅ GIẢM SOLD KHI HỦY ĐƠN (vì đã tăng sold khi accepted)
          await tx.product.update({
            where: { id: item.product_id },
            data: { sold: { decrement: item.quantity } }
          });
          console.log(`   - Giảm ${item.quantity} sold cho product: ${item.product.title}`);
        }
      }
      

      // ✅ 6. Xử lý tạo đơn GHN khi seller accepted
      if (status === 'accepted') {
        const shippingOrder = sellerOrder.shipping_order;
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

      return updatedSellerOrder;
    });

    // ✅ 7. Gửi email cho buyer
    const buyerEmail = result.orders.user?.email;
    if (buyerEmail) {
      const html = `
        <h2>Đơn hàng cập nhật trạng thái</h2>
        <p>Mã đơn: ${result.orders.id}</p>
        <p>Trạng thái của shop ${req.seller?.name}: ${result.seller_status}</p>
      `;
      await sendEmail(buyerEmail, 'Cập nhật trạng thái đơn hàng', html).catch(err => 
        console.error('Failed to send email:', err)
      );
    }

    // ✅ 8. Gửi tin nhắn hệ thống trong chat thread
    if (result.orders.user_id && ['accepted', 'completed', 'cancelled'].includes(status)) {
      try {
        const thread = await createThreadIfNotExist(
          result.orders.user_id,
          seller_id
        );

        await sendSystemMessage(thread.id, result.order_id, status);
      } catch (chatError) {
        console.error('Error sending system message:', chatError);
      }
    }

    return res.json({ 
      message: 'Order status updated successfully',
      sellerOrder: result 
    });

  } catch (error: any) {
    console.error('updateSellerOrderStatusController error:', error);
    
    // Xử lý lỗi stock không đủ
    if (error.message?.includes('Không đủ hàng') || error.message?.includes('Insufficient stock')) {
      return res.status(400).json({ 
        message: error.message 
      });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
}