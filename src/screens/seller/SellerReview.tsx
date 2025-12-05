import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSellerReviews } from '../../hooks/useReviews';
import { ReviewItem } from '../../components/review/ReviewItem';
import { Star, Filter, MessageSquare } from 'lucide-react';

export const SellerReview = () => {
  const { t } = useTranslation();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [filterReplied, setFilterReplied] = useState<'all' | 'replied' | 'not_replied'>('all');

  // Lấy reviews của seller (để extract danh sách sản phẩm)
  const { data: allReviewsData } = useSellerReviews(undefined);

  // Extract danh sách sản phẩm unique từ reviews
  const productsFromReviews = allReviewsData?.reviews
    ? Array.from(
        new Map(
          allReviewsData.reviews
            .filter((review) => review.product)
            .map((review) => [review.product_id, review.product])
        ).values()
      )
    : [];

  // Lấy reviews của seller
  const { data: reviewsData, isLoading } = useSellerReviews(selectedProductId);

  const reviews = reviewsData?.reviews || [];

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (filterReplied === 'replied') {
      return review.review_replies && review.review_replies.length > 0;
    }
    if (filterReplied === 'not_replied') {
      return !review.review_replies || review.review_replies.length === 0;
    }
    return true;
  });

  // Tính toán thống kê
  const stats = {
    total: reviews.length,
    replied: reviews.filter((r) => r.review_replies && r.review_replies.length > 0).length,
    notReplied: reviews.filter((r) => !r.review_replies || r.review_replies.length === 0).length,
    avgRating:
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{ 'Đánh giá sản phẩm'}</h1>
        <p className="text-sm text-gray-600 mt-1">
          { 'Quản lý và phản hồi đánh giá từ khách hàng'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-600">{ 'Tổng đánh giá'}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-600">{'Đánh giá trung bình'}</div>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.avgRating.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-600">{ 'Đã phản hồi'}</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.replied}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-600">{ 'Chưa phản hồi'}</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.notReplied}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              { 'Lọc:'}
            </span>
          </div>

          {/* Product Filter */}
          <div>
            <select
              value={selectedProductId || ''}
              onChange={(e) => setSelectedProductId(e.target.value || undefined)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">{ 'Tất cả sản phẩm'}</option>
              {productsFromReviews.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </div>

          {/* Reply Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterReplied('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterReplied === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {'Tất cả'}
            </button>
            <button
              onClick={() => setFilterReplied('replied')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterReplied === 'replied'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              { 'Đã phản hồi'}
            </button>
            <button
              onClick={() => setFilterReplied('not_replied')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterReplied === 'not_replied'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              { 'Chưa phản hồi'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg border shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            {t('review.loading') || 'Đang tải...'}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>{t('review.no_reviews') || 'Chưa có đánh giá nào'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-4">
                <ReviewItem review={review} isSeller={true} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
