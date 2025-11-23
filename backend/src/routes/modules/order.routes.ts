import { Router } from 'express';
import { listOrdersController, createOrderController, getOrdersController, preValidateOrderController } from '../../controllers/order.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.use(requireAuth);
router.get('/orders', requireAuth, listOrdersController);
// Pre-validate endpoint - phải đứng trước '/' để tránh conflict
router.post('/pre-validate', preValidateOrderController);
router.post('/', createOrderController);
// Route này phải đứng trước /:id để tránh conflict
router.get('/all', getOrdersController); // Lấy tất cả orders với đầy đủ thông tin
router.get('/:id', getOrdersController);

export default router;
