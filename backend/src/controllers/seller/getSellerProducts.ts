import { prisma } from "../../utils/prisma";


export const getSellerProducts = async (req: any, res: any) => {
  const seller_id = req.seller.id;
  const products = await prisma.product.findMany({
    where: { seller_id },
  });
  res.json({ products });
};