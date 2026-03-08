import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserThreads,
  getSellerThreads,
  createThread,
  sendUserMessage,
  sendSellerMessage,
  getUserMessages,
  getSellerMessages,
  type ChatThread,
  type Message,
} from '../api/chat';
import { useAuthStore } from '../store/auth';
import { useSellerAuthStore } from '../store/SellerAuth';

/**
 * Hook để lấy danh sách thread của user
 */
export function useUserThreads() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['chat', 'threads', 'user'],
    queryFn: getUserThreads,
    enabled: !!token,
  });
}

/**
 * Hook để lấy danh sách thread của seller
 */
export function useSellerThreads() {
  const { token } = useSellerAuthStore();

  return useQuery({
    queryKey: ['chat', 'threads', 'seller'],
    queryFn: getSellerThreads,
    enabled: !!token,
  });
}

/**
 * Hook để tạo thread mới
 */
export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sellerId: string) => createThread(sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
    },
  });
}

/**
 * Hook để gửi tin nhắn (user)
 */
export function useSendUserMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, content, attachments }: { threadId: string; content: string; attachments?: any }) =>
      sendUserMessage(threadId, content, attachments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
    },
  });
}

/**
 * Hook để gửi tin nhắn (seller)
 */
export function useSendSellerMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, content, attachments }: { threadId: string; content: string; attachments?: any }) =>
      sendSellerMessage(threadId, content, attachments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'threads'] });
    },
  });
}

/**
 * Hook để lấy tin nhắn trong thread (user)
 */
export function useUserMessages(threadId: string | null, page: number = 1, limit: number = 50) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['chat', 'messages', threadId, page, limit],
    queryFn: () => getUserMessages(threadId!, page, limit),
    enabled: !!token && !!threadId,
  });
}

/**
 * Hook để lấy tin nhắn trong thread (seller)
 */
export function useSellerMessages(threadId: string | null, page: number = 1, limit: number = 50) {
  const { token } = useSellerAuthStore();

  return useQuery({
    queryKey: ['chat', 'messages', 'seller', threadId, page, limit],
    queryFn: () => getSellerMessages(threadId!, page, limit),
    enabled: !!token && !!threadId,
  });
}

