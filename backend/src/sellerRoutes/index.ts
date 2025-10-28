import { Router } from "express";
import sellerAuthRoutes from "./modulesSeller/sellerAuth";
import sellerProductRoutes from "./modulesSeller/sellerProduct";

const router = Router();

router.use("/auth", sellerAuthRoutes);   // <-- CHÚ Ý ĐƯỜNG NÀY
router.use("/products", sellerProductRoutes);

export default router;
