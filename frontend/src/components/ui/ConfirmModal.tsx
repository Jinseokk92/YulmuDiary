"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  zIndex?: number;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  loading = false,
  zIndex = 50,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // 열릴 때 확인 버튼에 포커스
  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/65"
        onClick={loading ? undefined : onCancel}
      />

      {/* 모달 */}
      <div className="relative bg-white dark:bg-[#121212] dark:border dark:border-[#262626] rounded-2xl shadow-xl dark:shadow-none w-full max-w-xs p-6 text-center">
        <h3 className="text-base font-semibold text-gray-900 dark:text-[#F5F5F5] mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-[#A8A8A8] mb-5">{description}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 dark:text-[#A8A8A8]
                       bg-gray-100 dark:bg-[#1A1A1A] rounded-xl
                       hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl
                       hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? "삭제 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
