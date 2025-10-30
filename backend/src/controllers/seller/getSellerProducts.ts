import { prisma } from "../../utils/prisma";


export const getSellerProducts = async (req: any, res: any) => {
  const sellerId = req.seller.id;
  const products = await prisma.product.findMany({
    where: { sellerId },
  });
  res.json({ products });
};