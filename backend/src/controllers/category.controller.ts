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
    return res.status(500).json({ message: 'Internal server error' });
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
    return res.status(500).json({ message: 'Internal server error' });
  }
}


