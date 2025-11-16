import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createReview,
  getProductReviews,
  likeReview,
  getUserReviews,
  updateReview,
  deleteReview,
  getSellerReviews,
  replyReview,
  type CreateReviewData,
} from '../api/reviews';
import { useAuthStore } from '../store/auth';
import { useSellerAuthStore } from '../store/SellerAuth';

/**
 * Hook để lấy reviews của sản phẩm
 */
export function useProductReviews(productId: string | null, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['reviews', 'product', productId, page, limit],
    queryFn: () => getProductReviews(productId!, page, limit),
    enabled: !!productId,
  });
}

/**
 * Hook để tạo review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewData) => createReview(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'product', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.product_id] });
    },
  });
}

/**
 * Hook để like/unlike review
 */
export function useLikeReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => likeReview(reviewId),
    onSuccess: (_, reviewId) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

/**
 * Hook để lấy reviews của user
 */
export function useUserReviews() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['reviews', 'user'],
    queryFn: getUserReviews,
    enabled: !!token,
  });
}

/**
 * Hook để update review
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: Parameters<typeof updateReview>[1] }) =>
      updateReview(reviewId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

/**
 * Hook để delete review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

/**
 * Hook để lấy reviews cho seller
 */
export function useSellerReviews(productId?: string) {
  const { token } = useSellerAuthStore();

  return useQuery({
    queryKey: ['reviews', 'seller', productId],
    queryFn: () => getSellerReviews(productId),
    enabled: !!token,
  });
}

/**
 * Hook để seller reply review
 */
export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: string; content: string }) =>
      replyReview(reviewId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

