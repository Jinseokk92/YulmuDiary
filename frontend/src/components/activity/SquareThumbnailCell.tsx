"use client";

import type { ReactNode } from "react";
import { darkPalette } from "@/lib/theme/darkPalette";

interface SquareThumbnailCellProps {
  onClick: () => void;
  ariaLabel: string;
  imageUrl?: string | null;
  text?: string | null;
  isDark: boolean;
  topLeftOverlay?: ReactNode;
  topRightOverlay?: ReactNode;
  emptyFallback?: ReactNode;
}

export function SquareThumbnailCell({
  onClick,
  ariaLabel,
  imageUrl,
  text,
  isDark,
  topLeftOverlay,
  topRightOverlay,
  emptyFallback,
}: SquareThumbnailCellProps) {
  return (
    <button
      className="relative block h-full w-full overflow-hidden focus:outline-none"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div
          className="flex h-full w-full items-end p-2.5"
          style={{ backgroundColor: isDark ? darkPalette.surfaceSecondary : "#f3f4f6" }}
        >
          {text ? (
            <p
              className="line-clamp-3 break-words text-left text-[11px] leading-snug"
              style={{ color: isDark ? darkPalette.textSecondary : "#6b7280" }}
            >
              {text}
            </p>
          ) : (
            emptyFallback ?? (
              <p
                className="line-clamp-3 break-words text-left text-[11px] leading-snug"
                style={{ color: isDark ? darkPalette.textSecondary : "#6b7280" }}
              >
                내용 없음
              </p>
            )
          )}
        </div>
      )}

      {topLeftOverlay ? <span className="absolute left-1.5 top-1.5">{topLeftOverlay}</span> : null}
      {topRightOverlay ? <span className="absolute right-1.5 top-1.5">{topRightOverlay}</span> : null}
    </button>
  );
}

export function SquareSkeletonCell({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="h-full w-full animate-pulse"
      style={{ backgroundColor: isDark ? darkPalette.surfaceSecondary : "#f3f4f6" }}
    />
  );
}
