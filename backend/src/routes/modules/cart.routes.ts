import { Router } from 'express';
import { listcart_itemsController, addToCartController, updatecart_itemController, removecart_itemController, getCartCountController} from '../../controllers/cart.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.use(requireAuth);
router.get('/', listcart_itemsController);
router.post('/items', addToCartController);
router.put('/items/:product_id', updatecart_itemController);
router.delete('/items/:product_id', removecart_itemController);
router.get('/count', getCartCountController);


export default router;
