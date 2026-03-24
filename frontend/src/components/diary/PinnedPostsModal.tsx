"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Pin } from "lucide-react";
import type { DiaryPostResponse } from "@/types";
import { formatRelativeTime, getMediaUrl } from "@/lib/utils";

interface PinnedPostsModalProps {
  posts: DiaryPostResponse[];
  onClose: () => void;
  isDark: boolean;
}

export default function PinnedPostsModal({ posts, onClose, isDark }: PinnedPostsModalProps) {
  const router = useRouter();
  const scrollY = useRef(0);

  // body 스크롤 차단
  useEffect(() => {
    scrollY.current = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY.current}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    const preventTouchMove = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventTouchMove);
      window.scrollTo(0, scrollY.current);
    };
  }, []);

  const handleGoToPost = (postId: number) => {
    onClose();
    router.push(`/diary?highlightId=${postId}`);
  };

  return createPortal(
    <>
      {/* 백드롭 */}
      <motion.div
        className="fixed inset-0 z-[200]"
        style={{ background: "rgba(15, 23, 42, 0.52)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* 모달 */}
      <motion.div
        className={`fixed z-[201] rounded-3xl shadow-2xl overflow-hidden
          ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white border border-white/60"}`}
        style={{
          top: "50%",
          left: "50%",
          width: "calc(100% - 40px)",
          maxWidth: 440,
          maxHeight: "80vh",
          transformOrigin: "top right",
        }}
        initial={{ x: "-50%", y: "-50%", scale: 0.82, opacity: 0 }}
        animate={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
        exit={{ x: "-50%", y: "-50%", scale: 0.82, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
      >
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-5 pt-5 pb-3
          ${isDark ? "border-b border-slate-800" : "border-b border-gray-100"}`}>
          <div className="flex items-center gap-2">
            <Pin size={17} className="text-primary-500" fill="currentColor" />
            <span className={`text-base font-bold ${isDark ? "text-slate-100" : "text-gray-900"}`}>
              고정된 일기
            </span>
            <span className={`text-sm font-semibold ${isDark ? "text-slate-500" : "text-gray-400"}`}>
              {posts.length}/3
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className={`p-1.5 rounded-full transition-colors
              ${isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* 게시글 목록 */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: "calc(80vh - 64px)" }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {posts.map((post, idx) => {
            const thumbnail = post.media?.[0]
              ? getMediaUrl(post.media[0].thumbnailUrl ?? post.media[0].url)
              : null;
            const lines = post.content.split("\n");
            const title = lines.length > 1 ? lines[0] : null;
            const body = lines.length > 1 ? lines.slice(1).join("\n") : post.content;

            return (
              <div
                key={post.id}
                className={`px-5 py-4 ${idx < posts.length - 1
                  ? isDark ? "border-b border-slate-800" : "border-b border-gray-100"
                  : ""}`}
              >
                <div className="flex gap-3">
                  {/* 썸네일 */}
                  {thumbnail ? (
                    <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden">
                      <Image
                        src={thumbnail}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className={`w-16 h-16 shrink-0 rounded-xl flex items-center justify-center text-2xl
                      ${isDark ? "bg-slate-800" : "bg-primary-50"}`}>
                      📖
                    </div>
                  )}

                  {/* 본문 */}
                  <div className="flex-1 min-w-0">
                    {title && (
                      <p className={`text-sm font-bold truncate ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                        {title}
                      </p>
                    )}
                    <p className={`text-sm line-clamp-2 leading-relaxed ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                      {body}
                    </p>
                    <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                      <span className="font-medium">{post.authorNickname}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(post.createdAt)}</span>
                      {post.milestoneTag && (
                        <>
                          <span>·</span>
                          <span className="text-primary-500 font-medium truncate max-w-[80px]">
                            {post.milestoneTag.startsWith("#") ? post.milestoneTag : `#${post.milestoneTag}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 자세히 보기 */}
                <button
                  onClick={() => handleGoToPost(post.id)}
                  className={`mt-3 w-full py-2 rounded-xl text-sm font-semibold transition-colors
                    ${isDark
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-700"
                      : "bg-primary-50 text-primary-600 hover:bg-primary-100 active:bg-primary-100"}`}
                >
                  자세히 보기
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </>,
    document.body
  );
}
