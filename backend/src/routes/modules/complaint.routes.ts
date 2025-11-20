import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireAuthSeller } from '../../middlewares/authSeller';
import { requireAuthAdmin } from '../../middlewares/authAdmin';
import {
  addComplaintCommentController,
  adminRespondComplaintController,
  createComplaintController,
  createSellerComplaintController,
  getAdminComplaintsController,
  getSellerComplaintsController,
  getUserComplaintsController,
  sellerRespondComplaintController,
} from '../../controllers/complaint.controller';

const router = Router();

// User complaint flow
router.get('/user', requireAuth, getUserComplaintsController);
router.post('/user', requireAuth, createComplaintController);
router.post('/user/:complaintId/comments', requireAuth, addComplaintCommentController);

// Seller complaint flow
router.get('/seller', requireAuthSeller, getSellerComplaintsController);
router.post('/seller', requireAuthSeller, createSellerComplaintController);
router.post('/seller/:complaintId/respond', requireAuthSeller, sellerRespondComplaintController);

// Admin flow
router.get('/admin', requireAuthAdmin, getAdminComplaintsController);
router.post('/admin/:complaintId/respond', requireAuthAdmin, adminRespondComplaintController);

export default router;

