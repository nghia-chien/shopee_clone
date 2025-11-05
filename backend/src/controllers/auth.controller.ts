import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

// === ZOD SCHEMAS =================================================
const baseUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = baseUserSchema.extend({
  phone_number: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),
  name: z.string().optional(),
});

// === TOKEN HELPER ===============================================
function signToken(user: { id: string; email: string; phone_number?: string }) {
  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  return jwt.sign(
    { id: user.id, email: user.email, phone_number: user.phone_number ?? undefined },
    secret,
    { expiresIn: '7d' }
  );
}

// === REGISTER ====================================================
export async function registerController(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues?.map((i) => i.message).join(', ');
      return res.status(400).json({ message: issues || 'Invalid payload' });
    }

    const { email, phone_number, password, name } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone_number }] },
    });
    if (existingUser) return res.status(400).json({ message: 'Email or phone already registered' });

    const user = await prisma.user.create({
      data: {
        email,
        phone_number,
        password: await bcrypt.hash(password, 10),
        name: name || null,
      },
    });

    return res.status(201).json({
      token: signToken({ ...user, phone_number: user.phone_number || undefined }),
      user: {
        id: user.id,
        email: user.email,
        phone_number: user.phone_number,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('❌ registerController error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
