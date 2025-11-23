import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';

const baseSelect = {
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

const toNumberOrNull = (value: any) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const parseDate = (value: any) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export async function listAdminVouchersController(_req: Request, res: Response) {
  try {
    const { page = '1', limit = '50', search = '' } = _req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { source: 'ADMIN' };
    if (search) {
      where.code = { contains: search as string, mode: 'insensitive' };
    }

    const [vouchers, total] = await Promise.all([
      prisma.vouchers.findMany({
        where,
        skip,
        take: limitNum,
        select: baseSelect,
        orderBy: { start_at: 'desc' },
      }),
      prisma.vouchers.count({ where }),
    ]);

    return res.json({
      items: vouchers,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('listAdminVouchersController error:', error);
    return res.status(500).json({ message: 'listAdminVouchersController Internal server error' });
  }
}

export async function createAdminVoucherController(req: Request, res: Response) {
  try {
    const {
      code,
      type = 'PLATFORM',
      discount_type,
      discount_value,
      max_discount_amount,
      min_order_amount,
      usage_limit_per_user,
      usage_limit_total,
      start_at,
      end_at,
    } = req.body as Record<string, any>;

    const normalizedCode = String(code ?? '').trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json({ message: 'Vui lòng nhập mã voucher' });
    }

    const discountValueNumber = toNumberOrNull(discount_value);
    if (!discountValueNumber || discountValueNumber <= 0) {
      return res.status(400).json({ message: 'Giá trị giảm không hợp lệ' });
    }

    if (!['PERCENT', 'AMOUNT'].includes(String(discount_type).toUpperCase())) {
      return res.status(400).json({ message: 'discount_type phải là PERCENT hoặc AMOUNT' });
    }

    const startDate = parseDate(start_at);
    const endDate = parseDate(end_at);
    if (!startDate || !endDate || startDate >= endDate) {
      return res.status(400).json({ message: 'Thời gian hiệu lực không hợp lệ' });
    }

    // Find or create a special system seller for admin vouchers
    // Since schema requires seller_id, we use a system seller
    let systemSeller = await prisma.seller.findFirst({
      where: { email: 'system@admin.voucher' },
    });

    if (!systemSeller) {
      // Create system seller if doesn't exist
      systemSeller = await prisma.seller.create({
        data: {
          name: 'System Admin',
          email: 'system@admin.voucher',
          password: 'system', // Dummy password, this seller won't be used for login
          status: 'active',
        },
      });
    }

    const voucher = await prisma.vouchers.create({
      data: {
        code: normalizedCode,
        source: 'ADMIN',
        seller_id: systemSeller.id,
        type,
        discount_type: String(discount_type).toUpperCase(),
        discount_value: discountValueNumber,
        max_discount_amount: toNumberOrNull(max_discount_amount),
        min_order_amount: toNumberOrNull(min_order_amount),
        usage_limit_per_user: toNumberOrNull(usage_limit_per_user),
        usage_limit_total: toNumberOrNull(usage_limit_total),
        start_at: startDate,
        end_at: endDate,
        status: 'ACTIVE',
      },
      select: baseSelect,
    });
    

    return res.status(201).json({ voucher });
  } catch (error: any) {
    console.error('createAdminVoucherController error:', error);
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
    }
    return res.status(500).json({ message: 'createAdminVoucherController Internal server error' });
  }
}

