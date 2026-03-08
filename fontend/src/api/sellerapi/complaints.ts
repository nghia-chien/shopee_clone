import type {
  ComplaintDraft,
  ComplaintRecord,
  ComplaintStatus,
  ComplaintType,
} from '../../types/complaints';

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

export async function fetchSellerComplaints(token: string) {
  const data = await request<{ complaints: ComplaintRecord[] }>('/complaints/seller', token);
  return data.complaints ?? [];
}

export async function createSellerComplaint(
  token: string,
  payload: ComplaintDraft & { type: ComplaintType }
) {
  return request<{ complaint: ComplaintRecord }>('/complaints/seller', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function respondSellerComplaint(
  token: string,
  complaintId: string,
  body: { message: string; evidence?: string[]; status?: ComplaintStatus }
) {
  return request<{ complaint: ComplaintRecord }>(`/complaints/seller/${complaintId}/respond`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
