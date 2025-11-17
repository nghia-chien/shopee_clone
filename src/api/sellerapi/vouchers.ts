import { useSellerAuthStore } from '../../store/SellerAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface SellerVoucherPayload {
  code: string;
  type?: string;
  discount_type: 'PERCENT' | 'AMOUNT';
  discount_value: number;
  max_discount_amount?: number | '';
  min_order_amount?: number | '';
  product_id?: string;
  usage_limit_per_user?: number | '';
  usage_limit_total?: number | '';
  start_at: string;
  end_at: string;
}

export async function listSellerVouchers() {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  const res = await fetch(`${API_URL}/seller/voucher`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Không thể tải voucher');
  return res.json() as Promise<{ vouchers: any[] }>;
}

export async function createSellerVoucher(payload: SellerVoucherPayload) {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  const res = await fetch(`${API_URL}/seller/voucher`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || 'Không thể tạo voucher');
  }
  return res.json();
}

