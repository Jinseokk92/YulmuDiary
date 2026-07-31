"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className={`animate-pulse rounded ${isDark ? "bg-[#262626]" : "bg-gray-200"} ${className}`}
      aria-hidden="true"
    />
  );
}
