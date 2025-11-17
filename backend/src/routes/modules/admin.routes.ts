import { Router } from 'express';
import { adminLoginController, adminMeController } from '../../controllers/admin/auth.controller';
import {
  getAllUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  deleteUserController,
} from '../../controllers/admin/user.controller';
import {
  getAllSellersController,
  getSellerByIdController,
  createSellerController,
  updateSellerController,
  deleteSellerController,
} from '../../controllers/admin/seller.controller';
import { requireAuthAdmin } from '../../middlewares/authAdmin';

const router = Router();

/**
 * 🔐 Admin Authentication Routes
 */
router.post('/login', adminLoginController);
router.get('/me', requireAuthAdmin, adminMeController);

/**
 * 👥 User Management Routes
 */
router.get('/users', requireAuthAdmin, getAllUsersController);
router.get('/users/:id', requireAuthAdmin, getUserByIdController);
router.post('/users', requireAuthAdmin, createUserController);
router.put('/users/:id', requireAuthAdmin, updateUserController);
router.delete('/users/:id', requireAuthAdmin, deleteUserController);

/**
 * 🏪 Seller Management Routes
 */
router.get('/sellers', requireAuthAdmin, getAllSellersController);
router.get('/sellers/:id', requireAuthAdmin, getSellerByIdController);
router.post('/sellers', requireAuthAdmin, createSellerController);
router.put('/sellers/:id', requireAuthAdmin, updateSellerController);
router.delete('/sellers/:id', requireAuthAdmin, deleteSellerController);

export default router;

