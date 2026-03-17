"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface DatePickerSheetProps {
  value: string;          // "YYYY-MM-DD"
  onChange: (date: string) => void;
  onClose: () => void;
  isDark: boolean;
  lockBody?: boolean;
  maxDate?: string;
}

export default function DatePickerSheet({
  value,
  onChange,
  onClose,
  isDark,
  lockBody = true,
  maxDate,
}: DatePickerSheetProps) {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const safeValue = value && (!maxDate || value <= maxDate) ? value : maxDate;
  const initDate = safeValue ? new Date(safeValue.replace(/-/g, "/")) : today;
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth() + 1);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // 바텀시트 열릴 때 body 스크롤 고정 (iOS Safari 포함)
  useEffect(() => {
    if (!lockBody) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    const preventTouchMove = (e: TouchEvent) => { e.preventDefault(); };
    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventTouchMove);
      window.scrollTo(0, scrollY);
    };
  }, [lockBody]);

  if (!mounted) return null;

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth - 1, 1).getDay();
  const totalCells  = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };
  const maxMonthKey = maxDate ? maxDate.slice(0, 7) : null;
  const viewMonthKey = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
  const canGoNext = !maxMonthKey || viewMonthKey < maxMonthKey;

  // ── 색상 ─────────────────────────────────────────────
  const sheetBg     = isDark ? "#1e293b" : "#ffffff";
  const borderColor = isDark ? "#334155" : "#f3f4f6";
  const headerText  = isDark ? "#f1f5f9" : "#111827";
  const handleBg    = isDark ? "#475569" : "#e5e7eb";
  const navHover    = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const cancelBg    = isDark ? "rgba(255,255,255,0.05)" : "#f9fafb";
  const cancelText  = isDark ? "#94a3b8" : "#6b7280";

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex flex-col justify-end">
        {/* 오버레이 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
          style={{ background: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)" }}
          onClick={onClose}
        />

        {/* 바텀 시트 */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
          className="relative rounded-t-3xl px-4 pt-3 pb-10"
          style={{
            background: sheetBg,
            borderTop: `1px solid ${borderColor}`,
            boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
            maxWidth: 480,
            width: "100%",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {/* 핸들 */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-1 rounded-full" style={{ background: handleBg }} />
          </div>

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-5 px-1">
            <button
              onClick={prevMonth}
              className="flex items-center justify-center w-9 h-9 rounded-2xl transition-colors"
              style={{ color: headerText }}
              onMouseEnter={e => (e.currentTarget.style.background = navHover)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              aria-label="이전 달"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-base font-bold tracking-tight" style={{ color: headerText }}>
              {viewYear}년 {viewMonth}월
            </span>

            <button
              onClick={nextMonth}
              disabled={!canGoNext}
              className="flex items-center justify-center w-9 h-9 rounded-2xl transition-colors"
              style={{ color: headerText, opacity: canGoNext ? 1 : 0.35 }}
              onMouseEnter={e => (e.currentTarget.style.background = navHover)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              aria-label="다음 달"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className="text-center text-xs font-semibold py-1"
                style={{
                  color: i === 0
                    ? (isDark ? "#fca5a5" : "#f87171")
                    : i === 6
                    ? (isDark ? "#93c5fd" : "#60a5fa")
                    : (isDark ? "#94a3b8" : "#9ca3af"),
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: totalCells }).map((_, i) => {
              const day      = i - firstDow + 1;
              const isValid  = day >= 1 && day <= daysInMonth;
              const dateStr  = isValid ? toDateStr(viewYear, viewMonth, day) : "";
              const exceedsMax = !!(isValid && maxDate && dateStr > maxDate);
              const isSelected = isValid && dateStr === value;
              const isToday    = isValid && dateStr === todayStr;
              const dow        = i % 7;

              let cellStyle: React.CSSProperties = { opacity: isValid ? 1 : 0 };
              if (isValid) {
                if (exceedsMax) {
                  cellStyle = {
                    color: isDark ? "#64748b" : "#cbd5e1",
                    opacity: 0.45,
                  };
                } else if (isSelected) {
                  cellStyle = {
                    background: "#e4701e",
                    color: "#ffffff",
                    fontWeight: 700,
                  };
                } else if (isToday) {
                  cellStyle = {
                    background: isDark ? "rgba(228,112,30,0.18)" : "#fff7ed",
                    color: "#e4701e",
                    fontWeight: 700,
                    outline: "2px solid #e4701e",
                    outlineOffset: "-2px",
                  };
                } else {
                  cellStyle = {
                    color: dow === 0
                      ? (isDark ? "#fca5a5" : "#f87171")
                      : dow === 6
                      ? (isDark ? "#93c5fd" : "#60a5fa")
                      : (isDark ? "#cbd5e1" : "#374151"),
                  };
                }
              }

              return (
                <button
                  key={i}
                  disabled={!isValid || exceedsMax}
                  onClick={() => {
                    if (!isValid || exceedsMax) return;
                    onChange(dateStr);
                    onClose();
                  }}
                  className="relative flex items-center justify-center aspect-square rounded-full text-xs font-medium transition-colors mx-0.5"
                  style={cellStyle}
                  onMouseEnter={e => {
                    if (!isValid || exceedsMax || isSelected) return;
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "#f5f5f5";
                  }}
                  onMouseLeave={e => {
                    if (!isValid || exceedsMax || isSelected) return;
                    if (isToday) {
                      e.currentTarget.style.background = isDark ? "rgba(228,112,30,0.18)" : "#fff7ed";
                    } else {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {isValid && day}
                </button>
              );
            })}
          </div>

          {/* 취소 */}
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-2xl py-3 text-sm font-medium transition-colors"
            style={{ background: cancelBg, border: `1px solid ${borderColor}`, color: cancelText }}
          >
            취소
          </button>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
