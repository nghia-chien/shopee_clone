import { Router } from 'express';
import { createSellerVoucherController, listSellerVouchersController } from '../../controllers/seller/voucher.controller';

const router = Router();

router.get('/', listSellerVouchersController);
router.post('/', createSellerVoucherController);

export default router;

