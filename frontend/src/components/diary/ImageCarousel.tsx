"use client";

import { useState, useCallback, useRef } from "react";
import type { MediaDto } from "@/types";
import { getMediaUrl } from "@/lib/utils";

interface ImageCarouselProps {
  media: MediaDto[];
}

export default function ImageCarousel({ media }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, []);

  if (media.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* 스크롤 영역 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {media.map((m) => (
          <div key={m.id} className="w-full shrink-0 snap-center">
            <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(m.thumbnailUrl || m.url)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.style.backgroundColor = "#f3f4f6";
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 인디케이터 dots */}
      {media.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {media.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === activeIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* 현재 위치 카운터 (3장 이상일 때) */}
      {media.length > 2 && (
        <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
          {activeIndex + 1}/{media.length}
        </span>
      )}
    </div>
  );
}
