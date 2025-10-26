import { Router } from 'express';
import { listCartItemsController, addToCartController, updateCartItemController, removeCartItemController } from '../../controllers/cart.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listCartItemsController);
router.post('/items', addToCartController);
router.put('/items/:productId', updateCartItemController);
router.delete('/items/:productId', removeCartItemController);

export default router;
