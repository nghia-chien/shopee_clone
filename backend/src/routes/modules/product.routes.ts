import { Router } from 'express';
import { 
    listProductsController, 
    getProductController, 
    addProductReviewController, 
    addProductFeedbackController, 
    searchKeywords ,
    searchHandler} from '../../controllers/product.controller';
import { getProductReviewsController } from '../../controllers/review.controller';
import { requireAuth } from '../../middlewares/auth';

const router = Router();

router.get('/', listProductsController);
router.get('/keywords', searchKeywords);
router.get('/search', searchHandler);
router.get('/:id', getProductController);
router.get('/:id/reviews', getProductReviewsController); // Get reviews for product
router.post('/:id/reviews', requireAuth, addProductReviewController);
router.post('/:id/feedback', requireAuth, addProductFeedbackController);

export default router;
