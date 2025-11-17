import { Router } from 'express';
import {
  getSellerReviewsController,
  replyReviewController,
} from '../../controllers/review.controller';
import { requireAuthSeller } from '../../middlewares/authSeller';

const router = Router();

router.use(requireAuthSeller);

// GET /api/seller/reviews?product_id=xxx
router.get('/reviews', getSellerReviewsController);

// POST /api/seller/reviews/:id/reply
router.post('/reviews/:reviewId/reply', replyReviewController);

export default router;

