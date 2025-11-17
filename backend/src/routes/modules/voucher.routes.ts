import { Router } from 'express';
import { listPublicVouchersController, listUserVouchersController, saveVoucherController } from '../../controllers/voucher.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.get('/public', listPublicVouchersController);
router.get('/me', requireAuth, listUserVouchersController);
router.post('/:voucherId/save', requireAuth, saveVoucherController);

export default router;

