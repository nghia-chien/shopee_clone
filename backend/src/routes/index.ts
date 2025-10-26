import { Router } from 'express';
import authRouter from './modules/auth.routes';
import productRouter from './modules/product.routes';
import cartRouter from './modules/cart.routes';
import orderRouter from './modules/order.routes';

const router = Router();

/**
 * 🧭 API Routing
 * Mỗi module được tách riêng trong thư mục /modules
 */
router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);

// ✅ Route mặc định (test API)
router.get('/', (_req, res) => {
  res.json({
    message: 'API is running 🚀',
    endpoints: ['/auth', '/products', '/cart', '/orders'],
  });
});

export default router;
