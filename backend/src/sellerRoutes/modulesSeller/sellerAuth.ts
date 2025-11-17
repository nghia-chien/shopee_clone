import { Router } from "express";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAuthSeller } from "../../middlewares/authSeller";
import {
  sellerMeController,
  sellerLoginController,
  sellerRegisterController,
  refreshSellerTokenController,
} from "../../controllers/seller/auth.controller";

const router = Router();

router.post("/register", sellerRegisterController);
  

// Login
router.post("/login", sellerLoginController);

router.post("/refresh", refreshSellerTokenController);



// ✅ Thêm route "me"
router.get("/me", requireAuthSeller, sellerMeController);

export default router;
