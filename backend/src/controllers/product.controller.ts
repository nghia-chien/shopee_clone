import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export async function listProductsController(_req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany();
    return res.json({ items: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getProductController(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
