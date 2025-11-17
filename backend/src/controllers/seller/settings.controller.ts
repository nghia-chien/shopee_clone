import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';

const SENSITIVE_WINDOW_DAYS = 15;

const shouldRequirePassword = (updatedAt?: Date | null) => {
  if (!updatedAt) return false;
  const diffDays = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= SENSITIVE_WINDOW_DAYS;
};

const buildSellerPayload = (seller: {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  avatar: string | null;
  address: unknown;
  rating: number | null;
  status: string;
  updated_at: Date;
}) => {
  const lastUpdate = seller.updated_at ?? null;
  const daysSince = lastUpdate ? Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)) : null;
  return {
    seller,
    security: {
      lastSensitiveUpdate: lastUpdate,
      requiresPassword: shouldRequirePassword(lastUpdate),
      daysSinceLastUpdate: daysSince,
      thresholdDays: SENSITIVE_WINDOW_DAYS,
    },
  };
};

export async function getSellerSettingsController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const seller = await prisma.seller.findUnique({
      where: { id: seller_id },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        avatar: true,
        address: true,
        rating: true,
        status: true,
        updated_at: true,
      },
    });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    return res.json(buildSellerPayload(seller));
  } catch (error) {
    console.error('getSellerSettingsController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateSellerProfileController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const { name, phone_number, address, avatar, password } = req.body as {
      name?: string;
      phone_number?: string;
      address?: unknown;
      avatar?: string | null;
      password?: string;
    };

    const existingSeller = await prisma.seller.findUnique({
      where: { id: seller_id },
      select: { id: true, password: true, updated_at: true },
    });
    if (!existingSeller) return res.status(404).json({ message: 'Seller not found' });

    const requiresPassword = shouldRequirePassword(existingSeller.updated_at);
    if (requiresPassword) {
      if (!password) {
        return res.status(403).json({
          message: 'Vui lòng xác thực mật khẩu trước khi cập nhật',
          requiresPassword: true,
        });
      }
      const match = existingSeller.password
        ? await bcrypt.compare(password, existingSeller.password)
        : false;
      if (!match) {
        return res.status(400).json({
          message: 'Mật khẩu không chính xác',
          requiresPassword: true,
        });
      }
    }

    const data: Record<string, unknown> = {};
    if (typeof name === 'string') data.name = name;
    if (typeof phone_number === 'string') data.phone_number = phone_number;
    if (avatar !== undefined) data.avatar = avatar;
    if (address !== undefined) data.address = address;

    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'Không có dữ liệu cần cập nhật' });
    }

    const updated = await prisma.seller.update({
      where: { id: seller_id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        avatar: true,
        address: true,
        rating: true,
        status: true,
        updated_at: true,
      },
    });

    return res.json({
      ...buildSellerPayload(updated),
      message: 'Cập nhật thông tin thành công',
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });
    }
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
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đủ thông tin' });
    }
    if (newPassword.length < 6) return res.status(400).json({ message: 'Mật khẩu mới phải tối thiểu 6 ký tự' });

    const seller = await prisma.seller.findUnique({
      where: { id: seller_id },
      select: { password: true },
    });
    if (!seller?.password) return res.status(404).json({ message: 'Seller not found' });

    const match = await bcrypt.compare(currentPassword, seller.password);
    if (!match) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.seller.update({
      where: { id: seller_id },
      data: { password: hashed },
    });

    return res.json({ ok: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('updateSellerPasswordController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


