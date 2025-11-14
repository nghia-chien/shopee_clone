import { Router } from 'express';
import { requireAuthSeller } from '../../middlewares/authSeller';
import {
  getSellerStatsController,
  getSellerAnalyticsController,
  exportSellerAnalyticsController,
  sendSellerAnalyticsEmailController,
} from '../../controllers/seller/analytics.controller';

const router = Router();

router.get('/stats', requireAuthSeller, getSellerStatsController);
router.get('/analytics', requireAuthSeller, getSellerAnalyticsController);
router.get('/export', requireAuthSeller, exportSellerAnalyticsController);
router.post('/email-report', requireAuthSeller, sendSellerAnalyticsEmailController);

export default router;

