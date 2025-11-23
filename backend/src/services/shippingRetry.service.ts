import { prisma } from '../utils/prisma';
import { createGhnOrderInternal, validateAndFormatPhone, validateGhnOrderParams } from '../controllers/shipping.controller';
import { notifyGhnOrderFailure, notifyMultipleGhnFailures } from './notification.service';

interface RetryShippingOrderParams {
  shippingOrderId: string;
  maxRetries?: number;
}

/**
 * Retry tạo GHN order cho một shipping_order đã fail
 */
export async function retryShippingOrder({ shippingOrderId, maxRetries = 3 }: RetryShippingOrderParams) {
  const shippingOrder = await prisma.shipping_order.findUnique({
    where: { id: shippingOrderId },
    include: {
      seller_order: {
        include: {
          orders: {
            include: {
              order_item: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
  });

  if (!shippingOrder) {
    throw new Error(`Shipping order ${shippingOrderId} not found`);
  }

  if (shippingOrder.status === 'created' && shippingOrder.ghn_order_code) {
    return { success: true, message: 'Order already created' };
  }

  // Lấy address từ order
  const order = shippingOrder.seller_order.orders;
  if (!order.to_ward_name || !order.to_district_name) {
    throw new Error('Order missing address information');
  }

  // Tính weight từ items
  const items = shippingOrder.items as Array<{
    name: string;
    quantity: number;
    weight: number;
    price: number;
    product_code?: string;
  }> || [];

  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0) || shippingOrder.weight || 500;

  // Shop config từ env
  const shopConfig = {
    from_name: process.env.SHIP_FROM_NAME || 'Shop',
    from_phone: process.env.SHIP_FROM_PHONE || '',
    from_address: process.env.SHIP_FROM_ADDRESS || 'Hà Nội',
    from_ward_code: process.env.SHIP_FROM_WARD_CODE || '',
    from_district_id: Number(process.env.SHIP_FROM_DISTRICT_ID || 1450),
  };

  // Validate đầy đủ thông tin trước khi retry để tránh retry không cần thiết
  const validation = validateGhnOrderParams({
    to_name: order.to_name,
    to_phone: order.to_phone,
    to_address: order.to_address,
    to_ward_code: shippingOrder.to_ward_code,
    to_district_id: shippingOrder.to_district_id,
    from_name: shopConfig.from_name,
    from_phone: shopConfig.from_phone,
    from_address: shopConfig.from_address,
    from_ward_code: shopConfig.from_ward_code,
    from_district_id: shopConfig.from_district_id,
    weight: totalWeight,
    items: items,
  });

  if (!validation.valid) {
    console.error('❌ Validation failed before retry:', validation.error);
    throw new Error(`Validation failed: ${validation.error}`);
  }

  const validated = validation.validatedParams!;

  // Retry với exponential backoff
  let lastError: string | null = null;
  const currentRetryCount = shippingOrder.retry_count || 0;
  const newRetryCount = currentRetryCount + 1;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const ghnOrder = await createGhnOrderInternal({
        to_name: validated.to_name,
        to_phone: validated.to_phone,
        to_address: validated.to_address,
        to_ward_code: validated.to_ward_code,
        to_district_id: validated.to_district_id,
        weight: validated.weight,
        length: shippingOrder.length || 10,
        width: shippingOrder.width || 10,
        height: shippingOrder.height || 10,
        service_type_id: shippingOrder.service_type_id || 2,
        payment_type_id: shippingOrder.payment_type_id || 2,
        required_note: 'KHONGCHOXEMHANG',
        note: '',
        items: items,
        from_name: validated.from_name,
        from_phone: validated.from_phone,
        from_address: validated.from_address,
        from_ward_code: validated.from_ward_code,
        from_district_id: validated.from_district_id,
      });

      const orderCode = ghnOrder?.order_code || ghnOrder?.data?.order_code || null;

      if (orderCode) {
        // Update shipping_order với success
        await prisma.shipping_order.update({
          where: { id: shippingOrderId },
          data: {
            ghn_order_code: orderCode,
            status: 'created',
            error_message: null,
            retry_count: newRetryCount + attempt - 1,
            last_retry_at: new Date(),
            updated_at: new Date(),
          },
        });

        return { success: true, orderCode, retryCount: newRetryCount + attempt - 1 };
      }

      lastError = 'GHN API returned success but order_code is missing';
    } catch (error: any) {
      lastError = error.message || 'Unknown error';

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Update với failed status
  await prisma.shipping_order.update({
    where: { id: shippingOrderId },
    data: {
      status: 'failed',
      error_message: lastError,
      retry_count: newRetryCount + maxRetries,
      last_retry_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Gửi notification về failure
  try {
    await notifyGhnOrderFailure({
      shippingOrderId,
      sellerOrderId: shippingOrder.seller_order_id,
      orderId: shippingOrder.seller_order.orders.id,
      error: lastError || 'Unknown error',
      retryCount: newRetryCount + maxRetries,
    });
  } catch (notifError) {
    console.error('Failed to send notification:', notifError);
  }

  return { success: false, error: lastError, retryCount: newRetryCount + maxRetries };
}

/**
 * Retry tất cả shipping orders có status = 'failed' hoặc 'retrying'
 */
export async function retryAllFailedShippingOrders(maxRetries: number = 3) {
  const failedOrders = await prisma.shipping_order.findMany({
    where: {
      status: { in: ['failed', 'retrying'] },
      // Chỉ retry những order chưa retry quá 10 lần
      retry_count: { lt: 10 },
    },
    take: 50, // Giới hạn 50 orders mỗi lần chạy
  });

  // Gửi notification nếu có nhiều failed orders
  if (failedOrders.length > 0) {
    try {
      await notifyMultipleGhnFailures(failedOrders.length);
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }
  }

  const results = [];

  for (const order of failedOrders) {
    try {
      // Update status thành retrying
      await prisma.shipping_order.update({
        where: { id: order.id },
        data: { status: 'retrying' },
      });

      const result = await retryShippingOrder({
        shippingOrderId: order.id,
        maxRetries,
      });

      results.push({
        shippingOrderId: order.id,
        sellerOrderId: order.seller_order_id,
        ...result,
      });
    } catch (error: any) {
      results.push({
        shippingOrderId: order.id,
        sellerOrderId: order.seller_order_id,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    total: failedOrders.length,
    results,
  };
}

