import { Router } from 'express';
import { getCategoryTree, getCategoryAttributes,getProductsByCategory,getCategories } from '../../controllers/category.controller';

const router = Router();
router.get("/", getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id/attributes', getCategoryAttributes);
router.get("/:categoryId/products", getProductsByCategory);

// GET /api/categories

export default router;


