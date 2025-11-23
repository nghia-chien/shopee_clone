import type { ComplaintRecord, ComplaintStatus } from '../../../types/complaints';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export interface AdminComplaintFilters {
  status?: ComplaintStatus | '';
  type?: string;
  q?: string;
}

export async function fetchAdminComplaints(token: string, filters: AdminComplaintFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.q) params.set('q', filters.q);

  const search = params.toString();
  return request<{ complaints: ComplaintRecord[]; overview: Array<{ status: string; total: number }> }>(
    `/complaints/admin${search ? `?${search}` : ''}`,
    token
  );
}

export async function respondAdminComplaint(
  token: string,
  complaintId: string,
  payload: { status: ComplaintStatus; note?: string; notifyTarget?: 'USER' | 'SELLER' | 'BOTH' }
) {
  return request<{ complaint: ComplaintRecord }>(`/complaints/admin/${complaintId}/respond`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
