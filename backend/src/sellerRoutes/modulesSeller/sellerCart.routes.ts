import { Router } from 'express';
import { requireAuthSeller } from '../../middlewares/authSeller';
import {
  listSellerCartController,
  addToSellerCartController,
  updateSellercart_itemController,
  removeSellercart_itemController,
} from '../../controllers/seller/cart.controller';

const router = Router();

router.get('/', requireAuthSeller, listSellerCartController);
router.post('/', requireAuthSeller, addToSellerCartController);
router.put('/:product_id', requireAuthSeller, updateSellercart_itemController);
router.delete('/:product_id', requireAuthSeller, removeSellercart_itemController);

export default router;

