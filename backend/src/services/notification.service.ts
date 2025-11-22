/**
 * Notification service để gửi alerts khi có lỗi GHN
 */

interface NotificationOptions {
  title: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Gửi notification (có thể mở rộng để gửi email, Slack, etc.)
 */
export async function sendNotification(options: NotificationOptions) {
  const { title, message, level, metadata } = options;

  // Log to console (có thể thay bằng email, Slack webhook, etc.)
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${title}: ${message}`;
  
  if (metadata) {
    console.log('Metadata:', JSON.stringify(metadata, null, 2));
  }

  switch (level) {
    case 'error':
      console.error(logMessage);
      break;
    case 'warning':
      console.warn(logMessage);
      break;
    case 'info':
      console.info(logMessage);
      break;
  }

  // TODO: Có thể mở rộng để gửi:
  // - Email notification
  // - Slack webhook
  // - Discord webhook
  // - SMS (nếu cần)
  // - Push notification cho admin app

  return { success: true, timestamp };
}

/**
 * Gửi alert khi GHN order creation fails
 */
export async function notifyGhnOrderFailure(params: {
  shippingOrderId: string;
  sellerOrderId: string;
  orderId: string;
  error: string;
  retryCount: number;
}) {
  return sendNotification({
    title: 'GHN Order Creation Failed',
    message: `Failed to create GHN order for shipping_order ${params.shippingOrderId} after ${params.retryCount} retries`,
    level: 'error',
    metadata: {
      shippingOrderId: params.shippingOrderId,
      sellerOrderId: params.sellerOrderId,
      orderId: params.orderId,
      error: params.error,
      retryCount: params.retryCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Gửi alert khi có nhiều failed orders
 */
export async function notifyMultipleGhnFailures(count: number) {
  return sendNotification({
    title: 'Multiple GHN Order Failures',
    message: `There are ${count} shipping orders that failed to create GHN orders`,
    level: 'warning',
    metadata: {
      failedCount: count,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Gửi alert khi GHN API connectivity issues
 */
export async function notifyGhnConnectivityIssue(error: string) {
  return sendNotification({
    title: 'GHN API Connectivity Issue',
    message: `Cannot connect to GHN API: ${error}`,
    level: 'error',
    metadata: {
      error,
      timestamp: new Date().toISOString(),
    },
  });
}

