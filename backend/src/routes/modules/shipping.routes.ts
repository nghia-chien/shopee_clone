import { Router } from 'express';
import {
  calculateShippingFee,
  cancelShippingOrder,
  createShippingOrder,
  getDistricts,
  getProvinces,
  getWards,
  retryShippingOrderController,
  retryAllFailedShippingOrdersController,
  getShippingOrdersController,
} from '../../controllers/shipping.controller';

const router = Router();

router.get('/provinces', getProvinces);
router.get('/districts/:province_id', getDistricts);
router.get('/wards/:district_id', getWards);
router.post('/fee', calculateShippingFee);
router.post('/create-order', createShippingOrder);
router.post('/cancel-order', cancelShippingOrder);

// Retry endpoints
router.post('/retry/:shippingOrderId', retryShippingOrderController);
router.post('/retry-all', retryAllFailedShippingOrdersController);
router.get('/orders', getShippingOrdersController);

export default router;

