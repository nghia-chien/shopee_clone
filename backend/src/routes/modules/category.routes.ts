import { Router } from 'express';
import { getCategoryTree, getCategoryAttributes,getProductsByCategory,getCategories,getProductsByCategorySlug } from '../../controllers/category.controller';

const router = Router();
router.get("/", getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id/attributes', getCategoryAttributes);
router.get("/:categoryId/products", getProductsByCategory);
router.get("/slug/:slug/products", getProductsByCategorySlug);

// GET /api/categories

export default router;


