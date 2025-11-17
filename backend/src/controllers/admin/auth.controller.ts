import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from 'zod';

// === ZOD SCHEMAS =================================================
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// === TOKEN HELPER ===============================================
function signAdminToken(admin: { id: string; email: string; name: string }) {
  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: 'admin' },
    secret,
    { expiresIn: '7d' }
  );
}

// === LOGIN =======================================================
export async function adminLoginController(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Email và mật khẩu không hợp lệ' });
    }

    const { email, password } = parsed.data;
    
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });

    return res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (err: any) {
    console.error('❌ adminLoginController error:', err);
    
    // Kiểm tra nếu lỗi do model admin không tồn tại
    if (err?.message?.includes('admin') || err?.code === 'P2021') {
      return res.status(500).json({ 
        error: 'Model admin chưa được tạo. Vui lòng chạy: npx prisma generate và tạo bảng admin trong database.' 
      });
    }
    
    // Kiểm tra nếu lỗi do bảng không tồn tại
    if (err?.message?.includes('does not exist') || err?.message?.includes('relation')) {
      return res.status(500).json({ 
        error: 'Bảng admin chưa tồn tại. Vui lòng chạy SQL tạo bảng admin trong database.' 
      });
    }
    
    return res.status(500).json({ 
      error: err?.message || 'Lỗi server',
      details: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
  }
}

// === ME ==========================================================
export async function adminMeController(req: any, res: Response) {
  try {
    const admin_id = req.admin?.id;
    if (!admin_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await prisma.admin.findUnique({ 
      where: { id: admin_id },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        updated_at: true,
      }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    return res.json({ admin });
  } catch (err) {
    console.error('❌ adminMeController error:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

