import { prisma } from "../../utils/prisma";


export const SellerProductService = {
  async create(seller_id: string, data: any) {
    try {
      const { title, description, price, stock, images,rating,discount, tags, weight, dimensions, categoryId, attributes } = data;

      if (!title || !price || !stock)
        throw new Error("Thiếu dữ liệu cần thiết");
      const cleanImages = Array.isArray(images)
        ? images.flat() // gộp mảng lồng nhau thành 1 mảng phẳng
        : [images];
      const product = await prisma.product.create({
        data: {
          title,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          images: cleanImages,
          tags: tags ? tags.split(",").map((tag: string) => tag.trim()) : [],
          discount: parseFloat(discount),
          rating: parseFloat(rating),
          weight,
          dimensions,
          category_id: categoryId ?? null,
          attributes: attributes ?? undefined,
          seller_id,
         
        },
      });
      
      return product;
    } catch (err) {
      console.error("Service createSellerProduct error:", err);
      
      throw err;
    }
  },



  // 🟡 READ ALL
  async getAll(
    seller_id: string,
    filters?: {
      discountOnly?: string | boolean;
      stockLt?: string | number;
      stockGt?: string | number;
      status?: string;
      tags?: string;
      categoryId?: string;
      search?: string;
    }
  ) {
    const where: any = { seller_id };
    if (filters) {
      const {
        discountOnly,
        stockLt,
        stockGt,
        status,
        tags,
        categoryId,
        search,
      } = filters;

      // discount > 0
      if (
        typeof discountOnly !== 'undefined' &&
        (discountOnly === true || discountOnly === 'true')
      ) {
        where.discount = { gt: 0 };
      }

      // stock thresholds
      if (typeof stockLt !== 'undefined' && stockLt !== null && stockLt !== '') {
        where.stock = { ...(where.stock || {}), lt: Number(stockLt) };
      }
      if (typeof stockGt !== 'undefined' && stockGt !== null && stockGt !== '') {
        where.stock = { ...(where.stock || {}), gt: Number(stockGt) };
      }

      // status
      if (status) {
        where.status = status;
      }

      // tags contains any of provided list
      if (tags) {
        const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
        if (tagList.length) {
          where.tags = { hasSome: tagList };
        }
      }

      // category
      if (categoryId) {
        where.category_id = categoryId;
      }

      // search in title or description
      if (search) {
        where.AND = [
          where.AND,
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          },
        ].filter(Boolean);
      }
    }

    return prisma.product.findMany({ where, orderBy: { created_at: 'desc' } });
  },

  // 🟣 READ ONE
  async getById(seller_id: string, id: string) {
    return prisma.product.findFirst({ where: { id, seller_id } });
  },

  // 🔵 UPDATE
  async update(seller_id: string, id: string, data: any) {
    const existing = await prisma.product.findFirst({ where: { id, seller_id } });
    if (!existing) return null;

    return prisma.product.update({
      where: { id },
      data,
    });
  },

  // 🔴 DELETE
  async remove(seller_id: string, id: string) {
    const existing = await prisma.product.findFirst({ where: { id, seller_id } });
    if (!existing) return null;

    await prisma.product.delete({ where: { id } });
    return true;
  },
};
