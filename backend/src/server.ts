import 'dotenv/config'; // Ensure dotenv is loaded
import app from "./app"; // <-- dùng app.ts, KHÔNG tạo app mới
import { setupShippingStatusSyncJob } from './jobs/shippingStatus.job';

const PORT = process.env.PORT || 4000;

// Log environment variables on startup để debug
console.log('🔍 Environment variables check on startup:');
console.log('  SHIP_FROM_PHONE:', process.env.SHIP_FROM_PHONE ? `${process.env.SHIP_FROM_PHONE.substring(0, 3)}***` : '❌ NOT SET');
console.log('  SHIP_FROM_NAME:', process.env.SHIP_FROM_NAME || '❌ NOT SET');
console.log('  GHN_TOKEN:', process.env.GHN_TOKEN ? '✅ SET' : '❌ NOT SET');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Optional: Setup background job để tự động retry failed shipping orders
  // Uncomment dòng sau để enable:
  // import { setupShippingRetryCron } from './jobs/shippingRetry.job';
  // setupShippingRetryCron();

  // Bật cron đồng bộ trạng thái GHN → DB
  setupShippingStatusSyncJob();
});

// Handle EADDRINUSE gracefully
server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    console.error(err);
  }
});

// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

// Catch uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
