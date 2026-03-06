"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Images } from "lucide-react";
import type { MediaDto } from "@/types";
import { getMediaUrl } from "@/lib/utils";

interface ImageCarouselProps {
  media: MediaDto[];
  diaryId: number;
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

export default function ImageCarousel({ media, diaryId }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

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
            key={`${diaryId}-${activeIndex}`}
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
              left: isLast ? 0.05 : 0.3,
              right: isFirst ? 0.05 : 0.3,
            }}
            onDragEnd={(_, { offset, velocity }) => {
              const swipePower = Math.abs(offset.x) * Math.abs(velocity.x);
              if (swipePower > 8000 || offset.x < -60) goNext();
              else if (swipePower > 8000 || offset.x > 60) goPrev();
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          >
            {imgErrors[activeIndex] ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Images className="w-8 h-8 text-gray-300" />
              </div>
            ) : (
              <Image
                src={getMediaUrl(media[activeIndex].thumbnailUrl || media[activeIndex].url)}
                alt=""
                fill
                draggable={false}
                className="object-cover pointer-events-none select-none"
                sizes="(max-width: 512px) 100vw, 512px"
                onError={() => setImgErrors((prev) => ({ ...prev, [activeIndex]: true }))}
              />
            )}
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
              onClick={() => navigate(i)}
              animate={{
                backgroundColor: i === activeIndex ? "#e4701e" : "#d1d5db",
                width: i === activeIndex ? 8 : 6,
                height: i === activeIndex ? 8 : 6,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-full inline-block cursor-pointer"
            />
          ))}
        </div>
      )}
    </div>
  );
}
