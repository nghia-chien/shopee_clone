import { Router } from 'express';
import {
  capturePayPalOrderController,
  createPayPalOrderController,
} from '../../controllers/paypal.controller';

const router = Router();

router.post('/create-order', createPayPalOrderController);
router.post('/capture-order', capturePayPalOrderController);

export default router;

