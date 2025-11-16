import { Router } from 'express';
import authRouter from './modules/auth.routes';
import productRouter from './modules/product.routes';
import cartRouter from './modules/cart.routes';
import orderRouter from './modules/order.routes';
import sellerRoutes from '../sellerRoutes/index';
import categoryRoutes from './modules/category.routes';
import shopRoutes from './modules/shop.routes';
import adminRouter from './modules/admin.routes';

const router = Router();

/**
 * 🧭 API Routing
 * Mỗi module được tách riêng trong thư mục /modules
 */
router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/seller', sellerRoutes); 
router.use('/categories', categoryRoutes);
router.use('/shops', shopRoutes);
router.use('/admin', adminRouter);
// ✅ Route mặc định (test API)
router.get('/', (_req, res) => {
  res.json({
    message: 'API is running 🚀',
    endpoints: ['/auth', '/products', '/cart', '/orders', '/seller', '/categories','/shops', '/admin'],
  });
});

export default router;
