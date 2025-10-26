import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

// ✅ Schema xác thực đầu vào
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().min(10).max(15),
  password: z.string().min(6),
  name: z.string().optional(),
});

// ✅ Hàm tạo JWT
function signToken(user: { id: string; email: string; phoneNumber?: string }) {
  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  return jwt.sign({ id: user.id, email: user.email, phoneNumber: user.phoneNumber }, secret, { expiresIn: '7d' });
}

/**
 * 🧾 Đăng ký tài khoản
 */
export async function registerController(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

    const { email, phoneNumber, password, name } = parsed.data;

    // Kiểm tra email đã tồn tại
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) return res.status(400).json({ message: 'Email already registered' });

    // Kiểm tra phoneNumber đã tồn tại
    const existingUserByPhone = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existingUserByPhone) return res.status(400).json({ message: 'Phone number already registered' });

    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user
    const user = await prisma.user.create({
      data: { 
        email, 
        phoneNumber, 
        password: hashedPassword, 
        name: name || null 
      },
    });

    const token = signToken(user);
    return res.status(201).json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        phoneNumber: user.phoneNumber,
        name: user.name 
      } 
    });
  } catch (error) {
    console.error('❌ registerController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 🔐 Đăng nhập
 */
export async function loginController(req: Request, res: Response) {
  try {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid credentials' });

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user);
    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        phoneNumber: user.phoneNumber,
        name: user.name 
      } 
    });
  } catch (error) {
    console.error('❌ loginController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * 👤 Lấy thông tin user hiện tại
 */
export async function meController(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, 
        email: true, 
        phoneNumber: true,
        name: true,
        createdAt: true 
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (error) {
    console.error('❌ meController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
