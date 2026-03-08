import { api } from './client';

export interface Voucher {
  id: string;
  code: string;
  source: 'ADMIN' | 'SELLER' | string;
  seller_id?: string | null;
  seller?: { name: string };
  type: string;
  discount_type: 'PERCENT' | 'AMOUNT' | string;
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  product_id?: string | null;
  applicable_user_id?: string | null;
  usage_limit_per_user?: number | null;
  usage_limit_total?: number | null;
  used_count?: number | null;
  start_at: string;
  end_at: string;
  status: string;
}

export interface UserVoucherEntry {
  id: string;
  voucher_id: string;
  saved_at: string | null;
  used_at?: string | null;
  usage_count: number;
  voucher: Voucher;
}

export async function fetchPublicVouchers(params?: { seller_id?: string; source?: string }) {
  const query = new URLSearchParams();
  if (params?.seller_id) query.append('seller_id', params.seller_id);
  if (params?.source) query.append('source', params.source);
  const qs = query.toString();
  return api<{ vouchers: Voucher[] }>(`/vouchers/public${qs ? `?${qs}` : ''}`);
}

export async function saveVoucher(voucherId: string, token: string) {
  return api<{ saved: UserVoucherEntry }>(`/vouchers/${voucherId}/save`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getUserVouchers(token: string) {
  return api<{ vouchers: UserVoucherEntry[] }>('/vouchers/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

