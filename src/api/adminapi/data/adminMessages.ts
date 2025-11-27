import { useAdminAuthStore } from '../../../store/AdminAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface AdminMessageFilters {
  page?: number;
  limit?: number;
  search?: string;
  threadId?: string;
  userId?: string;
  sellerId?: string;
}

export interface AdminThreadFilters {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  sellerId?: string;
}

export interface Thread {
  id: string;
  user_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  seller: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  messages: Array<{
    id: string;
    content: string | null;
    created_at: string;
    sender_type: string;
  }>;
  _count: {
    messages: number;
  };
}

export interface Message {
  id: string;
  thread_id: string;
  user_id: string | null;
  seller_id: string | null;
  content: string | null;
  attachments: any;
  status: string;
  pinned: boolean | null;
  created_at: string;
  sender_type: string;
  order_id: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
  seller: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  chat_threads?: {
    id: string;
    user_id: string;
    seller_id: string;
    user?: {
      id: string;
      name: string | null;
      email: string;
    };
    seller?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export async function getAllAdminThreads(filters: AdminThreadFilters = {}) {
  const token = useAdminAuthStore.getState().token;
  if (!token) throw new Error('Admin not authenticated');

  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.sellerId) params.append('sellerId', filters.sellerId);

  const res = await fetch(`${API_URL}/admin/messages/threads?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Không thể tải danh sách cuộc trò chuyện');
  return res.json() as Promise<{ items: Thread[]; total: number; pagination: any }>;
}

export async function getAdminThreadById(threadId: string, page = 1, limit = 50) {
  const token = useAdminAuthStore.getState().token;
  if (!token) throw new Error('Admin not authenticated');

  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const res = await fetch(`${API_URL}/admin/messages/threads/${threadId}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Không thể tải cuộc trò chuyện');
  return res.json() as Promise<{
    thread: Thread;
    messages: Message[];
    pagination: any;
  }>;
}

export async function getAllAdminMessages(filters: AdminMessageFilters = {}) {
  const token = useAdminAuthStore.getState().token;
  if (!token) throw new Error('Admin not authenticated');

  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.threadId) params.append('threadId', filters.threadId);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.sellerId) params.append('sellerId', filters.sellerId);

  const res = await fetch(`${API_URL}/admin/messages?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Không thể tải tin nhắn');
  return res.json() as Promise<{ items: Message[]; total: number; pagination: any }>;
}

export async function getAdminMessageById(messageId: string) {
  const token = useAdminAuthStore.getState().token;
  if (!token) throw new Error('Admin not authenticated');

  const res = await fetch(`${API_URL}/admin/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Không thể tải tin nhắn');
  return res.json() as Promise<{ message: Message }>;
}

export async function deleteAdminMessage(messageId: string) {
  const token = useAdminAuthStore.getState().token;
  if (!token) throw new Error('Admin not authenticated');

  const res = await fetch(`${API_URL}/admin/messages/${messageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Không thể xóa tin nhắn');
  }
  return res.json();
}

