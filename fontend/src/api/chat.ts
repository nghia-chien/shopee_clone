import { api } from './userapi/client';
import { useAuthStore } from '../store/auth';
import { useSellerAuthStore } from '../store/SellerAuth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export interface ChatThread {
  id: string;
  user_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    name: string;
    avatar: string;
  };
  user?: {
    id: string;
    name: string;
    avatar: string;
  };
  messages?: Message[];
}

export interface Message {
  id: string;
  thread_id: string;
  user_id?: string;
  seller_id?: string;
  sender_type: 'USER' | 'SELLER' | 'SYSTEM';
  content: string;
  attachments?: any;
  status: string;
  pinned?: boolean;
  order_id?: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SystemMessageContent {
  type: 'order_update';
  orderId: string;
  orderName: string;
  price: string;
  image: string | null;
  status: string;
  statusCode: string;
}

/**
 * Lấy danh sách thread của user
 */
export async function getUserThreads(): Promise<{ threads: ChatThread[] }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ threads: ChatThread[] }>('/chat/threads/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Lấy danh sách thread của seller
 */
export async function getSellerThreads(): Promise<{ threads: ChatThread[] }> {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  return api<{ threads: ChatThread[] }>('/chat/threads/seller', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Tạo thread mới hoặc trả về thread đã tồn tại
 */
export async function createThread(sellerId: string): Promise<{ thread: ChatThread }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ thread: ChatThread }>('/chat/threads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sellerId }),
  });
}

/**
 * Gửi tin nhắn (user)
 */
export async function sendUserMessage(
  threadId: string,
  content: string,
  attachments?: any
): Promise<{ message: Message }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ message: Message }>('/chat/message', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      threadId,
      content,
      attachments,
    }),
  });
}

/**
 * Gửi tin nhắn (seller)
 */
export async function sendSellerMessage(
  threadId: string,
  content: string,
  attachments?: any
): Promise<{ message: Message }> {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  return api<{ message: Message }>('/chat/message/seller', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      threadId,
      content,
      attachments,
    }),
  });
}

/**
 * Lấy tin nhắn trong thread (user)
 */
export async function getUserMessages(
  threadId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/chat/messages/${threadId}?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Lấy tin nhắn trong thread (seller)
 */
export async function getSellerMessages(
  threadId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  return api<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/chat/messages/${threadId}/seller?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Parse system message content
 */
export function parseSystemMessage(content: string): SystemMessageContent | null {
  try {
    return JSON.parse(content) as SystemMessageContent;
  } catch {
    return null;
  }
}

