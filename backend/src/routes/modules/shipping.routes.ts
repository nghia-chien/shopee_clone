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
import {
  ghnWebhookController,
  syncShippingOrderController,
  getShippingOrderTrackingController,
} from '../../controllers/shippingStatus.controller';

const router = Router();

router.get('/provinces', getProvinces);
router.get('/districts/:province_id', getDistricts);
router.get('/wards/:district_id', getWards);
router.post('/fee', calculateShippingFee);
router.post('/create-order', createShippingOrder);
router.post('/cancel-order', cancelShippingOrder);

// GHN status sync
router.post('/ghn/webhook', ghnWebhookController);
router.post('/orders/:shippingOrderId/sync', syncShippingOrderController);
router.get('/orders/:shippingOrderId/tracking', getShippingOrderTrackingController);

// Retry endpoints
router.post('/retry/:shippingOrderId', retryShippingOrderController);
router.post('/retry-all', retryAllFailedShippingOrdersController);
router.get('/orders', getShippingOrdersController);

export default router;

