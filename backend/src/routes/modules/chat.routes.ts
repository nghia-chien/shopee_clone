import { Router } from 'express';
import {
  getThreadsByUserController,
  getThreadsBySellerController,
  createThreadController,
  sendUserMessageController,
  sendSellerMessageController,
  getMessagesController,
  getSellerMessagesController,
  sendSystemMessageController,
} from '../../controllers/chat.controller';
import { requireAuth } from '../../middlewares/auth';
import { requireAuthSeller } from '../../middlewares/authSeller';

const router = Router();

// User routes
router.get('/threads/user', requireAuth, getThreadsByUserController);
router.post('/threads', requireAuth, createThreadController);

// Seller routes
router.get('/threads/seller', requireAuthSeller, getThreadsBySellerController);

// Message routes (both user and seller can send)
router.post('/message', requireAuth, sendUserMessageController); // For USER
router.post('/message/seller', requireAuthSeller, sendSellerMessageController); // For SELLER

// Get messages (both user and seller can access)
router.get('/messages/:threadId', requireAuth, getMessagesController); // User can access
router.get('/messages/:threadId/seller', requireAuthSeller, getSellerMessagesController); // Seller can access

// System message (only seller can trigger)
router.post('/system-message', requireAuthSeller, sendSystemMessageController);

export default router;

