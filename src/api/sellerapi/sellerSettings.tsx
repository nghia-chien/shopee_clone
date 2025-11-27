import { useSellerAuthStore } from '../../store/SellerAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export type SellerAddress = {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  district: string;
  ward: string;
  province_id?: number;
  district_id?: number;
  ward_code?: string;
};

export type SellerSettingsSuccessResponse = {
  seller: {
    id: string;
    name: string;
    email: string;
    phone_number?: string | null;
    avatar?: string | null;
    address?: SellerAddress | null;
    rating: number | null;
    status: string;
    updated_at: string;
  };
  security: {
    lastSensitiveUpdate?: string | null;
    requiresPassword: boolean;
    daysSinceLastUpdate: number | null;
    thresholdDays: number;
  };
  message?: string;
};

export type SellerSettingsResponse = SellerSettingsSuccessResponse | {
  message?: string;
  requiresPassword?: boolean;
};

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T;
};

const authHeaders = (hasJsonBody: boolean) => {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

async function authRequest<T>(path: string, options: RequestInit = {}, hasJsonBody = true): Promise<ApiResult<T>> {
  const headers = {
    ...authHeaders(hasJsonBody && !(options.body instanceof FormData)),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}

export type SellerProfileUpdatePayload = {
  name?: string;
  phone_number?: string;
  address?: SellerAddress | null;
  avatar?: string | null;
  password?: string;
};

export async function fetchSellerSettings() {
  return authRequest<SellerSettingsResponse>('/seller/settings/profile', { method: 'GET' }, false);
}

export async function updateSellerProfile(payload: SellerProfileUpdatePayload) {
  return authRequest<SellerSettingsResponse>(
    '/seller/settings/profile',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    true
  );
}

export async function changeSellerPassword(payload: { currentPassword: string; newPassword: string }) {
  return authRequest<{ ok?: boolean; message?: string }>(
    '/seller/settings/security/password',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    true
  );
}

export async function uploadSellerAvatar(file: File) {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_URL}/seller/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => null) as { url?: string; message?: string } | null;
  if (!res.ok || !data?.url) {
    throw new Error(data?.message ?? 'Không thể upload ảnh');
  }

  return data.url;
}

