import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface SellerRequest extends Request {
  seller?: { id: string; email?: string };
}

export const requireAuthSeller = (req: SellerRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized middlewares/autheSeller.ts' });
  const token = header.slice('Bearer '.length);
  try {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const decoded = jwt.verify(token, secret)as { id: string; email?: string };
    req.seller = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token ở middlewares" });
  }
};
