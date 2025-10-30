import { Router } from 'express';
import { listProductsController, getProductController, getProductById } from '../../controllers/product.controller';

const router = Router();

router.get('/', listProductsController);
router.get('/:id', getProductController);
router.get("/:id", getProductById);
export default router;
