import { Request, Response } from "express";
import { getSellerById } from "../../services/seller/auth.service";

export const sellerMeController = async (req: any, res: Response) => {
  try {
    const sellerId = req.seller?.id;
    if (!sellerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const seller = await getSellerById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({ seller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
