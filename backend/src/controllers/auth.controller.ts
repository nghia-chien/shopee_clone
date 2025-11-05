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
  phoneNumber: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),
  name: z.string().optional(),
});

// === TOKEN HELPER ===============================================
function signToken(user: { id: string; email: string; phoneNumber?: string }) {
  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  return jwt.sign(
    { id: user.id, email: user.email, phoneNumber: user.phoneNumber ?? undefined },
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

    const { email, phoneNumber, password, name } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phoneNumber }] },
    });
    if (existingUser) return res.status(400).json({ message: 'Email or phone already registered' });

    const user = await prisma.user.create({
      data: {
        email,
        phoneNumber,
        password: await bcrypt.hash(password, 10),
        name: name || null,
      },
    });

    // Check if this user is already linked to a seller account (should be none on register)
    const linkedSeller = await prisma.seller.findUnique({ where: { userId: user.id } });

    return res.status(201).json({
      token: signToken({ ...user, phoneNumber: user.phoneNumber || undefined }),
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        isSeller: Boolean(linkedSeller),
        sellerId: linkedSeller?.id || null,
      },
    });
  } catch (err) {
    console.error('❌ registerController error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// === LOGIN =======================================================
export async function loginController(req: Request, res: Response) {
  try {
    const parsed = baseUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid credentials' });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Check seller link
    const linkedSeller = await prisma.seller.findUnique({ where: { userId: user.id } });

    return res.json({
      token: signToken({ ...user, phoneNumber: user.phoneNumber || undefined }),
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        isSeller: Boolean(linkedSeller),
        sellerId: linkedSeller?.id || null,
      },
    });
  } catch (err) {
    console.error('❌ loginController error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }}


//==Me=================================================================
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
        createdAt: true,
        seller: { select: { id: true } },
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      ...user,
      isSeller: Boolean(user.seller),
      sellerId: user.seller?.id || null,
    });
  } catch (error) {
    console.error('❌ meController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
