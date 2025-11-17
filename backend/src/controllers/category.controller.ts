import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export async function getCategoryTree(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { level: 'asc' } });
    // Build tree
    const byId = new Map(categories.map(c => [c.id, { ...c, children: [] as any[] }]));
    const roots: any[] = [];
    byId.forEach((node) => {
      if (node.parent_id && byId.has(node.parent_id)) {
        byId.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return res.json({ categories: roots });
  } catch (e) {
    console.error('getCategoryTree error', e);
    return res.status(500).json({ message: 'getCategoryTree Internal server error' });
  }
}

// Minimal attribute schema per category (could be moved to DB later)
const CATEGORY_ATTRIBUTES: Record<string, any> = {
  // key by slug
  'dien-tu': { fields: [{ key: 'brand', label: 'Thương hiệu', type: 'text', required: true }, { key: 'gtin', label: 'GTIN', type: 'text' }] },
  'am-thanh': { fields: [{ key: 'brand', label: 'Thương hiệu', type: 'text', required: true }, { key: 'color', label: 'Màu sắc', type: 'text' }] },
  'thoi-trang': { fields: [{ key: 'brand', label: 'Thương hiệu', type: 'text' }, { key: 'size', label: 'Size', type: 'text' }, { key: 'material', label: 'Chất liệu', type: 'text' }] },
};

export async function getCategoryAttributes(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const schema = CATEGORY_ATTRIBUTES[cat.slug] || { fields: [{ key: 'brand', label: 'Thương hiệu', type: 'text' }] };
    return res.json({ attributes: schema });
  } catch (e) {
    console.error('getCategoryAttributes error', e);
    return res.status(500).json({ message: 'getCategoryAttributes Internal server error' });
  }
}
export const getProductsByCategory = async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  try {
    // Lấy tất cả sản phẩm thuộc category
    const products = await prisma.product.findMany({
      where: {
        category_id: categoryId, // theo quan hệ
        status: "active",        // chỉ lấy sản phẩm đang active
      },
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        discount: true,
        rating: true,
        stock: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(products);
  } catch (err) {
    console.error("getProductsByCategory error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
// category.controller.ts
export const getProductsByCategorySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    // Tìm category theo slug
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return res.status(404).json({ message: "Category not found" });

    const products = await prisma.product.findMany({
      where: {
        category_id: category.id,
        status: "active",
      },
      select: {
        id: true,
        title: true,
        images: true,
        price: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "getProductsByCategorySlug Internal server error" });
  }
};


// Bản đồ slug → icon
const iconMap: Record<string, string> = {
  "thoi-trang-nam": "👔",
  "thoi-trang-nu": "👗",
  "thoi-trang-tre-em": "🧒",
  "dien-thoai-phu-kien": "📱",
  "thiet-bi-dien-tu": "💻",
  "may-tinh-laptop": "🖥️",
  "may-anh-may-quay": "📷",
  "dong-ho": "⌚",
  "giay-dep-nam": "👞",
  "giay-dep-nu": "👠",
  "tui-vi-nu": "🛍️",
  "balo-tui-vi-nam": "👜",
  "phu-kien-trang-suc-nu": "💍",
  "nha-cua-doi-song": "🏠",
  "sac-dep": "💄",
  "suc-khoe": "🩺",
  "bach-hoa-online": "🛒",
  "nha-sach-online": "📚",
  "do-choi": "🧸",
  "cham-soc-thu-cung": "🐶",
  "dung-cu-tien-ich": "🔧",
  "giat-giu-cham-soc-nha-cua": "🧹",
  "voucher-dich-vu": "🎟️",
  "oto-xe-may-xe-dap": "🚗",
  "the-thao-du-lich": "🏖️",
  "thiet-bi-dien-gia-dung": "🔌",
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });

    const result = categories.map(c => ({
      ...c,
      icon: iconMap[c.slug] || "❓", // Nếu chưa map thì dùng ❓
    }));

    res.json(result);
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
