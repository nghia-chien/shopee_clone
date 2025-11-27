import { prisma } from "../../utils/prisma";

export const SellerProductService = {
  // 🟢 CREATE
  async create(seller_id: string, data: any) {
    const {
      title,
      description = [],
      price,
      stock,
      images,
      rating,
      discount,
      tags,
      weight,
      dimensions,
      categoryId,
      attributes = {},
      variants = [],
      status = "active", // Thêm status
    } = data;

    if (!title || !categoryId || !images || images.length === 0) {
      throw new Error("Thiếu dữ liệu cần thiết: title, categoryId, images là bắt buộc");
    }

    // Validate description structure
    if (description && !Array.isArray(description)) {
      throw new Error("Description phải là mảng các block {type, content}");
    }

    const cleanImages = Array.isArray(images) ? images.flat() : [images];

    // Tạo product chính
    const product = await prisma.product.create({
      data: {
        title,
        description: JSON.stringify(description), // lưu json block
        price: price ? parseFloat(price) : (variants[0]?.price || 0),
        stock: stock ? parseInt(stock) : (variants[0]?.stock || 0),
        images: cleanImages,
        tags: tags ? (typeof tags === 'string' ? tags.split(",").map((t: string) => t.trim()) : tags) : [],
        discount: discount ? parseFloat(discount) : 0,
        rating: rating ? parseFloat(rating) : 0,
        weight,
        dimensions,
        category_id: categoryId,
        attributes: attributes,
        seller_id,
        status, // Thêm status
      },
    });

    // Tạo variants nếu có
    if (variants.length > 0) {
      const variantData = variants.map((v: any) => ({
        product_id: product.id,
        title: v.title || "",
        price: v.price ? parseFloat(v.price) : 0,
        stock: v.stock ? parseInt(v.stock) : 0,
        image: v.image || "",
      }));
      await prisma.product_variant.createMany({ data: variantData });
    }

    return this.getById(seller_id, product.id); // Trả về product đầy đủ với variants
  },

  // 🟡 READ ALL
  async getAll(seller_id: string, filters?: any) {
    const where: any = { seller_id };

    // Áp dụng filters nếu có
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        where.status = filters.status;
      }
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      if (filters.categoryId) {
        where.category_id = filters.categoryId;
      }
      if (filters.tags) {
        where.tags = { has: filters.tags };
      }
      if (filters.stockLt) {
        where.stock = { ...where.stock, lt: parseInt(filters.stockLt) };
      }
      if (filters.stockGt) {
        where.stock = { ...where.stock, gt: parseInt(filters.stockGt) };
      }
      if (filters.discountOnly === 'true') {
        where.discount = { gt: 0 };
      }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: { product_variant: true },
    });

    // Parse description từ JSON string thành array
    return products.map(product => ({
      ...product,
      description: product.description ? JSON.parse(product.description) : []
    }));
  },

  // 🟣 READ ONE
  async getById(seller_id: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, seller_id },
      include: { product_variant: true },
    });

    if (!product) return null;

    // Parse description từ JSON string thành array
    return {
      ...product,
      description: product.description ? JSON.parse(product.description) : []
    };
  },

  // 🔵 UPDATE
  async update(seller_id: string, id: string, data: any) {
    const existing = await prisma.product.findFirst({ 
      where: { id, seller_id },
      include: { product_variant: true }
    });
    if (!existing) return null;

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
      dimensions,
      categoryId,
      attributes,
      variants,
      status, // Thêm status
    } = data;

    // Validate description structure
    if (description && !Array.isArray(description)) {
      throw new Error("Description phải là mảng các block {type, content}");
    }

    // Cập nhật product chính
    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ? JSON.stringify(description) : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        stock: stock !== undefined ? parseInt(stock) : existing.stock,
        images: images ? (Array.isArray(images) ? images.flat() : [images]) : existing.images,
        rating: rating !== undefined ? parseFloat(rating) : existing.rating,
        discount: discount !== undefined ? parseFloat(discount) : existing.discount,
        tags: tags ? (typeof tags === 'string' ? tags.split(",").map((t: string) => t.trim()) : tags) : existing.tags,
        weight: weight ?? existing.weight,
        dimensions: dimensions ?? existing.dimensions,
        category_id: categoryId ?? existing.category_id,
        attributes: attributes ?? existing.attributes,
        status: status ?? existing.status, // Thêm status
      },
    });

    // Cập nhật variants nếu có
    if (variants && Array.isArray(variants)) {
      // Xóa cũ → tạo mới
      await prisma.product_variant.deleteMany({ where: { product_id: id } });
      
      if (variants.length > 0) {
        const variantData = variants.map((v: any) => ({
          product_id: id,
          title: v.title || "",
          price: v.price ? parseFloat(v.price) : 0,
          stock: v.stock ? parseInt(v.stock) : 0,
          image: v.image || "",
        }));
        await prisma.product_variant.createMany({ data: variantData });
      }
    }

    return this.getById(seller_id, id); // Trả về product đầy đủ với variants
  },

  // 🔴 DELETE
  async remove(seller_id: string, id: string) {
    const existing = await prisma.product.findFirst({ where: { id, seller_id } });
    if (!existing) return null;

    // Xóa variants trước
    await prisma.product_variant.deleteMany({ where: { product_id: id } });
    await prisma.product.delete({ where: { id } });
    return true;
  },

  // 🟠 UPDATE STATUS
  async updateStatus(seller_id: string, id: string, status: string) {
    const existing = await prisma.product.findFirst({ where: { id, seller_id } });
    if (!existing) return null;

    if (!["active", "inactive"].includes(status)) {
      throw new Error("Status phải là 'active' hoặc 'inactive'");
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { status },
    });

    return this.getById(seller_id, id); // Trả về product đầy đủ
  },
};