import { Router } from 'express';
import { listOrdersController, createOrderController, getOrdersController } from '../../controllers/order.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listOrdersController);
router.post('/', createOrderController);
router.get('/:id', getOrdersController);

export default router;
