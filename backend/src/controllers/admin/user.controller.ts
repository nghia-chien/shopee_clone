import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// === ZOD SCHEMAS =================================================
const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone_number: z.string().regex(/^\+?\d{10,15}$/).optional().nullable(),
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone_number: z.string().regex(/^\+?\d{10,15}$/).optional().nullable(),
  password: z.string().min(6),
});

// === GET ALL USERS ===============================================
export async function getAllUsersController(req: Request, res: Response) {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;
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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          phone_number: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('❌ getAllUsersController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// === GET USER BY ID ==============================================
export async function getUserByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err: any) {
    console.error('❌ getUserByIdController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// === CREATE USER =================================================
export async function createUserController(req: Request, res: Response) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.errors });
    }

    const { name, email, phone_number, password } = parsed.data;

    // Kiểm tra email đã tồn tại
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    // Kiểm tra phone_number nếu có
    if (phone_number) {
      const existingPhone = await prisma.user.findUnique({ where: { phone_number } });
      if (existingPhone) {
        return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone_number: phone_number || null,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.status(201).json({ user, message: 'Tạo user thành công' });
  } catch (err: any) {
    console.error('❌ createUserController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// === UPDATE USER =================================================
export async function updateUserController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.errors });
    }

    const data = parsed.data;

    // Kiểm tra user tồn tại
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Kiểm tra email trùng (nếu có thay đổi)
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email đã tồn tại' });
      }
    }

    // Kiểm tra phone_number trùng (nếu có thay đổi)
    if (data.phone_number && data.phone_number !== existingUser.phone_number) {
      const phoneExists = await prisma.user.findUnique({ where: { phone_number: data.phone_number } });
      if (phoneExists) {
        return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
      }
    }

    // Cập nhật user
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.json({ user, message: 'Cập nhật user thành công' });
  } catch (err: any) {
    console.error('❌ updateUserController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// === DELETE USER =================================================
export async function deleteUserController(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Xóa user (cascade sẽ xóa các bản ghi liên quan)
    await prisma.user.delete({ where: { id } });

    return res.json({ message: 'Xóa user thành công' });
  } catch (err: any) {
    console.error('❌ deleteUserController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

