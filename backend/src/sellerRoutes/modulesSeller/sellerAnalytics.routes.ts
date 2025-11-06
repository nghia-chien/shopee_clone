import { Router } from 'express';
import { requireAuthSeller } from '../../middlewares/authSeller';
import {
  getSellerStatsController,
  getSellerAnalyticsController,
} from '../../controllers/seller/analytics.controller';

const router = Router();

router.get('/stats', requireAuthSeller, getSellerStatsController);
router.get('/analytics', requireAuthSeller, getSellerAnalyticsController);

export default router;

