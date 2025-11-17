import { Router } from 'express';
import { getShopSummaries,getProductsBySeller,getShopInfo,getMallShops} from '../../controllers/shop.controller';
import { requireAuth } from '../../middlewares/auth';


const router = Router();
// Lấy tất cả shop tóm tắt
router.get("/summary", getShopSummaries);
router.get("/mall", getMallShops);
router.get("/:seller_id", getShopInfo);
router.get("/:seller_id/products", getProductsBySeller);

export default router;