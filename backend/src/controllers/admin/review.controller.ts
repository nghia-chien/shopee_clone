import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';

// GET ALL REVIEWS
export async function getAllReviewsController(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', search = '', rating } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (rating) {
      where.rating = parseInt(rating as string);
    }

    const [reviews, total] = await Promise.all([
      prisma.product_reviews.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          product: {
            select: { id: true, title: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          review_replies: {
            include: {
              seller: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: { review_likes: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.product_reviews.count({ where }),
    ]);

    return res.json({
      items: reviews,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('getAllReviewsController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// GET REVIEW BY ID
export async function getReviewByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const review = await prisma.product_reviews.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, title: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        review_replies: {
          include: {
            seller: {
              select: { id: true, name: true },
            },
          },
        },
        review_likes: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.json({ review });
  } catch (err: any) {
    console.error('getReviewByIdController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// DELETE REVIEW
export async function deleteReviewController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.product_reviews.delete({ where: { id } });
    return res.json({ message: 'Xóa đánh giá thành công' });
  } catch (err: any) {
    console.error('deleteReviewController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

