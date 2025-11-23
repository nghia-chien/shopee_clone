import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';

// GET ALL CATEGORIES
export async function getAllCategoriesController(req: Request, res: Response) {
  try {
    const { page = '1', limit = '100', search = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          category: {
            select: { id: true, name: true },
          },
          _count: {
            select: { product: true },
          },
        },
        orderBy: { level: 'asc' },
      }),
      prisma.category.count({ where }),
    ]);

    return res.json({
      items: categories,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getAllCategoriesController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// GET CATEGORY BY ID
export async function getCategoryByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { product: true },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            status: true,
          },
          take: 20, // Limit to 20 products for display
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.json({ category });
  } catch (err: any) {
    console.error('getCategoryByIdController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// CREATE CATEGORY
export async function createCategoryController(req: Request, res: Response) {
  try {
    const { name, slug, parent_id, level, path, image } = req.body;

    // Auto-generate path if not provided
    let finalPath: string[] = [];
    if (parent_id) {
      const parent = await prisma.category.findUnique({
        where: { id: parent_id },
        select: { path: true, name: true },
      });
      if (parent) {
        finalPath = [...parent.path, parent.name];
      } else {
        finalPath = [name];
      }
    } else {
      finalPath = [name];
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parent_id: parent_id || null,
        level: level || 1,
        path: finalPath,
        image: image || null,
      },
    });

    return res.status(201).json({ category, message: 'Tạo danh mục thành công' });
  } catch (err: any) {
    console.error('createCategoryController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// UPDATE CATEGORY
export async function updateCategoryController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, slug, parent_id, level, path, image } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(parent_id !== undefined && { parent_id }),
        ...(level !== undefined && { level }),
        ...(path !== undefined && { path }),
        ...(image !== undefined && { image }),
      },
    });

    return res.json({ category, message: 'Cập nhật danh mục thành công' });
  } catch (err: any) {
    console.error('updateCategoryController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// DELETE CATEGORY
export async function deleteCategoryController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Xóa danh mục thành công' });
  } catch (err: any) {
    console.error('deleteCategoryController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

