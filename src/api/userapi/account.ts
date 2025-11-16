import { api } from './client';
import { useAuthStore } from '../../store/auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export interface User {
  id: string;
  email: string;
  phone_number?: string | null;
  name?: string | null;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  district: string;
  ward: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lấy thông tin user hiện tại
 */
export async function getAccount(): Promise<User> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<User>('/account', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Cập nhật thông tin user
 */
export async function updateAccount(data: {
  name?: string;
  phone_number?: string;
  password: string; // Required để xác thực
}): Promise<User> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<User>('/account', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Upload avatar
 */
export async function uploadAvatar(file: File, password: string): Promise<User> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  const formData = new FormData();
  formData.append('avatar', file);
  formData.append('password', password);

  const res = await fetch(`${API_URL}/account/avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to upload avatar');
  }

  return res.json();
}

/**
 * Đổi mật khẩu
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ message: string }>('/account/password', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Lấy danh sách địa chỉ
 */
export async function getAddresses(): Promise<{ addresses: Address[] }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ addresses: Address[] }>('/account/addresses', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Thêm địa chỉ mới
 */
export async function createAddress(data: {
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  district: string;
  ward: string;
  is_default?: boolean;
}): Promise<{ address: Address }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ address: Address }>('/account/addresses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Cập nhật địa chỉ
 */
export async function updateAddress(
  id: string,
  data: {
    full_name?: string;
    phone?: string;
    address_line?: string;
    city?: string;
    district?: string;
    ward?: string;
    is_default?: boolean;
  }
): Promise<{ address: Address }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ address: Address }>(`/account/addresses/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Xóa địa chỉ
 */
export async function deleteAddress(id: string): Promise<{ message: string }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ message: string }>(`/account/addresses/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Đặt địa chỉ mặc định
 */
export async function setDefaultAddress(id: string): Promise<{ address: Address }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ address: Address }>(`/account/addresses/${id}/default`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

