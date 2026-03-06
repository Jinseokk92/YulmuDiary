"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { MediaDto } from "@/types";
import { getMediaUrl } from "@/lib/utils";

interface ImageCarouselProps {
  media: MediaDto[];
}

// 인스타그램 스타일 다중 이미지 레이어 아이콘
function MultipleImagesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="white"
      className="w-5 h-5 drop-shadow"
    >
      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      <path
        fill="rgba(255,255,255,0.4)"
        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H6zm0 2h12v12H6V4z"
      />
    </svg>
  );
}

export default function ImageCarousel({ media }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isMultiple = media.length > 1;

  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(i + 1, media.length - 1));
  }, [media.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(i - 1, 0));
  }, []);

  if (media.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden">
      {/* 슬라이드 컨테이너 — framer-motion drag */}
      <motion.div
        className="flex"
        animate={{ x: `-${activeIndex * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        drag={isMultiple ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        dragDirectionLock
        onDragEnd={(_, info) => {
          // 50px 이상 스와이프해야 슬라이드 전환
          if (info.offset.x < -50) goNext();
          else if (info.offset.x > 50) goPrev();
        }}
      >
        {media.map((m) => (
          <div key={m.id} className="w-full shrink-0">
            <div className="relative w-full aspect-square bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(m.thumbnailUrl || m.url)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.style.backgroundColor = "#f3f4f6";
                }}
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* 우측 상단 인디케이터 (2장 이상) */}
      {isMultiple && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {/* 첫 번째 슬라이드: 레이어 아이콘 */}
          {activeIndex === 0 ? (
            <MultipleImagesIcon />
          ) : (
            /* 두 번째 이후: n/m 숫자 배지 */
            <span className="bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {activeIndex + 1}/{media.length}
            </span>
          )}
        </div>
      )}

      {/* 하단 dots 인디케이터 (2장 이상) */}
      {isMultiple && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {media.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? "w-2 h-2 bg-white"
                  : "w-1.5 h-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
