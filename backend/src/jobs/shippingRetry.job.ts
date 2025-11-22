// /**
//  * Scheduled job để tự động retry failed shipping orders
//  * Có thể chạy bằng cron hoặc node-cron
//  */

// import { retryAllFailedShippingOrders } from '../services/shippingRetry.service';

// /**
//  * Chạy retry job cho tất cả failed shipping orders
//  */
// export async function runShippingRetryJob() {
//   console.log('[Shipping Retry Job] Starting...');
  
//   try {
//     const result = await retryAllFailedShippingOrders(3);
    
//     console.log(`[Shipping Retry Job] Completed. Processed ${result.total} orders.`);
//     console.log(`[Shipping Retry Job] Results:`, {
//       successful: result.results.filter(r => r.success).length,
//       failed: result.results.filter(r => !r.success).length,
//     });

//     return result;
//   } catch (error: any) {
//     console.error('[Shipping Retry Job] Error:', error);
//     throw error;
//   }
// }

// /**
//  * Setup cron job (nếu dùng node-cron)
//  * Chạy mỗi 30 phút
//  */
// export function setupShippingRetryCron() {
//   // Uncomment nếu muốn dùng node-cron
//   /*
//   const cron = require('node-cron');
  
//   // Chạy mỗi 30 phút
//   cron.schedule('*/30 * * * *', async () => {
//     await runShippingRetryJob();
//   });
  
//   console.log('[Shipping Retry Job] Cron job scheduled to run every 30 minutes');
//   */
  
//   // Hoặc có thể dùng setInterval cho đơn giản
//   const interval = setInterval(async () => {
//     await runShippingRetryJob();
//   }, 30 * 60 * 1000); // 30 phút

//   console.log('[Shipping Retry Job] Interval job scheduled to run every 30 minutes');
  
//   return interval;
// }

