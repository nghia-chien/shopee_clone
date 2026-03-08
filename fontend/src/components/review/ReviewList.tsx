import { useState } from 'react';
import { useProductReviews } from '../../hooks/useReviews';
import { ReviewItem } from './ReviewItem';
import { useTranslation } from 'react-i18next';

interface ReviewListProps {
  productId: string;
  isSeller?: boolean;
}

export function ReviewList({ productId, isSeller = false }: ReviewListProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProductReviews(productId, page, 10);

  if (isLoading && page === 1) {
    return <div className="text-center py-8 text-gray-500">{t('review.loading')}</div>;
  }

  if (!data || data.reviews.length === 0) {
    return <div className="text-center py-8 text-gray-500">{t('review.no_reviews')}</div>;
  }

  const hasNextPage = page < data.pagination.totalPages;

  // Filter reviews để đảm bảo chỉ hiển thị reviews của product này
  const filteredReviews = data.reviews.filter((review) => review.product_id === productId);

  return (
    <div className="space-y-0">
      {filteredReviews.map((review) => (
        <ReviewItem key={review.id} review={review} isSeller={isSeller} />
      ))}

      {/* Pagination */}
      {hasNextPage && (
        <div className="text-center py-4">
          <button
            onClick={() => setPage(page + 1)}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition"
          >
            {isLoading ? t('review.loading') : t('review.load_more')}
          </button>
        </div>
      )}
    </div>
  );
}

