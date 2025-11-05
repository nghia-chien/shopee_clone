import { Router } from 'express';
import { getCategoryTree, getCategoryAttributes } from '../controllers/category.controller';

const router = Router();

router.get('/tree', getCategoryTree);
router.get('/:id/attributes', getCategoryAttributes);

export default router;


