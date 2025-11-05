import { Router } from 'express';
import { requireAuthSeller } from '../../middlewares/authSeller';
import {
  listSellerCartController,
  addToSellerCartController,
  updateSellerCartItemController,
  removeSellerCartItemController,
} from '../../controllers/seller/cart.controller';

const router = Router();

router.get('/', requireAuthSeller, listSellerCartController);
router.post('/', requireAuthSeller, addToSellerCartController);
router.put('/:productId', requireAuthSeller, updateSellerCartItemController);
router.delete('/:productId', requireAuthSeller, removeSellerCartItemController);

export default router;

