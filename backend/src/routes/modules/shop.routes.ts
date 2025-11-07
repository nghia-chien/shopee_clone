import { Router } from 'express';
import { getShopSummaries,getProductsBySeller} from '../../controllers/shop.controller';
import { requireAuth } from '../../middlewares/auth';
const router = Router();
router.get(":seller_id", getProductsBySeller); // route dùng seller_id
router.get("summary", getShopSummaries);
export default router;