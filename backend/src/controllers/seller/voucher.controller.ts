import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { SellerRequest } from '../../middlewares/authSeller';

const sellerVoucherSelect = {
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

export async function listSellerVouchersController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const vouchers = await prisma.vouchers.findMany({
      where: { seller_id },
      orderBy: { start_at: 'desc' },
      select: sellerVoucherSelect,
    });

    return res.json({ vouchers });
  } catch (error) {
    console.error('listSellerVouchersController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createSellerVoucherController(req: SellerRequest, res: Response) {
  try {
    const seller_id = req.seller?.id;
    if (!seller_id) return res.status(401).json({ message: 'Unauthorized' });

    const {
      code,
      type = 'SHOP',
      discount_type,
      discount_value,
      max_discount_amount,
      min_order_amount,
      product_id,
      usage_limit_per_user,
      usage_limit_total,
      start_at,
      end_at,
    } = req.body as Record<string, any>;

    const normalizedCode = String(code ?? '').trim().toUpperCase();
    if (!normalizedCode) {
      return res.status(400).json({ message: 'Vui lòng nhập mã voucher' });
    }

    if (!['PERCENT', 'AMOUNT'].includes(String(discount_type).toUpperCase())) {
      return res.status(400).json({ message: 'discount_type phải là PERCENT hoặc AMOUNT' });
    }

    const discountValueNumber = toNumberOrNull(discount_value);
    if (!discountValueNumber || discountValueNumber <= 0) {
      return res.status(400).json({ message: 'Giá trị giảm không hợp lệ' });
    }

    const startDate = parseDate(start_at);
    const endDate = parseDate(end_at);
    if (!startDate || !endDate || startDate >= endDate) {
      return res.status(400).json({ message: 'Thời gian hiệu lực không hợp lệ' });
    }

    const voucher = await prisma.vouchers.create({
      data: {
        code: normalizedCode,
        source: 'SELLER',
        seller_id,
        type,
        discount_type: String(discount_type).toUpperCase(),
        discount_value: discountValueNumber,
        max_discount_amount: toNumberOrNull(max_discount_amount),
        min_order_amount: toNumberOrNull(min_order_amount),
        product_id: product_id || null,
        usage_limit_per_user: toNumberOrNull(usage_limit_per_user),
        usage_limit_total: toNumberOrNull(usage_limit_total),
        start_at: startDate,
        end_at: endDate,
        status: 'ACTIVE',
      },
      select: sellerVoucherSelect,
    });

    return res.status(201).json({ voucher });
  } catch (error: any) {
    console.error('createSellerVoucherController error:', error);
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

