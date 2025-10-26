import { Router } from 'express';
import { listOrdersController, createOrderController, getOrderController } from '../../controllers/order.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listOrdersController);
router.post('/', createOrderController);
router.get('/:id', getOrderController);

export default router;
