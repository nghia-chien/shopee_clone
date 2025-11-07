import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';


export const getShopSummaries = async (req: Request, res: Response) => {
  try {
    const shops = await prisma.$queryRawUnsafe(`
      SELECT * FROM shop_summary
    `);
    res.json(shops);
  } catch (error) {
    console.error("Error fetching shop summaries:", error);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu shop" });
  }
};
export const getProductsBySeller = async (req: Request, res: Response) => {
  try {
    const { seller_id } = req.params;  // dùng seller_id
    if (!seller_id) return res.status(400).json({ message: "Seller ID không hợp lệ" });

    const products = await prisma.product.findMany({
      where: { seller_id },  // dùng seller_id
      take: 50,
    });

    res.json({ items: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
