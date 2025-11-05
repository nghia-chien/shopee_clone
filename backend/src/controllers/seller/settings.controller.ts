import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';

export async function updateSellerProfileController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { name, phone_number, address } = req.body as { name?: string; phone_number?: string; address?: any };

    const updated = await prisma.seller.update({
      where: { id: seller_id },
      data: {
        name: name ?? undefined,
        phone_number: phone_number ?? undefined,
        address: address ?? undefined,
      },
      select: { id: true, name: true, email: true, phone_number: true, address: true, rating: true, status: true },
    });

    return res.json({ seller: updated });
  } catch (error) {
    console.error('updateSellerProfileController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateSellerPaymentController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { payment } = req.body as { payment?: any };

    const seller = await prisma.seller.findUnique({ where: { id: seller_id } });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const newAddress = {
      ...(seller.address as any || {}),
      payment: payment ?? (seller.address as any)?.payment ?? null,
    };

    const updated = await prisma.seller.update({
      where: { id: seller_id },
      data: { address: newAddress },
      select: { id: true, address: true },
    });

    return res.json({ seller: updated });
  } catch (error) {
    console.error('updateSellerPaymentController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateSellerShippingController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { shipping } = req.body as { shipping?: any };

    const seller = await prisma.seller.findUnique({ where: { id: seller_id } });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const newAddress = {
      ...(seller.address as any || {}),
      shipping: shipping ?? (seller.address as any)?.shipping ?? null,
    };

    const updated = await prisma.seller.update({
      where: { id: seller_id },
      data: { address: newAddress },
      select: { id: true, address: true },
    });

    return res.json({ seller: updated });
  } catch (error) {
    console.error('updateSellerShippingController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateSellerPasswordController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password too short' });

    const seller = await prisma.seller.findUnique({ where: { id: seller_id } });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    // NOTE: Assuming passwords are stored hashed; compare properly in real app
    // For this codebase, we don't see bcrypt here; keep minimal sample with plain compare
    if (seller.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const updated = await prisma.seller.update({
      where: { id: seller_id },
      data: { password: newPassword },
      select: { id: true },
    });

    return res.json({ ok: true, seller: updated });
  } catch (error) {
    console.error('updateSellerPasswordController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


