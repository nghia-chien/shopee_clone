import { Router } from 'express';
import sellerAuthRoutes from './modulesSeller/sellerAuth';
import sellerProductRoutes from './modulesSeller/sellerProduct';
import uploadSellerRoutes from './modulesSeller/uploadSeller.routes';
import sellerReviewRoutes from './modulesSeller/sellerReview.routes';
import sellerOrderRoutes from './modulesSeller/sellerOrder.routes';
import sellerAnalyticsRoutes from './modulesSeller/sellerAnalytics.routes';
import sellerSettingsRoutes from './modulesSeller/sellerSettings.routes';
import { requireAuthSeller } from "../middlewares/authSeller";
const router = Router();

router.use('/auth', sellerAuthRoutes);
router.use('/product', requireAuthSeller, sellerProductRoutes);
router.use('/upload', uploadSellerRoutes);
// ✅ Seller Orders
router.use('/order', sellerOrderRoutes);
// ✅ Seller Reviews
router.use('/', sellerReviewRoutes);
// ✅ Seller Analytics & Stats
router.use('/analytics', sellerAnalyticsRoutes);
// ✅ Seller Settings
router.use('/settings', sellerSettingsRoutes);

export default router;
