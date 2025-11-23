import type { ComplaintDraft, ComplaintRecord, ComplaintType } from '../../types/complaints';

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

export async function fetchUserComplaints(token: string): Promise<ComplaintRecord[]> {
  const data = await request<{ complaints: ComplaintRecord[] }>('/complaints/user', token);
  return data.complaints ?? [];
}

export async function createUserComplaint(token: string, payload: ComplaintDraft & { type: ComplaintType }) {
  return request<{ complaint: ComplaintRecord }>('/complaints/user', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addComplaintEvidence(token: string, complaintId: string, content: string) {
  return request<{ comment: any }>(`/complaints/user/${complaintId}/comments`, token, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
