import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Heart, MessageSquare } from 'lucide-react';
import { useLikeReview } from '../../hooks/useReviews';
import { useAuthStore } from '../../store/auth';
import type { Review } from '../../api/reviews';
import { ReviewMediaGallery } from './ReviewMediaGallery';
import { SellerReplyForm } from './SellerReplyForm';

interface ReviewItemProps {
  review: Review;
  isSeller?: boolean;
}

export function ReviewItem({ review, isSeller = false }: ReviewItemProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const likeReview = useLikeReview();
  const [showReplyForm, setShowReplyForm] = useState(false);

  const isLiked = false; // TODO: Check if user liked this review
  const canLike = !!user && user.id !== review.user_id;
  const canReply = isSeller && !review.review_replies?.length;

  const handleLike = async () => {
    if (!canLike) return;
    try {
      await likeReview.mutateAsync(review.id);
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  return (
    <div className="border-b border-gray-200 py-4">
      {/* User Info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
          {review.anonymous
            ? '?'
            : review.user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              {review.anonymous ? t('review.anonymous') : review.user?.name || t('review.user')}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          {review.title && (
            <div className="font-semibold text-gray-900 mb-1">{review.title}</div>
          )}
          {review.content && (
            <div className="text-gray-700 text-sm mb-2">{review.content}</div>
          )}
          <div className="text-xs text-gray-500">
            {new Date(review.created_at).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Media Gallery */}
      {review.review_media && review.review_media.length > 0 && (
        <div className="mb-3">
          <ReviewMediaGallery media={review.review_media} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={handleLike}
          disabled={!canLike || likeReview.isPending}
          className={`flex items-center gap-1 text-sm transition ${
            isLiked
              ? 'text-red-500'
              : 'text-gray-600 hover:text-red-500'
          } ${!canLike ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{review.like_count || 0}</span>
        </button>

        {canReply && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-500 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('review.reply')}</span>
          </button>
        )}
      </div>

      {/* Seller Reply */}
      {review.review_replies && review.review_replies.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-orange-500 bg-orange-50 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-orange-600">
              {t('review.seller_replied')}
            </span>
            <span className="text-xs text-gray-600">
              {review.review_replies[0].seller?.name}
            </span>
          </div>
          <div className="text-sm text-gray-700">{review.review_replies[0].content}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(review.review_replies[0].created_at).toLocaleDateString('vi-VN')}
          </div>
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <div className="mt-3">
          <SellerReplyForm
            reviewId={review.id}
            onSuccess={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  );
}

