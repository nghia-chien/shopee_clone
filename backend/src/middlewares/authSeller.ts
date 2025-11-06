import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";

export interface SellerRequest extends Request {
  seller?: { id: string; email?: string; phone_number?: string };
}

export const requireAuthSeller = async (req: SellerRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized middlewares/autheSeller.ts' });
  const token = header.slice('Bearer '.length);
  try {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const decoded = jwt.verify(token, secret) as { id: string; email?: string; role?: string };
    if (decoded.role !== 'seller') {
      return res.status(401).json({ message: 'Unauthorized: not a seller token' });
    }
    // Optional: double-check seller exists
    const seller = await prisma.seller.findUnique({ where: { id: decoded.id } });
    if (!seller) return res.status(401).json({ message: 'Unauthorized: seller not found' });
    req.seller = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token ở middlewares" });
  }
};
