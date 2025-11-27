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

    // 1) Lấy product + seller + variants
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        product_variant: true, // lấy variants
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2) Tổng số lượng đã bán
    const sold = await prisma.order_item.aggregate({
      where: {
        product_id: id,
        orders: {
          status: { in: ["paid", "completed"] },
        },
      },
      _sum: {
        quantity: true,
      },
    });
    const soldCount = sold._sum.quantity ?? 0;

    // 3) Review count + rating avg
    const reviewStats = await prisma.product_reviews.aggregate({
      where: { product_id: id },
      _count: { id: true },
      _avg: { rating: true },
    });
    const reviewCount = reviewStats._count.id;
    const ratingAvg = reviewStats._avg.rating ?? 0;

    // 4) Trả về dữ liệu cần thiết cho frontend
    res.json({
      id: product.id,
      title: product.title,
      description: product.description || "[]",
      price: Number(product.price),
      stock: product.stock,
      images: product.images || [],
      discount: Number(product.discount || 0),
      tags: product.tags || [],
      soldCount,
      reviewCount,
      ratingAvg,
      seller: product.seller,
      product_variant: product.product_variant.map(v => ({
        id: v.id,
        title: v.title,
        price: Number(v.price),
        stock: v.stock,
        image: v.image,
      })),
    });

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


export const searchHandler = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { 
      q, 
      type,
      price_min,
      price_max,
      rating,
      voucher_product,
      voucher_platform,
      voucher_saved,
      shop_type,
      sort,
      order,
    } = req.query as Record<string, string | undefined>;
    
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Query không hợp lệ" });
    }

    const query = q.toString().trim();
    if (!query) return res.status(400).json({ message: "Query không hợp lệ" });

    let products: any[] = [];
    let shops: any[] = [];

    // ===============================
    // 1) SEARCH SHOP (shop_summary)
    // ===============================
    if (type === "shop") {
      shops = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * 
        FROM shop_summary 
        WHERE shop_name ILIKE '%${query}%'
        LIMIT 50
      `);

      shops = JSON.parse(
        JSON.stringify(shops, (_, v) =>
          typeof v === "bigint" ? v.toString() : v
        )
      );

      return res.json({ products: [], shops });
    }

    // ===============================
    // 2) SEARCH PRODUCT WITH FILTERS
    // ===============================
    const where: any = {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
    };

    // Price filter
    if (price_min || price_max) {
      where.price = {};
      if (price_min) where.price.gte = Number(price_min);
      if (price_max) where.price.lte = Number(price_max);
    }

    // Rating filter
    if (rating) {
      where.rating = { gte: Number(rating) };
    }

    // Shop type filter (shop_mall)
    if (shop_type && (shop_type === 'mall' || shop_type === 'like')) {
      where.seller = {
        shop_mall: shop_type,
      };
    }

    // Voucher filters - OR logic (nếu chọn nhiều, lấy sản phẩm có ít nhất 1 trong các loại voucher)
    const now = new Date();
    if (voucher_product === "1" || voucher_platform === "1" || voucher_saved === "1") {
      const voucherConditions: any[] = [];

      if (voucher_product === "1") {
        // Sản phẩm có voucher riêng (product_id không null)
        voucherConditions.push({
          status: 'ACTIVE',
          start_at: { lte: now },
          end_at: { gte: now },
          product_id: { not: null },
        });
      }

      if (voucher_platform === "1") {
        // Sản phẩm có voucher chung (source='ADMIN')
        voucherConditions.push({
          status: 'ACTIVE',
          start_at: { lte: now },
          end_at: { gte: now },
          source: 'ADMIN',
        });
      }

      if (voucher_saved === "1" && req.user?.id) {
        // Sản phẩm có voucher shop đã lưu
        const savedVoucherIds = await prisma.user_vouchers.findMany({
          where: { user_id: req.user.id },
          select: { voucher_id: true },
        });
        const voucherIds = savedVoucherIds.map(uv => uv.voucher_id);
        if (voucherIds.length > 0) {
          voucherConditions.push({
            status: 'ACTIVE',
            start_at: { lte: now },
            end_at: { gte: now },
            id: { in: voucherIds },
          });
        }
      }

      if (voucherConditions.length === 0) {
        // Nếu không có điều kiện nào hợp lệ, trả về empty
        return res.json({ products: [], shops: [] });
      }

      // Lấy product_ids từ vouchers (OR các điều kiện)
      const allProductIds = new Set<string>();
      
      for (const condition of voucherConditions) {
        const vouchers = await prisma.vouchers.findMany({
          where: condition,
          select: { product_id: true },
        });

        vouchers.forEach(v => {
          if (v.product_id) {
            allProductIds.add(v.product_id);
          }
        });
      }

      const productIds = Array.from(allProductIds);

      if (productIds.length > 0) {
        where.id = { in: productIds };
      } else {
        // Nếu không có voucher nào match, trả về empty
        return res.json({ products: [], shops: [] });
      }
    }

    // Sort logic
    let orderBy: any = { created_at: 'desc' };
    if (sort === 'newest') {
      orderBy = { created_at: 'desc' };
    } else if (sort === 'rating_desc') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'price') {
      orderBy = { price: order === 'asc' ? 'asc' : 'desc' };
    }

    products = await prisma.product.findMany({
      where,
      include: { 
        seller: {
          select: {
            id: true,
            name: true,
            shop_mall: true,
          },
        },
      },
      orderBy,
      take: 50,
    });

    // ===============================
    // 3) SEARCH SHOP SUMMARY (FULL INFO)
    // ===============================
    shops = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * 
      FROM shop_summary 
      WHERE shop_name ILIKE '%${query}%'
      LIMIT 50
    `);

    shops = JSON.parse(
      JSON.stringify(shops, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    );

    res.json({ products, shops });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * ⚡ Flash Sale Products Controller
 * Lấy sản phẩm flash sale có voucher còn hạn, tính giá sau khi trừ voucher
 */
export async function getFlashSaleProductsController(req: Request, res: Response) {
  try {
    const { shop_status, limit = '20' } = req.query as { shop_status?: string; limit?: string };
    const now = new Date();
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    // 1. Lấy vouchers còn hạn có product_id
    const activeVouchers = await prisma.vouchers.findMany({
      where: {
        status: 'ACTIVE',
        product_id: { not: null },
        start_at: { lte: now },
        end_at: { gte: now },
      },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                shop_mall: true,
              },
            },
          },
        },
      },
    });

    // 2. Lọc theo shop_status nếu có
    let filteredVouchers = activeVouchers;
    if (shop_status && shop_status !== 'all') {
      filteredVouchers = activeVouchers.filter(
        (v) => v.product?.seller?.shop_mall === shop_status
      );
    }

    // 3. Tính giá sau khi trừ voucher và format dữ liệu
    const flashSaleProducts = filteredVouchers
      .map((voucher) => {
        if (!voucher.product) return null;

        const product = voucher.product;
        const originalPrice = Number(product.price);
        
        // Tính discount
        let discount = 0;
        if (voucher.discount_type === 'PERCENT') {
          discount = (originalPrice * Number(voucher.discount_value)) / 100;
          if (voucher.max_discount_amount) {
            discount = Math.min(discount, Number(voucher.max_discount_amount));
          }
        } else {
          discount = Number(voucher.discount_value);
        }
        discount = Math.min(discount, originalPrice);
        
        const finalPrice = Math.max(0, originalPrice - discount);
        const discountPercent = originalPrice > 0 
          ? Math.round((discount / originalPrice) * 100) 
          : 0;

        return {
          id: product.id,
          title: product.title,
          price: finalPrice,
          status : product.status,
          originalPrice: originalPrice,
          discount: discountPercent,
          images: product.images || [],
          stock: product.stock || 0,
          seller: {
            id: product.seller?.id,
            name: product.seller?.name,
            shop_mall: product.seller?.shop_mall,
          },
          voucher: {
            id: voucher.id,
            code: voucher.code,
            end_at: voucher.end_at,
          },
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .slice(0, limitNum);

    // 4. Lấy số lượng đã bán cho mỗi sản phẩm
    const productIds = flashSaleProducts.map((p) => p.id);
    const soldCounts = await Promise.all(
      productIds.map(async (productId) => {
        const sold = await prisma.order_item.aggregate({
          where: {
            product_id: productId,
            orders: {
              status: { in: ['paid', 'completed'] },
            },
          },
          _sum: {
            quantity: true,
          },
        });
        return { productId, sold: sold._sum.quantity ?? 0 };
      })
    );

    const soldMap = new Map(soldCounts.map((s) => [s.productId, s.sold]));

    // 5. Thêm thông tin sold vào products
    const productsWithSold = flashSaleProducts.map((product) => ({
      ...product,
      sold: soldMap.get(product.id) || 0,
    }));

    res.json({ products: productsWithSold, total: productsWithSold.length });
  } catch (error) {
    console.error('getFlashSaleProductsController error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

