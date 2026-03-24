"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Image from "next/image";
import { X, Crown, Trophy } from "lucide-react";
import { getMediaUrl } from "@/lib/utils";
import type { BestPhotoStatusResponse } from "@/types";

interface ResultModalProps {
  result: NonNullable<BestPhotoStatusResponse["result"]>;
  isDark: boolean;
  onClose: () => void;
}

export default function ResultModal({ result, isDark, onClose }: ResultModalProps) {
  const scrollY = useRef(0);

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

  const bg = isDark ? "bg-slate-900" : "bg-white";
  const border = isDark ? "border-slate-800" : "border-gray-100";
  const titleCls = isDark ? "text-slate-100" : "text-gray-900";
  const subCls = isDark ? "text-slate-400" : "text-gray-500";

  const winnerSrc = getMediaUrl(result.winnerAlbumPhotoThumbnailUrl ?? result.winnerAlbumPhotoUrl);

  return createPortal(
    <>
      {/* 백드롭 */}
      <motion.div
        className="fixed inset-0 z-[200]"
        style={{ background: "rgba(15, 23, 42, 0.60)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* 모달 */}
      <motion.div
        className={`fixed z-[201] rounded-3xl shadow-2xl overflow-hidden ${bg}`}
        style={{
          top: "50%",
          left: "50%",
          width: "calc(100% - 40px)",
          maxWidth: 440,
          maxHeight: "85vh",
        }}
        initial={{ x: "-50%", y: "-50%", scale: 0.82, opacity: 0 }}
        animate={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
        exit={{ x: "-50%", y: "-50%", scale: 0.82, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
      >
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-5 pt-5 pb-3 border-b ${border}`}>
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <span className={`text-base font-bold ${titleCls}`}>이달의 베스트 포토</span>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className={`p-1.5 rounded-full transition-colors
              ${isDark ? "text-slate-400 hover:bg-slate-800" : "text-gray-400 hover:bg-gray-100"}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: "calc(85vh - 60px)" }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* 우승 사진 */}
          <div className="px-5 pt-5 pb-4">
            <div className="relative rounded-2xl overflow-hidden aspect-square w-full max-w-[260px] mx-auto">
              <Image
                src={winnerSrc}
                alt="이달의 베스트 포토"
                fill
                className="object-cover"
                sizes="260px"
                unoptimized
              />
              {/* 왕관 */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2">
                <Crown size={32} className="text-amber-400 drop-shadow-lg" fill="currentColor" />
              </div>
            </div>

            <div className="text-center mt-3 space-y-1">
              <p className={`text-sm font-bold ${titleCls}`}>🏆 베스트 포토 선정!</p>
              <p className={`text-xs ${subCls}`}>{result.winnerVoteCount}표를 받았어요</p>
            </div>
          </div>

          {/* 투표 결과 목록 */}
          {result.topNominations.length > 0 && (
            <div className={`border-t ${border} px-5 py-4`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${subCls}`}>전체 결과</p>
              <div className="space-y-2">
                {result.topNominations.map((nom, idx) => {
                  const src = getMediaUrl(nom.albumPhotoThumbnailUrl ?? nom.albumPhotoUrl);
                  const rankEmoji = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}위`;

                  return (
                    <div key={nom.id} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center shrink-0">{rankEmoji}</span>
                      <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden">
                        <Image
                          src={src}
                          alt={nom.nominatorName}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${titleCls}`}>{nom.nominatorName}</p>
                        <p className={`text-xs ${subCls}`}>{nom.voteCount}표</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pb-6" />
        </div>
      </motion.div>
    </>,
    document.body
  );
}
