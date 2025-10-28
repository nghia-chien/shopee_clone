import { Router } from "express";
import { prisma } from "../../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authSeller } from "../../middlewares/authSeller";
import { sellerMeController } from "../../controllers/seller/auth.controller";

const router = Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email, password required" });

    const exist = await prisma.seller.findUnique({ where: { email } });
    if (exist) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const seller = await prisma.seller.create({
      data: { name, email, password: hashed, phoneNumber, address },
    });

    const token = jwt.sign({ id: seller.id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    res.json({ seller: { id: seller.id, email: seller.email, name: seller.name }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const seller = await prisma.seller.findUnique({ where: { email } });
    if (!seller) return res.status(400).json({ error: "Seller not found" });

    const match = await bcrypt.compare(password, seller.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: seller.id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

    res.json({ seller: { id: seller.id, email: seller.email, name: seller.name }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Thêm route "me"
router.get("/me", authSeller, sellerMeController);

export default router;
