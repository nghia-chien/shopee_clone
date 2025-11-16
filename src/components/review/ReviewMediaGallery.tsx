import { useState } from 'react';
import type { ReviewMedia } from '../../api/reviews';

interface ReviewMediaGalleryProps {
  media: ReviewMedia[];
}

export function ReviewMediaGallery({ media }: ReviewMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!media || media.length === 0) return null;

  // Helper function để kiểm tra type
  const isImage = (type: string | undefined): boolean => {
    if (!type) return false;
    const normalizedType = type.toUpperCase();
    return normalizedType === 'IMAGE';
  };

  const isVideo = (type: string | undefined): boolean => {
    if (!type) return false;
    const normalizedType = type.toUpperCase();
    return normalizedType === 'VIDEO';
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {media.map((item, index) => {
          const isImageType = isImage(item.type);
          const isVideoType = isVideo(item.type);
          
          return (
            <div
              key={item.id}
              className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
              onClick={() => setSelectedIndex(index)}
            >
              {isImageType ? (
                <img
                  src={item.url}
                  alt={`Review media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : isVideoType ? (
                <>
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    controls={false}
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={`Review media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for full view */}
      {selectedIndex !== null && selectedIndex < media.length && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {isImage(media[selectedIndex].type) ? (
              <img
                src={media[selectedIndex].url}
                alt={`Review media ${selectedIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded"
              />
            ) : isVideo(media[selectedIndex].type) ? (
              <video
                src={media[selectedIndex].url}
                className="max-w-full max-h-[90vh] rounded"
                controls
                autoPlay
                preload="auto"
              />
            ) : (
              <img
                src={media[selectedIndex].url}
                alt={`Review media ${selectedIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded"
              />
            )}
          </div>
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

