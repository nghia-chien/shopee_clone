import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export async function listProductsController(_req: Request, res: Response) {
  try {
    const {
      q,
      category_id,
      minPrice,
      maxPrice,
      tags,
      sort = 'newest', // newest | price_asc | price_desc | rating_desc
      page = '1',
      pageSize = '20',
    } = _req.query as Record<string, string>;

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ];
    }
    if (category_id) where.category_id = category_id;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length) {
        where.tags = { hasSome: tagList };
      }
    }

    let orderBy: any = { created_at: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'rating_desc') orderBy = { rating: 'desc' };

    const take = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * take;

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take }),
      prisma.product.count({ where }),
    ]);

    return res.json({ items, total, page: pageNum, pageSize: take });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export const getProductController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
          },
        },
      },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(product);
  } catch (err) {
    console.error("getProductController error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📝 Minimal review endpoint: update rating average and reviews_count
export const addProductReviewController = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { id } = req.params; // product id
    const { rating } = req.body as { rating: number };

    const score = Number(rating);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const currentRating = product.rating ?? 0;
    const currentCount = product.reviews_count ?? 0;
    const newCount = (currentCount || 0) + 1;
    const newRating = ((currentRating || 0) * (currentCount || 0) + score) / newCount;

    const updated = await prisma.product.update({
      where: { id },
      data: { rating: newRating, reviews_count: newCount },
      select: { id: true, rating: true, reviews_count: true },
    });

    return res.json({ review: { rating: score }, product: updated });
  } catch (err) {
    console.error('addProductReviewController error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 📨 Minimal feedback/complaint endpoint: store in product.attributes JSON
export const addProductFeedbackController = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { id } = req.params; // product id
    const { message, type } = req.body as { message: string; type?: 'feedback' | 'complaint' };

    const text = (message || '').trim();
    if (!text) return res.status(400).json({ message: 'Message is required' });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const now = new Date().toISOString();
    const attrs = (product.attributes as any) || {};
    const list = Array.isArray(attrs.feedback) ? attrs.feedback : [];
    list.push({ user_id: req.user?.id || null, type: type || 'feedback', message: text, created_at: now });

    const updated = await prisma.product.update({
      where: { id },
      data: { attributes: { ...(attrs || {}), feedback: list } },
      select: { id: true, attributes: true },
    });

    return res.json({ feedback: { message: text, type: type || 'feedback' }, product: updated });
  } catch (err) {
    console.error('addProductFeedbackController error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



export const searchKeywords = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Query không hợp lệ" });
    }

    // Lấy sản phẩm + seller có tên chứa query
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { seller: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { seller: true },
      take: 50,
    });

    // map ra keywords và loại trùng
    const keywordSet = new Set<string>();
    products.forEach(p => {
      if (p.title.toLowerCase().includes(q.toLowerCase())) keywordSet.add(p.title);
      if (p.seller?.name.toLowerCase().includes(q.toLowerCase())) keywordSet.add(p.seller.name);
    });

    res.json({ items: Array.from(keywordSet).slice(0, 10) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};


export const searchHandler = async (req: Request, res: Response) => {
  try {
    const { q, type } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Query không hợp lệ" });
    }

    const query = (req.query.q || req.query.query || "").toString().trim();
if (!query) return res.status(400).json({ message: "Query không hợp lệ" });

    let products: any[] = [];
    let shops: any[] = [];

    // Nếu type === 'shop', chỉ tìm shop
    if (type === 'shop') {
      shops = await prisma.seller.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 50,
      });
    } else {
      // Tìm cả product và shop
      products = await prisma.product.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { seller: true },
        take: 50,
      });

      shops = await prisma.seller.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        take: 50,
      });
    }

    res.json({ products, shops });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
