import { Router } from 'express';
import { getShopSettingsController, updateShopSettingsController } from '../../controllers/shopSettings.controller';
import { requireAuthAdmin } from '../../middlewares/authAdmin';

const router = Router();

// Lấy shop settings (public để frontend có thể load)
router.get('/', getShopSettingsController);

// Cập nhật shop settings (cần admin auth)
router.put('/', requireAuthAdmin, updateShopSettingsController);

export default router;

