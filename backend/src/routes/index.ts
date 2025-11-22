import { Router } from 'express';
import authRouter from './modules/auth.routes';
import productRouter from './modules/product.routes';
import cartRouter from './modules/cart.routes';
import orderRouter from './modules/order.routes';
import sellerRoutes from '../sellerRoutes/index';
import categoryRoutes from './modules/category.routes';
import shopRoutes from './modules/shop.routes';
import adminRouter from './modules/admin.routes';
import voucherRouter from './modules/voucher.routes';
import paypalRouter from './modules/paypal.routes';
import chatRouter from './modules/chat.routes';
import reviewRouter from './modules/review.routes';
import accountRouter from './modules/account.routes';
import shippingRouter from './modules/shipping.routes';
import shopSettingsRouter from './modules/shopSettings.routes';
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
router.use('/vouchers', voucherRouter);
router.use('/paypal', paypalRouter);
router.use('/chat', chatRouter);
router.use('/reviews', reviewRouter);
router.use('/shipping', shippingRouter);
router.use('/account', accountRouter);
router.use('/shop-settings', shopSettingsRouter);
// ✅ Route mặc định (test API)
router.get('/', (_req, res) => {
  res.json({
    message: 'API is running 🚀',
    endpoints: [
      '/auth',
      '/products',
      '/cart',
      '/orders',
      '/seller',
      '/categories',
      '/shops',
      '/chat',
      '/reviews',
      '/shipping',
      '/account',
      '/admin',
      '/vouchers',
      '/paypal',
    ],
  });
});

export default router;
