import { Router, RequestHandler } from 'express';
import {
  createReviewController,
  getProductReviewsController,
  likeReviewController,
  updateReviewController,
  deleteReviewController,
  getReviewMediaController,
  getUserReviewsController,
} from '../../controllers/review.controller';
import { requireAuth } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';

const router = Router();

// User routes
router.post(
  '/',
  requireAuth,
  upload.array('media', 5) as unknown as RequestHandler, // Max 5 files
  createReviewController as RequestHandler
);

router.get('/user', requireAuth, getUserReviewsController);

router.get('/:reviewId/media', getReviewMediaController);

router.post('/:reviewId/like', requireAuth, likeReviewController);

router.put(
  '/:reviewId',
  requireAuth,
  upload.array('media', 5) as unknown as RequestHandler,
  updateReviewController as RequestHandler
);

router.delete('/:reviewId', requireAuth, deleteReviewController);

export default router;

