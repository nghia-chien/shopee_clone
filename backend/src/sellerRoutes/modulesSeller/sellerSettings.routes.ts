import { Router } from 'express';
import { requireAuthSeller } from '../../middlewares/authSeller';
import {
  updateSellerProfileController,
  updateSellerPaymentController,
  updateSellerShippingController,
  updateSellerPasswordController,
} from '../../controllers/seller/settings.controller';

const router = Router();

router.put('/profile', requireAuthSeller, updateSellerProfileController);
router.patch('/profile', requireAuthSeller, updateSellerProfileController);
router.put('/payment', requireAuthSeller, updateSellerPaymentController);
router.patch('/payment', requireAuthSeller, updateSellerPaymentController);
router.put('/shipping', requireAuthSeller, updateSellerShippingController);
router.patch('/shipping', requireAuthSeller, updateSellerShippingController);
router.post('/security/password', requireAuthSeller, updateSellerPasswordController);

export default router;


