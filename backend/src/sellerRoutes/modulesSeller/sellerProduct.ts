import { Router, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { RequestHandler } from "express-serve-static-core";
import { prisma } from "../../utils/prisma";
import { authSeller } from "../../middlewares/authSeller";
import { bucket } from "../../firebase";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", authSeller, upload.single("file") as unknown as RequestHandler, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filename = `products/${uuidv4()}_${req.file.originalname}`;
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: true,
    });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;
    res.json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Tạo sản phẩm mới
router.post("/", authSeller, async (req, res) => {
  try {
    const sellerId = (req as any).sellerId;
    const { title, description, price, stock, images, tags, weight, dimensions } = req.body;

    if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        images,
        tags,
        weight,
        dimensions,
        sellerId,
      },
    });

    res.json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Lấy tất cả sản phẩm của seller
router.get("/", authSeller, async (req, res) => {
  try {
    const sellerId = (req as any).sellerId;
    if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

    const products = await prisma.product.findMany({ where: { sellerId } });
    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
