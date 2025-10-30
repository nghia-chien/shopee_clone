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

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};