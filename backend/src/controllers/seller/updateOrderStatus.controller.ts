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

      // ✅ 3. Xử lý stock khi đơn hàng được xác nhận (accepted) - ĐÃ SỬA TỪ 'processing' THÀNH 'accepted'
      if (status === 'accepted') {
        console.log(`🔄 Trừ stock cho đơn hàng ${id} (status: ${status})`);
        
        for (const item of sellerOrder.orders.order_item) {
          // Kiểm tra xem sản phẩm này có thuộc về seller không
          if (item.product.seller_id !== seller_id) {
            continue; // Bỏ qua nếu không phải sản phẩm của seller
          }

          if (item.variant_id && item.product_variant) {
            // Kiểm tra stock trước khi trừ
            const currentVariant = await tx.product_variant.findUnique({
              where: { id: item.variant_id }
            });

            if (!currentVariant || currentVariant.stock < item.quantity) {
              throw new Error(`Không đủ hàng cho biến thể: ${item.product_variant.title}`);
            }

            // Trừ stock trong variant
            await tx.product_variant.update({
              where: { id: item.variant_id },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
            console.log(`   - Trừ ${item.quantity} từ variant: ${item.product_variant.title}`);
            
          } else {
            // Kiểm tra stock trước khi trừ
            const currentProduct = await tx.product.findUnique({
              where: { id: item.product_id }
            });

            if (!currentProduct || currentProduct.stock < item.quantity) {
              throw new Error(`Không đủ hàng cho sản phẩm: ${item.product.title}`);
            }

            // Trừ stock trực tiếp trong product
            await tx.product.update({
              where: { id: item.product_id },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
            console.log(`   - Trừ ${item.quantity} từ product: ${item.product.title}`);
          }
        }
      }

      // ✅ 4. Cộng lại stock nếu đơn hàng bị hủy và trước đó đã được xác nhận - ĐÃ SỬA ĐIỀU KIỆN
      if (status === 'cancelled' && sellerOrder.seller_status === 'accepted') {
        console.log(`🔄 Cộng lại stock cho đơn hàng bị hủy ${id}`);
        
        for (const item of sellerOrder.orders.order_item) {
          // Kiểm tra xem sản phẩm này có thuộc về seller không
          if (item.product.seller_id !== seller_id) {
            continue;
          }

          if (item.variant_id && item.product_variant) {
            // Cộng stock trong variant
            await tx.product_variant.update({
              where: { id: item.variant_id },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            });
            console.log(`   + Cộng ${item.quantity} vào variant: ${item.product_variant.title}`);
            
          } else {
            // Cộng stock trực tiếp trong product
            await tx.product.update({
              where: { id: item.product_id },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            });
            console.log(`   + Cộng ${item.quantity} vào product: ${item.product.title}`);
          }
        }
      }

      // ✅ 5. TĂNG SOLD KHI ĐƠN HÀNG HOÀN THÀNH
      if (status === 'completed' && sellerOrder.seller_status === 'accepted') {
        console.log(`🔼 Tăng sold cho đơn hàng hoàn thành ${id}`);
        
        for (const item of sellerOrder.orders.order_item) {
          // Kiểm tra xem sản phẩm này có thuộc về seller không
          if (item.product.seller_id !== seller_id) {
            continue;
          }

          // CHỈ tăng sold trong product (variant không có cột sold)
          await tx.product.update({
            where: { id: item.product_id },
            data: {
              sold: {
                increment: item.quantity
              }
            }
          });
          console.log(`   + Tăng sold ${item.quantity} cho product: ${item.product.title}`);
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