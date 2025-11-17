import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";

export interface AdminRequest extends Request {
  admin?: { id: string; email: string; name: string };
}

export const requireAuthAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const decoded = jwt.verify(token, secret) as { 
      id: string; 
      email?: string; 
      name?: string;
      role?: string;
    };

    if (decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized - Not an admin token' });
    }

    // Optional: double-check admin exists
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized - Admin not found' });
    }

    req.admin = { 
      id: decoded.id, 
      email: decoded.email || admin.email,
      name: decoded.name || admin.name,
    };
    next();
  } catch (err) {
    console.error('❌ requireAuthAdmin error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

