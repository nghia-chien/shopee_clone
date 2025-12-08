import { Request, Response } from "express";
import { SellerProductService } from "../../services/seller/product.service";

// 🟢 CREATE PRODUCT
export const createSellerProduct = async (req: Request, res: Response) => {
  try {
    const seller_id = (req as any).seller?.id;
    if (!seller_id) {
      return res.status(401).json({ error: "Unauthorized: Seller not authenticated" });
    }

    const {
      title,
      description,
      price,
      stock,
      images,
      rating,
      discount,
      tags,
      weight,
      categoryId,
      attributes,
      variants,
      status = "active" // Thêm status với giá trị mặc định
    } = req.body;

    if (!title || !categoryId || !images || images.length === 0) {
      return res.status(400).json({ 
        error: "Thiếu dữ liệu cần thiết: title, categoryId, images là bắt buộc" 
      });
    }

    // Validate description structure
    if (description && !Array.isArray(description)) {
      return res.status(400).json({ 
        error: "Description phải là mảng các block {type, content}" 
      });
    }

    // Gọi service tạo product
    const product = await SellerProductService.create(seller_id, {
      title,
      description: description || [],
      price: price || 0,
      stock: stock || 0,
      images,
      rating,
      discount,
      tags,
      weight,
      categoryId,
      attributes: attributes || {},
      variants: variants || [],
      status
    });

    res.status(201).json({ product });
  } catch (err: any) {
    console.error("CREATE PRODUCT error:", err);
    res.status(500).json({ error: err.message || "Server error createSellerProduct" });
  }
};

// 🟡 READ ALL
export const getSellerProducts = async (req: Request, res: Response) => {
  try {
    const seller_id = (req as any).seller?.id;
    if (!seller_id) {
      return res.status(401).json({ error: "Unauthorized: Seller not authenticated" });
    }

    const products = await SellerProductService.getAll(seller_id, {
      discountOnly: (req.query.discountOnly as string) ?? undefined,
      stockLt: (req.query.stockLt as string) ?? undefined,
      stockGt: (req.query.stockGt as string) ?? undefined,
      status: (req.query.status as string) ?? undefined,
      tags: (req.query.tags as string) ?? undefined,
      categoryId: (req.query.categoryId as string) ?? undefined,
      search: (req.query.search as string) ?? undefined,
    });
    res.json({ products });
  } catch (err: any) {
    console.error("READ error:", err);
    res.status(500).json({ error: err.message || "Server error getSellerProducts" });
  }
};

// 🟣 READ ONE
export const getSellerProductById = async (req: Request, res: Response) => {
  try {
    const seller_id = (req as any).seller?.id;
    if (!seller_id) {
      return res.status(401).json({ error: "Unauthorized: Seller not authenticated" });
    }

    const { id } = req.params;
    const product = await SellerProductService.getById(seller_id, id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (err: any) {
    console.error("GET ONE error:", err);
    res.status(500).json({ error: err.message || "Server error getSellerProductById" });
  }
};

// 🔵 UPDATE PRODUCT
export const updateSellerProduct = async (req: Request, res: Response) => {
  try {
    const seller_id = (req as any).seller?.id;
    if (!seller_id) {
      return res.status(401).json({ error: "Unauthorized: Seller not authenticated" });
    }

    const { id } = req.params;
    const {
      title,
      description,
      price,
      stock,
      images,
      rating,
      discount,
      tags,
      weight,
      categoryId,
      attributes,
      variants,
      status // Thêm status
    } = req.body;

    // Validate input
    if (description && !Array.isArray(description)) {
      return res.status(400).json({ 
        error: "Description phải là mảng các block {type, content}" 
      });
    }

    // Gọi service cập nhật product
    const updated = await SellerProductService.update(seller_id, id, {
      title,
      description,
      price,
      stock,
      images,
      rating,
      discount,
      tags,
      weight,
      categoryId,
      attributes,
      variants,
      status // Thêm status vào update
    });

    if (!updated) {
      return res.status(404).json({ error: "Product not found or not yours" });
    }

    res.json({ product: updated });
  } catch (err: any) {
    console.error("UPDATE PRODUCT error:", err);
    res.status(500).json({ error: err.message || "Server error updateSellerProduct" });
  }
};

// 🔴 DELETE
export const deleteSellerProduct = async (req: Request, res: Response) => {
  try {
    const seller_id = (req as any).seller?.id;
    if (!seller_id) {
      return res.status(401).json({ error: "Unauthorized: Seller not authenticated" });
    }

    const { id } = req.params;
    const deleted = await SellerProductService.remove(seller_id, id);
    if (!deleted) return res.status(404).json({ error: "Product not found or not yours" });
    res.json({ message: "Product deleted successfully" });
  } catch (err: any) {
    console.error("DELETE error:", err);
    res.status(500).json({ error: err.message || "Server error deleteSellerProduct" });
  }
};

// 🟠 UPDATE PRODUCT STATUS (Endpoint riêng cho toggle status)
export const updateProductStatus = async (req: Request, res: Response) => {
  try {
    const seller_id = (req as any).seller?.id;
    if (!seller_id) {
      return res.status(401).json({ error: "Unauthorized: Seller not authenticated" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "Status phải là 'active' hoặc 'inactive'" });
    }

    const updated = await SellerProductService.updateStatus(seller_id, id, status);

    if (!updated) {
      return res.status(404).json({ error: "Product not found or not yours" });
    }

    res.json({ product: updated });
  } catch (err: any) {
    console.error("UPDATE STATUS error:", err);
    res.status(500).json({ error: err.message || "Server error updateProductStatus" });
  }
};