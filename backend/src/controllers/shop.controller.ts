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
    const { seller_id } = req.params;
    if (!seller_id) return res.status(400).json({ message: "Seller ID không hợp lệ" });

    const products = await prisma.product.findMany({
      where: { seller_id },
      take: 100,
      include: {
        seller: {
          select: { name: true },
        },
        category: { // JOIN với bảng category
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      images: p.images,
      seller_name: p.seller?.name || "Không rõ",
      category: p.category
        ? { id: p.category.id, name: p.category.name }
        : null,
    }));

    res.json({ items: formatted });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm theo shop:", error);
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm" });
  }
};

export const getShopInfo = async (req: Request, res: Response) => {
  try {
    const { seller_id } = req.params;

    const [shop] = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM shop_summary WHERE shop_id = '${seller_id}' LIMIT 1
    `);

    if (!shop) return res.status(404).json({ message: "Không tìm thấy shop" });

    // ✅ Chuyển tất cả BigInt -> string để JSON không lỗi
    const parsedShop = JSON.parse(
      JSON.stringify(shop, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    res.json({ shop: parsedShop });
  } catch (error) {
    console.error("Lỗi lấy thông tin shop:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin shop" });
  }
};
