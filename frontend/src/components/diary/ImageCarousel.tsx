"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images } from "lucide-react";
import type { MediaDto } from "@/types";
import { getMediaUrl } from "@/lib/utils";

interface ImageCarouselProps {
  media: MediaDto[];
}

// 방향(direction)에 따른 슬라이드 진입/퇴장 variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
  }),
  center: {
    x: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
  }),
};

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

export default function ImageCarousel({ media }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  // 슬라이드 방향: +1 = 오른쪽→왼쪽(다음), -1 = 왼쪽→오른쪽(이전)
  const [direction, setDirection] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isMultiple = media.length > 1;
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === media.length - 1;

  const navigate = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex) return;
      setDirection(nextIndex > activeIndex ? 1 : -1);
      setActiveIndex(nextIndex);
    },
    [activeIndex]
  );

  const goNext = useCallback(() => {
    if (!isLast) navigate(activeIndex + 1);
  }, [activeIndex, isLast, navigate]);

  const goPrev = useCallback(() => {
    if (!isFirst) navigate(activeIndex - 1);
  }, [activeIndex, isFirst, navigate]);

  if (media.length === 0) return null;

  return (
    <>
      {/* 캐러셀 래퍼: aspect-square + overflow-hidden으로 슬라이드 경계 처리 */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">

        {/*
          AnimatePresence: key={activeIndex}로 슬라이드 전환 시 새 요소 마운트
          - 전체 컨테이너 이동 방식을 쓰지 않으므로 drag animate 충돌 없음
          - enter: 화면 밖에서 진입, exit: 화면 밖으로 퇴장 (동시 발생)
        */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springTransition}
            // ── 드래그 설정 ──────────────────────────────────────────────
            drag={isMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragDirectionLock            // 세로 스크롤과 충돌 방지
            dragElastic={{
              // 경계 이미지에서 저항감: 더 이상 이동할 수 없는 방향은 0.05로 제한
              left: isLast ? 0.05 : 0.2,
              right: isFirst ? 0.05 : 0.2,
            }}
            onDragEnd={(_, { offset, velocity }) => {
              // 드래그 거리(50px) 또는 플릭 속도(500px/s) 기준으로 전환
              if (offset.x < -50 || velocity.x < -500) goNext();
              else if (offset.x > 50 || velocity.x > 500) goPrev();
            }}
            // ── onTap: 드래그했으면 자동으로 fire되지 않음 (클릭과 드래그 분리) ──
            onTap={() => setLightboxOpen(true)}
            className="absolute inset-0 w-full h-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getMediaUrl(media[activeIndex].thumbnailUrl || media[activeIndex].url)}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.style.backgroundColor =
                  "#f3f4f6";
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* 우측 상단 인디케이터 (2장 이상) */}
        {isMultiple && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            {isFirst ? (
              // 첫 번째: 다중 이미지 아이콘 (인스타그램 스타일)
              <div className="bg-black/40 rounded-md p-1">
                <Images className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
            ) : (
              // 이후: n/m 숫자 배지
              <span className="bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {activeIndex + 1}/{media.length}
              </span>
            )}
          </div>
        )}

        {/* 하단 dots 인디케이터 (2장 이상) */}
        {isMultiple && (
          <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5 pointer-events-none">
            {media.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === activeIndex ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 전체화면 라이트박스 (클릭 시 원본 이미지) */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* 닫기 버튼 */}
            <button
              className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 원본 이미지 */}
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={getMediaUrl(media[activeIndex].url)}
              alt=""
              className="max-w-full max-h-[90vh] object-contain"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />

            {/* 이미지 카운터 */}
            {isMultiple && (
              <span className="absolute bottom-6 text-white/60 text-sm">
                {activeIndex + 1} / {media.length}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
