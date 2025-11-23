import { prisma } from '../utils/prisma';
import { syncShippingOrderFromGhn } from '../services/shippingStatus.service';

interface SyncOptions {
  limit?: number;
  staleMinutes?: number;
}

export async function syncPendingShippingOrders({
  limit = 25,
  staleMinutes = Number(process.env.GHN_STATUS_STALE_MINUTES || 30),
}: SyncOptions = {}) {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);

  const targets = await prisma.shipping_order.findMany({
    where: {
      ghn_order_code: { not: null },
      // Đồng bộ cho tất cả đơn GHN còn đang hoạt động (chưa kết thúc)
      status: { in: ['pending', 'created', 'retrying'] },
    },
    select: {
      id: true,
      ghn_order_code: true,
    },
    orderBy: { synced_at: 'asc' },
    take: limit,
  });

  const results: Array<{
    shippingOrderId: string;
    ghn_order_code: string;
    success: boolean;
    error?: string;
  }> = [];

  for (const target of targets) {
    if (!target.ghn_order_code) continue;
    try {
      await syncShippingOrderFromGhn(target.ghn_order_code);
      results.push({
        shippingOrderId: target.id,
        ghn_order_code: target.ghn_order_code,
        success: true,
      });
    } catch (error: any) {
      console.error('[ShippingStatusJob] Failed to sync order', target.id, error);
      results.push({
        shippingOrderId: target.id,
        ghn_order_code: target.ghn_order_code,
        success: false,
        error: error.message || 'Unknown error',
      });
    }
  }

  return {
    processed: results.length,
    success: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results,
  };
}

let shippingStatusInterval: NodeJS.Timeout | null = null;

export function setupShippingStatusSyncJob() {
  if (shippingStatusInterval) {
    return shippingStatusInterval;
  }

  // Mặc định 60s/lần để trạng thái gần realtime hơn; có thể override bằng env
  const intervalMs = Number(process.env.GHN_STATUS_SYNC_INTERVAL_MS || 60 * 1000);

  // Run one sync immediately on startup
  syncPendingShippingOrders().catch(error => {
    console.error('[ShippingStatusJob] Initial sync failed:', error);
  });

  shippingStatusInterval = setInterval(async () => {
    try {
      await syncPendingShippingOrders();
    } catch (error) {
      console.error('[ShippingStatusJob] Interval sync failed:', error);
    }
  }, intervalMs);

  console.log(`🕒 Shipping status sync job scheduled every ${intervalMs / 60000} minutes`);
  return shippingStatusInterval;
}

export function stopShippingStatusSyncJob() {
  if (shippingStatusInterval) {
    clearInterval(shippingStatusInterval);
    shippingStatusInterval = null;
  }
}
