"use client";

import { memo } from "react";

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface ImagePreviewProps {
  images: ImageFile[];
  onRemove: (id: string) => void;
  isDark?: boolean;
}

function ImagePreviewInner({ images, onRemove, isDark = false }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-2">
      {images.map((img) => (
        <div key={img.id} className={`relative w-20 h-20 rounded-lg overflow-hidden ${isDark ? "bg-[#1A1A1A]" : "bg-gray-100"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.previewUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* 삭제 버튼 */}
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50
                       flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="이미지 삭제"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="white"
              className="w-3 h-3"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

const ImagePreview = memo(ImagePreviewInner);
export default ImagePreview;

export type { ImageFile };
