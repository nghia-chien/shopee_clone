import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth';

const nowDate = () => new Date();

const baseVoucherSelect = {
  id: true,
  code: true,
  source: true,
  seller_id: true,
  type: true,
  discount_type: true,
  discount_value: true,
  max_discount_amount: true,
  min_order_amount: true,
  product_id: true,
  applicable_user_id: true,
  usage_limit_per_user: true,
  usage_limit_total: true,
  used_count: true,
  start_at: true,
  end_at: true,
  status: true,
};

export async function listPublicVouchersController(req: Request, res: Response) {
  try {
    const { seller_id, source } = req.query as { seller_id?: string; source?: string };
    const now = nowDate();
    const vouchers = await prisma.vouchers.findMany({
      where: {
        status: 'ACTIVE',
        start_at: { lte: now },
        end_at: { gte: now },
        ...(seller_id ? { seller_id } : {}),
        ...(source ? { source } : {}),
      },
      orderBy: { start_at: 'desc' },
      select: baseVoucherSelect,
    });
    return res.json({ vouchers });
  } catch (error) {
    console.error('listPublicVouchersController error:', error);
    return res.status(500).json({ message: 'listPublicVouchersController Internal server error' });
  }
}

export async function saveVoucherController(req: AuthRequest, res: Response) {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });
    const voucherId = req.params.voucherId;

    const voucher = await prisma.vouchers.findUnique({
      where: { id: voucherId },
      select: baseVoucherSelect,
    });
    if (!voucher) return res.status(404).json({ message: 'Voucher không tồn tại' });

    const now = nowDate();
    if (voucher.status !== 'ACTIVE' || now < voucher.start_at || now > voucher.end_at) {
      return res.status(400).json({ message: 'Voucher không còn hiệu lực' });
    }

    if (voucher.applicable_user_id && voucher.applicable_user_id !== user_id) {
      return res.status(400).json({ message: 'Voucher này không dành cho bạn' });
    }

    const saved = await prisma.user_vouchers.upsert({
      where: {
        user_id_voucher_id: {
          user_id,
          voucher_id: voucherId,
        },
      },
      update: {
        saved_at: new Date(),
      },
      create: {
        user_id,
        voucher_id: voucherId,
      },
      include: {
        vouchers: {
          select: baseVoucherSelect,
        },
      },
    });

    return res.json({
      saved: {
        id: saved.id,
        saved_at: saved.saved_at,
        used_at: saved.used_at,
        usage_count: saved.usage_count,
        voucher: saved.vouchers,
      },
    });
  } catch (error) {
    console.error('saveVoucherController error:', error);
    return res.status(500).json({ message: 'saveVoucherController Internal server error' });
  }
}

export async function listUserVouchersController(req: AuthRequest, res: Response) {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    // Get all saved vouchers
    const savedVouchers = await prisma.user_vouchers.findMany({
      where: { user_id },
      include: {
        vouchers: {
          select: baseVoucherSelect,
        },
      },
      orderBy: { saved_at: 'desc' },
    });

    // Get all active vouchers from vouchers table
    const now = nowDate();
    let allVouchers: any[] = [];
    try {
      // First, get vouchers with applicable_user_id = null (public vouchers)
      const publicVouchers = await prisma.vouchers.findMany({
        where: {
          status: 'ACTIVE',
          start_at: { lte: now },
          end_at: { gte: now },
          applicable_user_id: null,
        },
        select: baseVoucherSelect,
        orderBy: { start_at: 'desc' },
      });

      // Then, get vouchers specific to this user (if applicable_user_id matches)
      let userSpecificVouchers: any[] = [];
      try {
        userSpecificVouchers = await prisma.vouchers.findMany({
          where: {
            status: 'ACTIVE',
            start_at: { lte: now },
            end_at: { gte: now },
            applicable_user_id: user_id,
          },
          select: baseVoucherSelect,
          orderBy: { start_at: 'desc' },
        });
      } catch (userVoucherError: any) {
        console.error('Error fetching user-specific vouchers:', userVoucherError);
        // Continue with public vouchers only
      }

      // Combine both lists and remove duplicates
      const voucherMap = new Map();
      [...publicVouchers, ...userSpecificVouchers].forEach((v) => {
        voucherMap.set(v.id, v);
      });
      allVouchers = Array.from(voucherMap.values());
    } catch (voucherError: any) {
      console.error('Error fetching all vouchers:', voucherError);
      console.error('Error message:', voucherError?.message);
      console.error('Error code:', voucherError?.code);
      // If error, just return saved vouchers
      allVouchers = [];
    }

    // Create a map of saved vouchers for quick lookup
    const savedVoucherMap = new Map(
      savedVouchers.map((sv) => [sv.voucher_id, sv])
    );

    // Combine all vouchers: saved ones with usage info, unsaved ones as virtual entries
    const allVoucherEntries = allVouchers.map((voucher) => {
      const saved = savedVoucherMap.get(voucher.id);
      if (saved) {
        // Voucher đã được lưu
        return {
          id: saved.id,
          voucher_id: voucher.id,
          saved_at: saved.saved_at,
          used_at: saved.used_at,
          usage_count: saved.usage_count,
          voucher,
        };
      } else {
        // Voucher chưa được lưu
        return {
          id: `temp-${voucher.id}`,
          voucher_id: voucher.id,
          saved_at: null,
          used_at: null,
          usage_count: 0,
          voucher,
        };
      }
    });

    return res.json({
      vouchers: allVoucherEntries,
    });
  } catch (error: any) {
    console.error('listUserVouchersController error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return res.status(500).json({ 
      message: 'listUserVouchersController Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
}

