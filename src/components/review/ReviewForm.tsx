import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateReview } from '../../hooks/useReviews';
import { Star, X, Upload } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  sellerOrderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, sellerOrderId, onSuccess, onCancel }: ReviewFormProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const createReview = useCreateReview();

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 5) {
      alert(t('review.max_media_files'));
      return;
    }

    const newFiles = [...mediaFiles, ...files];
    setMediaFiles(newFiles);

    // Create previews
    const newPreviews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === files.length) {
          setMediaPreviews([...mediaPreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      alert(t('review.rating_required'));
      return;
    }

    try {
      await createReview.mutateAsync({
        seller_order_id: sellerOrderId,
        product_id: productId,
        rating,
        title: title || undefined,
        content: content || undefined,
        anonymous,
        media: mediaFiles.length > 0 ? mediaFiles : undefined,
      });
      onSuccess?.();
    } catch (error: any) {
      alert(error.message || t('review.create_error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold">{t('review.write_review')}</h3>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('review.rating')} *
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200 hover:fill-yellow-200'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('review.title')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder={t('review.title_placeholder')}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('review.content')}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows={4}
          placeholder={t('review.content_placeholder')}
        />
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('review.media')} ({mediaFiles.length}/5)
        </label>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <Upload className="w-4 h-4" />
            <span className="text-sm">{t('review.upload_media')}</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="hidden"
              disabled={mediaFiles.length >= 5}
            />
          </label>
        </div>
        {mediaPreviews.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {mediaPreviews.map((preview, index) => {
              const file = mediaFiles[index];
              const isVideo = file?.type?.startsWith('video/');
              return (
                <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  {isVideo ? (
                    <video
                      src={preview}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Anonymous */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="anonymous"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
        />
        <label htmlFor="anonymous" className="text-sm text-gray-700">
          {t('review.anonymous')}
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            {t('review.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={rating < 1 || createReview.isPending}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {createReview.isPending ? t('review.submitting') : t('review.submit')}
        </button>
      </div>
    </form>
  );
}

