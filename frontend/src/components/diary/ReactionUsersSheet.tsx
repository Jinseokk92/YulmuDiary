"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import UserAvatar from "@/components/ui/UserAvatar";
import { darkPalette } from "@/lib/theme/darkPalette";
import type { ReactionUserResponse } from "@/types";

interface ReactionUsersSheetProps {
  postId: number;
  likeCount: number;
  onClose: () => void;
  isDark: boolean;
}

export default function ReactionUsersSheet({
  postId,
  likeCount,
  onClose,
  isDark,
}: ReactionUsersSheetProps) {
  const [users, setUsers] = useState<ReactionUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // 스크롤 잠금 (iOS Safari 포함)
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    api.get<ReactionUserResponse[]>(`/api/diary-posts/${postId}/reactions/users`)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  if (!mounted) return null;

  const sheetBg   = isDark ? darkPalette.surface : "#ffffff";
  const border    = isDark ? darkPalette.border : "#f3f4f6";
  const handleBg  = isDark ? darkPalette.hover : "#e5e7eb";
  const headerText = isDark ? darkPalette.textPrimary : "#111827";
  const subText   = isDark ? darkPalette.textSecondary : "#9ca3af";
  const itemBg    = isDark ? darkPalette.surfaceSecondary : "#f9fafb";
  const nickColor = isDark ? darkPalette.textPrimary : "#111827";

  return createPortal(
    <div className="fixed inset-0 z-[500] flex flex-col justify-end">
      {/* 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0"
        style={{ background: isDark ? darkPalette.overlay : "rgba(0,0,0,0.35)" }}
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
          borderTop: `1px solid ${border}`,
          boxShadow: isDark ? "none" : "0 -8px 32px rgba(0,0,0,0.12)",
          maxWidth: 480,
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
          maxHeight: "60vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center mb-4 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: handleBg }} />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <span className="text-sm font-bold" style={{ color: headerText }}>
            좋아요 {likeCount}개
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-xl transition-colors"
            style={{ color: subText }}
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 목록 */}
        <div className="overflow-y-auto overscroll-contain flex-1" style={{ touchAction: "pan-y" }}>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: subText }}>
              아직 좋아요가 없어요
            </p>
          ) : (
            <div className="space-y-2 pb-2">
              {users.map((u) => (
                <div
                  key={`${u.userId}-${u.emoji}`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                  style={{ background: itemBg }}
                >
                  <UserAvatar
                    nickname={u.nickname}
                    profileImageUrl={u.profileImageUrl}
                    size="sm"
                  />
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: nickColor }}>
                    {u.nickname}
                  </span>
                  <span className="text-lg shrink-0">{u.emoji}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
