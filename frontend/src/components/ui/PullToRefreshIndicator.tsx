"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface PullToRefreshIndicatorProps {
  pullY: number;
  isRefreshing: boolean;
  progress: number;
}

export default function PullToRefreshIndicator({
  pullY,
  isRefreshing,
  progress,
}: PullToRefreshIndicatorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (pullY <= 0 && !isRefreshing) return null;

  const isDark = mounted && resolvedTheme === "dark";
  // 라이트: gray-400 / 다크: slate-400 — 배경 대비 확보
  const spinnerColor = isDark ? "#94a3b8" : "#9ca3af";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: `${pullY}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <svg
        className="ptr-spinner"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={spinnerColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{
          opacity: isRefreshing ? 0.85 : progress * 0.9,
          animation: isRefreshing ? undefined : "none",
          transform: isRefreshing ? undefined : `rotate(${progress * 270}deg)`,
        }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  );
}
