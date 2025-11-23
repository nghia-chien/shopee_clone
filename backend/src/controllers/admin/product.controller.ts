import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';

// GET ALL PRODUCTS
export async function getAllProductsController(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', search = '', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          seller: {
            select: { id: true, name: true, email: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      items: products,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getAllProductsController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// GET PRODUCT BY ID
export async function getProductByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, email: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (err: any) {
    console.error('getProductByIdController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// UPDATE PRODUCT
export async function updateProductController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, price, stock, status, category_id, discount } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(price && { price }),
        ...(stock !== undefined && { stock }),
        ...(status && { status }),
        ...(category_id && { category_id }),
        ...(discount !== undefined && { discount }),
      },
      include: {
        seller: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return res.json({ product, message: 'Cập nhật sản phẩm thành công' });
  } catch (err: any) {
    console.error('updateProductController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// DELETE PRODUCT
export async function deleteProductController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err: any) {
    console.error('deleteProductController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

