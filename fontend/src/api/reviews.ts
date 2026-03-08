import { api } from './userapi/client';
import { useAuthStore } from '../store/auth';
import { useSellerAuthStore } from '../store/SellerAuth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  seller_order_id?: string;
  rating: number;
  title?: string;
  content?: string;
  anonymous?: boolean;
  like_count?: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  product?: {
    id: string;
    title: string;
    images: string[];
  };
  review_replies?: ReviewReply[];
  review_media?: ReviewMedia[];
}

export interface ReviewReply {
  id: string;
  review_id: string;
  seller_id: string;
  content?: string;
  created_at: string;
  seller?: {
    id: string;
    name: string;
  };
}

export interface ReviewMedia {
  id: string;
  review_id: string;
  type: 'image' | 'video' | 'IMAGE' | 'VIDEO'; // Hỗ trợ cả uppercase và lowercase
  url: string;
  created_at: string;
}

export interface CreateReviewData {
  seller_order_id: string;
  product_id: string;
  rating: number;
  title?: string;
  content?: string;
  anonymous?: boolean;
  media?: File[];
}

/**
 * Tạo review mới (với media upload)
 */
export async function createReview(data: CreateReviewData): Promise<{ review: Review }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  const formData = new FormData();
  formData.append('seller_order_id', data.seller_order_id);
  formData.append('product_id', data.product_id);
  formData.append('rating', data.rating.toString());
  if (data.title) formData.append('title', data.title);
  if (data.content) formData.append('content', data.content);
  if (data.anonymous !== undefined) formData.append('anonymous', data.anonymous.toString());
  
  if (data.media && data.media.length > 0) {
    data.media.forEach((file) => {
      formData.append('media', file);
    });
  }

  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to create review');
  }

  return res.json();
}

/**
 * Lấy reviews của sản phẩm
 */
export async function getProductReviews(
  productId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  return api<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/products/${productId}/reviews?page=${page}&limit=${limit}`);
}

/**
 * Like/Unlike review
 */
export async function likeReview(reviewId: string): Promise<{ liked: boolean }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ liked: boolean }>(`/reviews/${reviewId}/like`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Lấy reviews của user
 */
export async function getUserReviews(): Promise<{ reviews: Review[] }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ reviews: Review[] }>('/reviews/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Update review
 */
export async function updateReview(
  reviewId: string,
  data: {
    rating?: number;
    title?: string;
    content?: string;
    anonymous?: boolean;
    media?: File[];
  }
): Promise<{ review: Review }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  const formData = new FormData();
  if (data.rating !== undefined) formData.append('rating', data.rating.toString());
  if (data.title !== undefined) formData.append('title', data.title);
  if (data.content !== undefined) formData.append('content', data.content);
  if (data.anonymous !== undefined) formData.append('anonymous', data.anonymous.toString());
  
  if (data.media && data.media.length > 0) {
    data.media.forEach((file) => {
      formData.append('media', file);
    });
  }

  const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update review');
  }

  return res.json();
}

/**
 * Delete review
 */
export async function deleteReview(reviewId: string): Promise<{ message: string }> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('User not authenticated');

  return api<{ message: string }>(`/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Lấy reviews cho seller
 */
export async function getSellerReviews(productId?: string): Promise<{ reviews: Review[] }> {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  const url = productId
    ? `/seller/reviews?product_id=${productId}`
    : '/seller/reviews';

  return api<{ reviews: Review[] }>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Seller reply review
 */
export async function replyReview(reviewId: string, content: string): Promise<{ reply: ReviewReply }> {
  const token = useSellerAuthStore.getState().token;
  if (!token) throw new Error('Seller not authenticated');

  return api<{ reply: ReviewReply }>(`/seller/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
}

/**
 * Lấy media của review
 */
export async function getReviewMedia(reviewId: string): Promise<{ media: ReviewMedia[] }> {
  return api<{ media: ReviewMedia[] }>(`/reviews/${reviewId}/media`);
}

