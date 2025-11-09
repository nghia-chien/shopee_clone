import { Request, Response } from "express";
import { getSellerById } from "../../services/seller/auth.service";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from 'zod';

// === ZOD SCHEMAS =================================================
const baseUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = baseUserSchema.extend({
  phone_number: z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone number'),
  name: z.string().optional(),
});

export const sellerRegisterController = async (req:any , res: Response)=>{
  try {
    const { name, email, password, phone_number, address } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email, password required" });

    const exist_email = await prisma.seller.findUnique({ where: { email } });
    if (exist_email) return res.status(400).json({ error: "Email already registered" });
    const exist_phone = await prisma.seller.findUnique({ where: { phone_number } });
    if (exist_phone) return res.status(400).json({ error: "Phone number already registered" });
    
    const hashed = await bcrypt.hash(password, 10);
    const seller = await prisma.seller.create({
      data: { name, email, password: hashed, phone_number, address },
    });

    const token = jwt.sign({ id: seller.id, email: seller.email, phone_number: seller.phone_number, role: 'seller' }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

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

    if (!seller.password) {
      return res.status(400).json({ error: "Invalid password" });
    }
    let match = false;
    try {
      match = await bcrypt.compare(password, seller.password);
    } catch {
      match = false;
    }
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: seller.id, email: seller.email, phone_number: seller.phone_number, role: 'seller' }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    res.json({ seller: { id: seller.id, email: seller.email, name: seller.name }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error sellerLoginController seller/auth.controller" });
  }
}

export const sellerMeController = async (req: any, res: Response) => {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) {
      return res.status(401).json({ error: "Unauthorized seller/auth.controller " });
    }

    const seller = await getSellerById(seller_id);
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({ seller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error sellerMeController seller/auth.controller" });
  }
};

