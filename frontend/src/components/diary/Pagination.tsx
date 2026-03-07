"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface PaginationProps {
  currentPage: number; // 1-based
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  // 페이지가 0개이면 숨김 (1페이지여도 표시)
  if (totalPages < 1) return null;

  // 현재 페이지 중심으로 최대 5개 표시
  const getPageNumbers = (): number[] => {
    const delta = 2;
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    const range: number[] = [];
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  };

  const pageNumbers = getPageNumbers();

  const btnBase =
    "flex items-center justify-center min-w-[46px] min-h-[46px] rounded-xl text-base font-semibold transition-colors select-none";

  const activeStyle = "bg-primary-500 text-white shadow-md";

  const inactiveStyle = isDark
    ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm";

  const disabledStyle = isDark
    ? "bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed"
    : "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed";

  const ellipsisStyle = isDark ? "text-slate-500" : "text-gray-400";

  return (
    <div className="flex items-center justify-center gap-2 py-6 flex-wrap">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${btnBase} px-4 text-lg ${currentPage <= 1 ? disabledStyle : inactiveStyle}`}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {/* 첫 페이지 + 줄임표 */}
      {pageNumbers[0] > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={`${btnBase} ${inactiveStyle}`}>
            1
          </button>
          {pageNumbers[0] > 2 && (
            <span className={`flex items-center justify-center min-w-[46px] min-h-[46px] text-lg ${ellipsisStyle}`}>
              …
            </span>
          )}
        </>
      )}

      {/* 페이지 번호 목록 */}
      {pageNumbers.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`${btnBase} ${p === currentPage ? activeStyle : inactiveStyle}`}
          aria-current={p === currentPage ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      {/* 줄임표 + 마지막 페이지 */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className={`flex items-center justify-center min-w-[46px] min-h-[46px] text-lg ${ellipsisStyle}`}>
              …
            </span>
          )}
          <button onClick={() => onPageChange(totalPages)} className={`${btnBase} ${inactiveStyle}`}>
            {totalPages}
          </button>
        </>
      )}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${btnBase} px-4 text-lg ${currentPage >= totalPages ? disabledStyle : inactiveStyle}`}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </div>
  );
}
