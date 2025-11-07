import { Router } from "express";
import { requireAuthSeller } from "../../middlewares/authSeller";
import {
  createSellerProduct,
  getSellerProducts,
  getSellerProductById,
  updateSellerProduct,
  deleteSellerProduct,
} from '../../controllers/seller/productSeller.controller';

const router = Router();

// CRUD routes
router.post("/", requireAuthSeller, createSellerProduct); // Create
router.get("/", requireAuthSeller, getSellerProducts); // Read all
router.get("/:id", requireAuthSeller, getSellerProductById); // Read one
router.put("/:id", requireAuthSeller, updateSellerProduct); // Update
router.delete("/:id", requireAuthSeller, deleteSellerProduct); // Delete

export default router;
