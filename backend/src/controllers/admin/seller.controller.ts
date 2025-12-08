import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// === ZOD SCHEMAS =================================================
const updateSellerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone_number: z.string().regex(/^\+?\d{10,15}$/).optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  address: z.any().optional(),
});

const createSellerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().regex(/^\+?\d{10,15}$/).optional().nullable(),
  password: z.string().min(6),
  address: z.any().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

// === GET ALL SELLERS =============================================
export async function getAllSellersController(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', search = '', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone_number: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [sellers, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          phone_number: true,
          status: true,
          rating: true,
          created_at: true,
          updated_at: true,
          shop_mall: true,
          _count: {
            select: {
              product: true,
              seller_order: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.seller.count({ where }),
    ]);

    return res.json({
      sellers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('❌ getAllSellersController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// === GET SELLER BY ID ============================================
export async function getSellerByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const seller = await prisma.seller.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone_number: true,
        status: true,
        rating: true,
        address: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            product: true,
            seller_order: true,
          },
        },
      },
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    return res.json({ seller });
  } catch (err: any) {
    console.error('❌ getSellerByIdController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// === CREATE SELLER ===============================================
export async function createSellerController(req: Request, res: Response) {
  try {
    const parsed = createSellerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.errors });
    }

    const { name, email, phone_number, password, address, status } = parsed.data;

    // Kiểm tra email đã tồn tại
    const existingSeller = await prisma.seller.findUnique({ where: { email } });
    if (existingSeller) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    // Kiểm tra phone_number nếu có
    if (phone_number) {
      const existingPhone = await prisma.seller.findUnique({ where: { phone_number } });
      if (existingPhone) {
        return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo seller
    const seller = await prisma.seller.create({
      data: {
        name,
        email,
        phone_number: phone_number || null,
        password: hashedPassword,
        address: address || null,
        status: status || 'active',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone_number: true,
        status: true,
        rating: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.status(201).json({ seller, message: 'Tạo seller thành công' });
  } catch (err: any) {
    console.error('❌ createSellerController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// === UPDATE SELLER ===============================================
export async function updateSellerController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parsed = updateSellerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.errors });
    }

    const data = parsed.data;

    // Kiểm tra seller tồn tại
    const existingSeller = await prisma.seller.findUnique({ where: { id } });
    if (!existingSeller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Kiểm tra email trùng (nếu có thay đổi)
    if (data.email && data.email !== existingSeller.email) {
      const emailExists = await prisma.seller.findUnique({ where: { email: data.email } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email đã tồn tại' });
      }
    }

    // Kiểm tra phone_number trùng (nếu có thay đổi)
    if (data.phone_number && data.phone_number !== existingSeller.phone_number) {
      const phoneExists = await prisma.seller.findUnique({ where: { phone_number: data.phone_number } });
      if (phoneExists) {
        return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
      }
    }

    // Cập nhật seller
    const seller = await prisma.seller.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone_number: true,
        status: true,
        rating: true,
        address: true,
        created_at: true,
        updated_at: true,
        shop_mall: true,
      },
    });

    return res.json({ seller, message: 'Cập nhật seller thành công' });
  } catch (err: any) {
    console.error('❌ updateSellerController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// === DELETE SELLER ==============================================
export async function deleteSellerController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Kiểm tra seller tồn tại
    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Xóa seller (cascade sẽ xóa các bản ghi liên quan)
    await prisma.seller.delete({ where: { id } });

    return res.json({ message: 'Xóa seller thành công' });
  } catch (err: any) {
    console.error('❌ deleteUserController error:', err.message);
  console.error(err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

