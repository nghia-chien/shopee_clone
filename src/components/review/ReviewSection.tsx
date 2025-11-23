import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { useAuthStore } from '../../store/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/userapi/client';
import { ComplaintModal } from '../complaints/ComplaintModal';
import type { ComplaintDraft } from '../../types/complaints';

interface ReviewSectionProps {
  productId: string;
  sellerId: string;
}

export function ReviewSection({ productId, sellerId }: ReviewSectionProps) {
  const { t } = useTranslation();
  const { user, token } = useAuthStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedSellerOrderId, setSelectedSellerOrderId] = useState<string | null>(null);
  const [complaintDraft, setComplaintDraft] = useState<ComplaintDraft | null>(null);

  // Lấy các seller_order completed của user cho product này
  const { data: completedOrders } = useQuery({
    queryKey: ['completed-orders', productId, sellerId],
    queryFn: async () => {
      if (!token) return [];
      try {
        const response = await api<{ items: any[] }>('/orders/all', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Filter completed seller_orders for this product
        const completed: any[] = [];
        response.items?.forEach((order: any) => {
          if (order.seller_order && Array.isArray(order.seller_order)) {
            order.seller_order.forEach((so: any) => {
              if (so.seller_status === 'completed' && so.seller_id === sellerId) {
                // Check if order contains this product
                const hasProduct = order.order_item?.some(
                  (item: any) => item.product_id === productId
                );
                if (hasProduct) {
                  completed.push({
                    id: so.id,
                    seller_order_id: so.id,
                    order_id: order.id,
                    hasReview: false, // TODO: Check if review exists for this seller_order_id
                  });
                }
              }
            });
          }
        });
        return completed;
      } catch (error) {
        console.error('Error fetching completed orders:', error);
        return [];
      }
    },
    enabled: !!token && !!user && !!productId && !!sellerId,
  });

  const canReview = completedOrders && completedOrders.length > 0 && !showReviewForm;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t('review.reviews')}</h2>
        <div className="flex gap-2">
          {canReview && (
            <button
              onClick={() => {
                setSelectedSellerOrderId(completedOrders[0].id);
                setShowReviewForm(true);
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              {t('review.write_review')}
            </button>
          )}
          <button
            onClick={() =>
              setComplaintDraft({
                type: 'PRODUCT_SHOP',
                seller_id: sellerId,
                product_id: productId,
                meta: {
                  issueCode: 'PRODUCT_DEFECT',
                  reason: 'Sản phẩm lỗi / khác mô tả',
                  channel: 'REVIEW',
                  context: { sellerId, productId },
                  autoFill: { source: 'review-section' },
                },
              })
            }
            className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
          >
            Báo cáo shop
          </button>
        </div>
      </div>

      {showReviewForm && selectedSellerOrderId && (
        <div className="mb-6">
          <ReviewForm
            productId={productId}
            sellerOrderId={selectedSellerOrderId}
            onSuccess={() => {
              setShowReviewForm(false);
              setSelectedSellerOrderId(null);
            }}
            onCancel={() => {
              setShowReviewForm(false);
              setSelectedSellerOrderId(null);
            }}
          />
        </div>
      )}

      <ReviewList productId={productId} />

      <ComplaintModal
        actor="USER"
        open={!!complaintDraft}
        defaultValues={complaintDraft ?? undefined}
        onClose={() => setComplaintDraft(null)}
        onSuccess={() => setComplaintDraft(null)}
      />
    </div>
  );
}

