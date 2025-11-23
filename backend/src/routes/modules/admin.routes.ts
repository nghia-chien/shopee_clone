import { Router } from 'express';
import { adminLoginController, adminMeController } from '../../controllers/admin/auth.controller';
import { createAdminVoucherController, listAdminVouchersController } from '../../controllers/admin/voucher.controller';
// Data Management Controllers (CRUD operations)
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
import {
  getAllProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
} from '../../controllers/admin/product.controller';
import {
  getAllCategoriesController,
  getCategoryByIdController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from '../../controllers/admin/category.controller';
import {
  getAllOrdersController,
  getOrderByIdController,
  updateOrderController,
} from '../../controllers/admin/order.controller';
import {
  getAllReviewsController,
  getReviewByIdController,
  deleteReviewController,
} from '../../controllers/admin/review.controller';
import { requireAuthAdmin } from '../../middlewares/authAdmin';

const router = Router();

/**
 * ============================================
 * 🔐 ADMIN AUTHENTICATION ROUTES
 * ============================================
 * Action Management: Custom authentication logic
 */
router.post('/login', adminLoginController);
router.get('/me', requireAuthAdmin, adminMeController);

/**
 * ============================================
 * 📊 DATA MANAGEMENT ROUTES (CRUD)
 * ============================================
 * Standard CRUD operations managed through Refine
 */

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

/**
 * 📦 Product Management Routes
 */
router.get('/products', requireAuthAdmin, getAllProductsController);
router.get('/products/:id', requireAuthAdmin, getProductByIdController);
router.put('/products/:id', requireAuthAdmin, updateProductController);
router.delete('/products/:id', requireAuthAdmin, deleteProductController);

/**
 * 📁 Category Management Routes
 */
router.get('/categories', requireAuthAdmin, getAllCategoriesController);
router.get('/categories/:id', requireAuthAdmin, getCategoryByIdController);
router.post('/categories', requireAuthAdmin, createCategoryController);
router.put('/categories/:id', requireAuthAdmin, updateCategoryController);
router.delete('/categories/:id', requireAuthAdmin, deleteCategoryController);

/**
 * 🛒 Order Management Routes
 */
router.get('/orders', requireAuthAdmin, getAllOrdersController);
router.get('/orders/:id', requireAuthAdmin, getOrderByIdController);
router.put('/orders/:id', requireAuthAdmin, updateOrderController);

/**
 * ⭐ Review Management Routes
 */
router.get('/reviews', requireAuthAdmin, getAllReviewsController);
router.get('/reviews/:id', requireAuthAdmin, getReviewByIdController);
router.delete('/reviews/:id', requireAuthAdmin, deleteReviewController);

/**
 * 🎁 Voucher Management Routes
 */
router.get('/vouchers', requireAuthAdmin, listAdminVouchersController);
router.post('/vouchers', requireAuthAdmin, createAdminVoucherController);

export default router;
