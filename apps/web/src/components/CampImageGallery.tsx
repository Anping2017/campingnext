'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CampImageGalleryProps {
  images: string[];
  coverImage?: string;
}

export default function CampImageGallery({ images, coverImage }: CampImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const allImages = coverImage ? [coverImage, ...images] : images;

  if (allImages.length === 0) {
    return (
      <div className="w-full h-64 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-white">
        <span className="text-lg">暂无图片</span>
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-4">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {allImages.map((image, index) => (
            <div
              key={index}
              className="w-full h-64 md:h-96 flex-shrink-0 relative cursor-pointer"
              onClick={() => setIsFullscreen(true)}
            >
              <img
                src={image}
                alt={`营地图片 ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = document.createElement('div');
                  placeholder.className = 'w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white';
                  placeholder.innerHTML = '<span>暂无图片</span>';
                  target.parentElement?.appendChild(placeholder);
                }}
              />
            </div>
          ))}
        </div>

        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 缩略图 */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentIndex ? 'border-green-600' : 'border-transparent'
              }`}
            >
              <img
                src={image}
                alt={`缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = document.createElement('div');
                  placeholder.className = 'w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs';
                  placeholder.innerHTML = '<span>无图</span>';
                  target.parentElement?.appendChild(placeholder);
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* 全屏查看 */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={allImages[currentIndex]}
            alt="全屏查看"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

