import { prisma } from "../../utils/prisma";


export const SellerProductService = {
  async create(seller_id: string, data: any) {
    try {
      const { title, description, price, stock, images, tags, weight, dimensions, categoryId, attributes } = data;

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
          tags,
          weight,
          dimensions,
          categoryId: categoryId ?? null,
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
  async getAll(seller_id: string) {
    return prisma.product.findMany({ where: { seller_id } });
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
