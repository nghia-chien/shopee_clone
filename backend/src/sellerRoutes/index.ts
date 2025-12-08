import { Router } from 'express';
import sellerAuthRoutes from './modulesSeller/sellerAuth';
import sellerProductRoutes from './modulesSeller/sellerProduct';
import uploadSellerRoutes from './modulesSeller/uploadSeller.routes';
import sellerReviewRoutes from './modulesSeller/sellerReview.routes';
import sellerOrderRoutes from './modulesSeller/sellerOrder.routes';
import sellerAnalyticsRoutes from './modulesSeller/sellerAnalytics.routes';
import sellerSettingsRoutes from './modulesSeller/sellerSettings.routes';
import sellerVoucherRoutes from './modulesSeller/sellerVoucher.routes';
import { requireAuthSeller } from "../middlewares/authSeller";
import {
  updateSellerProfileController,
  updateSellerPaymentController,
  updateSellerShippingController,
  updateSellerPasswordController,
} from '../controllers/seller/settings.controller';
const router = Router();

router.use('/auth', sellerAuthRoutes);
router.put('/profile', requireAuthSeller, updateSellerProfileController);
router.patch('/profile', requireAuthSeller, updateSellerProfileController);
router.put('/payment', requireAuthSeller, updateSellerPaymentController);
router.patch('/payment', requireAuthSeller, updateSellerPaymentController);
router.put('/shipping', requireAuthSeller, updateSellerShippingController);
router.patch('/shipping', requireAuthSeller, updateSellerShippingController);
router.post('/security/password', requireAuthSeller, updateSellerPasswordController);
router.use('/product', requireAuthSeller, sellerProductRoutes);
router.use('/upload', uploadSellerRoutes);
router.use('/order', sellerOrderRoutes);
router.use('/', sellerReviewRoutes);
router.use('/analytics', sellerAnalyticsRoutes);
// ✅ Seller Settings
router.use('/settings', sellerSettingsRoutes);
router.use('/voucher', requireAuthSeller, sellerVoucherRoutes);

export default router;

