import { Router } from 'express';
import sellerAuthRoutes from './modulesSeller/sellerAuth';
import sellerProductRoutes from './modulesSeller/sellerProduct';
import uploadSellerRoutes from './modulesSeller/uploadSeller.routes';
import { requireAuthSeller } from "../middlewares/authSeller";
const router = Router();

router.use('/auth', sellerAuthRoutes);
router.use('/product', requireAuthSeller,sellerProductRoutes);
router.use('/upload',uploadSellerRoutes);

export default router;
