import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { callGhnApi } from '../controllers/shipping.controller';
import { sendNotification } from './notification.service';

type InternalStatus =
  | 'pending'
  | 'processing'
  | 'ready_to_pick'
  | 'picked'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'failed';
// đổi trạng thái ghn_status -> fulfillment_status
const GHN_STATUS_MAP: Record<string, { internalStatus: InternalStatus; note: string }> = {
  ready_to_pick: { internalStatus: 'ready_to_pick', note: 'GHN sẵn sàng lấy hàng' },
  picking: { internalStatus: 'processing', note: 'GHN đang đến lấy hàng' },
  storing: { internalStatus: 'processing', note: 'Đơn đang ở kho GHN' },
  sorting: { internalStatus: 'processing', note: 'Đơn đang được phân loại' },
  picked: { internalStatus: 'picked', note: 'GHN đã nhận hàng' },
  money_collect_picking: { internalStatus: 'processing', note: 'GHN đang thu tiền khi lấy hàng' },
  delivering: { internalStatus: 'delivering', note: 'Đơn đang được giao' },
  transporting: { internalStatus: 'delivering', note: 'Đơn đang vận chuyển' },
  money_collect_delivering: { internalStatus: 'delivering', note: 'GHN đang thu tiền khi giao hàng' },
  delivered: { internalStatus: 'delivered', note: 'Đơn đã giao thành công' },
  delivery_fail: { internalStatus: 'failed', note: 'Giao thất bại' },
  waiting_to_return: { internalStatus: 'returned', note: 'Chờ hoàn hàng' },
  returned: { internalStatus: 'returned', note: 'Đơn đã hoàn về' },
  return: { internalStatus: 'returned', note: 'Đơn đang hoàn về' },
  return_transporting: { internalStatus: 'returned', note: 'Đơn đang được hoàn trả' },
  return_sorting: { internalStatus: 'returned', note: 'Đơn hoàn đang phân loại' },
  returning: { internalStatus: 'returned', note: 'Đơn đang hoàn hàng' },
  return_fail: { internalStatus: 'failed', note: 'Hoàn hàng thất bại' },
  cancel: { internalStatus: 'cancelled', note: 'Đơn đã bị hủy' },
  cancelled: { internalStatus: 'cancelled', note: 'Đơn đã bị hủy' },
  damage: { internalStatus: 'failed', note: 'Đơn bị hư hỏng' },
  lost: { internalStatus: 'failed', note: 'Đơn thất lạc' },
  exception: { internalStatus: 'failed', note: 'GHN báo ngoại lệ' },
};

function normalizeGhnStatus(status?: string | null) {
  if (!status) return null;
  return status.toLowerCase();
}

function mapGhnStatus(ghnStatus: string): { internalStatus: InternalStatus; note: string } {
  const normalized = normalizeGhnStatus(ghnStatus);
  if (normalized && GHN_STATUS_MAP[normalized]) {
    return GHN_STATUS_MAP[normalized];
  }

  return {
    internalStatus: 'processing',
    note: 'GHN cập nhật trạng thái mới',
  };
}

function shouldNotifyStatus(status: InternalStatus | null) {
  if (!status) return false;
  return ['delivering', 'delivered', 'cancelled', 'returned', 'failed'].includes(status);
}

interface ProcessStatusUpdateParams {
  ghnOrderCode: string;
  ghnStatus: string;
  providerPayload?: any;
  providerTime?: string;
}

export async function processGhnStatusUpdate({
  ghnOrderCode,
  ghnStatus,
  providerPayload,
  providerTime,
}: ProcessStatusUpdateParams) {
  const normalized = normalizeGhnStatus(ghnStatus);
  if (!normalized) {
    throw new Error('GHN status is missing');
  }

  const shippingOrder = await prisma.shipping_order.findFirst({
    where: { ghn_order_code: ghnOrderCode },
    include: {
      seller_order: {
        include: {
          orders: true,
        },
      },
    },
  });

  if (!shippingOrder) {
    console.warn('[GHN] Shipping order not found for code', ghnOrderCode);
    return null;
  }

  const lastEvent = await prisma.shipping_tracking_event.findFirst({
    where: { shipping_order_id: shippingOrder.id },
    orderBy: { happened_at: 'desc' },
  });

  const { internalStatus, note } = mapGhnStatus(normalized);
  const eventTime = providerTime
    ? new Date(providerTime)
    : new Date(providerPayload?.Time || providerPayload?.time || Date.now());

  if (lastEvent && lastEvent.ghn_status === normalized && lastEvent.internal_status === internalStatus) {
    await prisma.shipping_order.update({
      where: { id: shippingOrder.id },
      data: { synced_at: new Date() },
    });
    return shippingOrder;
  }

  const timelineEntry: Record<string, any> = {
    ghn_status: normalized,
    internal_status: internalStatus,
    note: providerPayload?.Description || providerPayload?.description || note,
    provider_time: eventTime.toISOString(),
    received_at: new Date().toISOString(),
  };

  const historyArray = Array.isArray(shippingOrder.status_history as Prisma.JsonArray)
    ? ([...(shippingOrder.status_history as Prisma.JsonArray)] as Prisma.JsonArray)
    : ([] as Prisma.JsonArray);
  historyArray.push(timelineEntry as Prisma.JsonValue);

  await prisma.$transaction([
    prisma.shipping_tracking_event.create({
      data: {
        shipping_order_id: shippingOrder.id,
        ghn_status: normalized,
        internal_status: internalStatus,
        note: timelineEntry.note,
        happened_at: eventTime,
      },
    }),
    prisma.shipping_order.update({
      where: { id: shippingOrder.id },
      data: {
        ghn_status: normalized,
        status_history: historyArray,
        synced_at: new Date(),
        expected_delivery_time:
          providerPayload?.ExpectedDeliveryTime || providerPayload?.leadtime
            ? new Date(providerPayload.ExpectedDeliveryTime || providerPayload.leadtime)
            : shippingOrder.expected_delivery_time,
        status: normalized === 'delivered' ? 'created' : shippingOrder.status,
      },
    }),
  ]);

  const nextFulfillment = determineFulfillmentStatus(internalStatus);
  const sellerOrderId = shippingOrder.seller_order?.id;

  if (sellerOrderId && nextFulfillment) {
    await prisma.seller_order.update({
      where: { id: sellerOrderId },
      data: { fulfillment_status: nextFulfillment },
    });
  }

  const parentOrderId = shippingOrder.seller_order?.order_id;
  if (parentOrderId && nextFulfillment) {
    await prisma.orders.update({
      where: { id: parentOrderId },
      data: { fulfillment_status: nextFulfillment },
    });
  }

  if (shouldNotifyStatus(nextFulfillment)) {
    await sendNotification({
      title: `GHN cập nhật: ${nextFulfillment}`,
      message: `Đơn ${shippingOrder.ghn_order_code} đã chuyển sang trạng thái ${nextFulfillment}`,
      level: 'info',
      metadata: {
        shippingOrderId: shippingOrder.id,
        sellerOrderId,
        ghnOrderCode: shippingOrder.ghn_order_code,
        status: nextFulfillment,
      },
    });
  }

  return shippingOrder;
}

function determineFulfillmentStatus(status: InternalStatus): InternalStatus {
  switch (status) {
    case 'ready_to_pick':
    case 'picked':
    case 'processing':
      return 'processing';
    case 'delivering':
      return 'delivering';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    case 'returned':
      return 'returned';
    case 'failed':
      return 'failed';
    default:
      return status;
  }
}

export async function syncShippingOrderFromGhn(orderCode: string) {
  const detail = await callGhnApi<any>('/v2/shipping-order/detail', {
    method: 'POST',
    body: { order_code: orderCode },
  });

  const status =
    detail?.status ||
    detail?.Status ||
    detail?.current_status ||
    detail?.data?.status ||
    detail?.result?.status;

  if (!status) {
    throw new Error('GHN detail response missing status');
  }

  await processGhnStatusUpdate({
    ghnOrderCode: orderCode,
    ghnStatus: status,
    providerPayload: detail,
    providerTime: detail?.updated_date || detail?.update_time || detail?.modify_date,
  });

  return detail;
}

export async function getShippingOrderWithEvents(shippingOrderId: string) {
  return prisma.shipping_order.findUnique({
    where: { id: shippingOrderId },
    include: {
      shipping_tracking_event: {
        orderBy: { happened_at: 'asc' },
      },
      seller_order: {
        include: {
          seller: { select: { id: true, name: true } },
          orders: { select: { id: true, fulfillment_status: true } },
        },
      },
    },
  });
}

export async function getOrderShipments(orderId: string) {
  return prisma.shipping_order.findMany({
    where: {
      seller_order: {
        order_id: orderId,
      },
    },
    include: {
      shipping_tracking_event: {
        orderBy: { happened_at: 'asc' },
      },
      seller_order: {
        select: {
          id: true,
          seller_id: true,
          fulfillment_status: true,
        },
      },
    },
  });
}
