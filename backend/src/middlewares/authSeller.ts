import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_here";

export interface SellerRequest extends Request {
  seller?: any;
}

export const authSeller = (req: SellerRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.seller = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
