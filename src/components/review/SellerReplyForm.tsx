import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateReply } from '../../hooks/useReviews';
import { Send } from 'lucide-react';

interface SellerReplyFormProps {
  reviewId: string;
  onSuccess?: () => void;
}

export function SellerReplyForm({ reviewId, onSuccess }: SellerReplyFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const createReply = useCreateReply();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createReply.mutateAsync({ reviewId, content });
      setContent('');
      onSuccess?.();
    } catch (error) {
      console.error('Error replying to review:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('review.reply_placeholder')}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        rows={3}
        disabled={createReply.isPending}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || createReply.isPending}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition"
        >
          <Send className="w-4 h-4" />
          <span>{t('review.send_reply')}</span>
        </button>
      </div>
    </form>
  );
}

