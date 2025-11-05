import { Request, Response } from "express";
import { getSellerById } from "../../services/seller/auth.service";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from 'zod';
import { Request } from 'express';

// === ZOD SCHEMAS =================================================
const baseUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = baseUserSchema.extend({
  phoneNumber: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),
  name: z.string().optional(),
});

export const sellerRegisterController = async (req:any , res: Response)=>{
  try {
    const { name, email, password, phoneNumber, address } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email, password required" });

    const exist_email = await prisma.seller.findUnique({ where: { email } });
    if (exist_email) return res.status(400).json({ error: "Email already registered" });
    const exist_phone = await prisma.seller.findUnique({ where: { phoneNumber } });
    if (exist_phone) return res.status(400).json({ error: "Phone number already registered" });
    
    const hashed = await bcrypt.hash(password, 10);
    const seller = await prisma.seller.create({
      data: { name, email, password: hashed, phoneNumber, address },
    });

    const token = jwt.sign({ id: seller.id, email: seller.email, phoneNumber: seller.phoneNumber, role: 'seller' }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    res.json({ seller: { id: seller.id, email: seller.email, name: seller.name }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error  sellerRegisterController seller/auth.controller" });
  }
}
export const sellerLoginController = async (req:any , res: Response)=>{
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const seller = await prisma.seller.findUnique({ where: { email } });
    if (!seller) return res.status(400).json({ error: "Seller not found" });

    const match = await bcrypt.compare(password, seller.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: seller.id, email: seller.email, phoneNumber: seller.phoneNumber, role: 'seller' }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    res.json({ seller: { id: seller.id, email: seller.email, name: seller.name }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error sellerLoginController seller/auth.controller" });
  }
}

export const sellerMeController = async (req: any, res: Response) => {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ error: "Unauthorized seller/auth.controller " });
    }

    const seller = await getSellerById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({ seller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error sellerMeController seller/auth.controller" });
  }
};

// Exchange a buyer token for a seller token if linked
export const sellerExchangeController = async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const buyerToken = header.slice('Bearer '.length);
    const secret = process.env.JWT_SECRET || 'secret';
    let payload: any;
    try {
      payload = jwt.verify(buyerToken, secret);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // payload should have user id
    const userId = payload.id as string | undefined;
    if (!userId) return res.status(401).json({ error: 'Invalid token payload' });

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) return res.status(404).json({ error: 'Seller link not found' });

    const sellerToken = jwt.sign(
      { id: seller.id, email: seller.email, phoneNumber: seller.phoneNumber, role: 'seller' },
      secret,
      { expiresIn: '7d' }
    );

    return res.json({ token: sellerToken, seller: { id: seller.id, email: seller.email, name: seller.name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error sellerExchangeController' });
  }
};
