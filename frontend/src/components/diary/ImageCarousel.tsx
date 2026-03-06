"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images } from "lucide-react";
import type { MediaDto } from "@/types";
import { getMediaUrl } from "@/lib/utils";

interface ImageCarouselProps {
  media: MediaDto[];
}

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
  const [direction, setDirection] = useState(0);

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
    <div>
      {/* ── 이미지 영역 ── */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springTransition}
            drag={isMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragDirectionLock
            dragElastic={{
              // 경계에서 저항감: 넘어갈 수 없는 방향은 0.05로 잠금
              left: isLast ? 0.05 : 0.2,
              right: isFirst ? 0.05 : 0.2,
            }}
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.x < -50 || velocity.x < -500) goNext();
              else if (offset.x > 50 || velocity.x > 500) goPrev();
            }}
            className="absolute inset-0 w-full h-full"
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
                (e.target as HTMLImageElement).parentElement!.style.backgroundColor = "#f3f4f6";
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* 우측 상단: 다중 이미지 배지 */}
        {isMultiple && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            {isFirst ? (
              <div className="bg-black/40 rounded-md p-1">
                <Images className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
            ) : (
              <span className="bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {activeIndex + 1}/{media.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 이미지 외부 하단: Dot 인디케이터 ── */}
      {isMultiple && (
        <div className="flex justify-center items-center gap-1.5 py-2">
          {media.map((_, i) => (
            <motion.span
              key={i}
              animate={{
                // 활성: primary-500(#e4701e), 비활성: gray-300
                backgroundColor: i === activeIndex ? "#e4701e" : "#d1d5db",
                // 활성: w-2 h-2(8px), 비활성: w-1.5 h-1.5(6px)
                width: i === activeIndex ? 8 : 6,
                height: i === activeIndex ? 8 : 6,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-full inline-block"
            />
          ))}
        </div>
      )}
    </div>
  );
}
