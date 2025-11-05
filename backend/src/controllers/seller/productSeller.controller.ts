import { Request, Response } from "express";
import { SellerProductService } from "../../services/seller/product.service";

// 🟢 CREATE
export const createSellerProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).seller?.id;
    if (!sellerId)
      return res.status(401).json({ error: "Unauthorized create seller/productseller.controller.ts" });


    const product = await SellerProductService.create(sellerId, req.body);
    res.status(201).json({ product });
  } catch (err) {
    console.error("CREATE error details:", err);
    res.status(500).json({ error: "Server error create SellerProduct seller/productSeller.controller.ts" });
  }
};

// 🟡 READ ALL
export const getSellerProducts = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).seller?.id;
    const products = await SellerProductService.getAll(sellerId);
    res.json({ products });
  } catch (err) {
    console.error("READ error:", err);
    res.status(500).json({ error: "Server error getSellerProducts seller/productSeller.controller.ts" });
  }
};

// 🟣 READ ONE
export const getSellerProductById = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).seller?.id;
    const { id } = req.params;
    const product = await SellerProductService.getById(sellerId, id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (err) {
    console.error("GET ONE error:", err);
    res.status(500).json({ error: "Server error seller/productSeller.controller.ts" });
  }
};

// 🔵 UPDATE
export const updateSellerProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).seller?.id;
    const { id } = req.params;
    const updated = await SellerProductService.update(sellerId, id, req.body);
    if (!updated) return res.status(404).json({ error: "Product not found or not yours" });
    res.json({ product: updated });
  } catch (err) {
    console.error("UPDATE error:", err);
    res.status(500).json({ error: "Server error updateSellerProduct seller/productSeller.controller.ts" });
  }
};

// 🔴 DELETE
export const deleteSellerProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).seller?.id;
    const { id } = req.params;
    const deleted = await SellerProductService.remove(sellerId, id);
    if (!deleted) return res.status(404).json({ error: "Product not found or not yours" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("DELETE error:", err);
    res.status(500).json({ error: "Server error deleteSellerProduct seller/productSeller.controller.ts" });
  }
};
