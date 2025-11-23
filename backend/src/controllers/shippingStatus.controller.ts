import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import {
  processGhnStatusUpdate,
  syncShippingOrderFromGhn,
  getShippingOrderWithEvents,
} from '../services/shippingStatus.service';

function getRequestIp(req: Request) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
}

export async function ghnWebhookController(req: Request, res: Response) {
  try {
    const ghnOrderCode =
      req.body?.OrderCode || req.body?.order_code || req.body?.orderCode || req.body?.ClientOrderCode;
    const ghnStatus = req.body?.Status || req.body?.status;

    if (!ghnOrderCode || !ghnStatus) {
      return res.status(400).json({ error: 'Missing OrderCode or Status in GHN payload' });
    }

    console.log('[GHN Webhook] Received:', {
      orderCode: ghnOrderCode,
      status: ghnStatus,
      ip: getRequestIp(req),
    });

    await processGhnStatusUpdate({
      ghnOrderCode,
      ghnStatus,
      providerPayload: req.body,
      providerTime: req.body?.Time || req.body?.time,
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('[GHN Webhook] Error processing payload:', error);
    return res.status(500).json({ error: error.message || 'Failed to process GHN webhook' });
  }
}

export async function syncShippingOrderController(req: Request, res: Response) {
  const { shippingOrderId } = req.params;

  try {
    const shippingOrder = await prisma.shipping_order.findUnique({
      where: { id: shippingOrderId },
      select: {
        id: true,
        ghn_order_code: true,
      },
    });

    if (!shippingOrder || !shippingOrder.ghn_order_code) {
      return res.status(404).json({ error: 'Shipping order not found or missing GHN order code' });
    }

    const detail = await syncShippingOrderFromGhn(shippingOrder.ghn_order_code);

    return res.json({
      success: true,
      shippingOrderId: shippingOrderId,
      ghn_order_code: shippingOrder.ghn_order_code,
      detail,
    });
  } catch (error: any) {
    console.error('[Shipping Sync] Failed to sync shipping order:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync shipping order' });
  }
}

export async function getShippingOrderTrackingController(req: Request, res: Response) {
  const { shippingOrderId } = req.params;

  try {
    const order = await getShippingOrderWithEvents(shippingOrderId);

    if (!order) {
      return res.status(404).json({ error: 'Shipping order not found' });
    }

    return res.json({ shippingOrder: order });
  } catch (error: any) {
    console.error('[Shipping Tracking] Failed to load tracking info:', error);
    return res.status(500).json({ error: error.message || 'Failed to load tracking info' });
  }
}
