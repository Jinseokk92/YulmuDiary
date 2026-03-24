"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Image from "next/image";
import { X, Trophy, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";
import type { BestPhotoNominationResponse } from "@/types";

interface VotingModalProps {
  roundId: number;
  nominations: BestPhotoNominationResponse[];
  hasVoted: boolean;
  votedNominationId: number | null;
  isDark: boolean;
  onClose: () => void;
  onVoted: (votedNominationId: number) => void;
}

export default function VotingModal({
  roundId,
  nominations,
  hasVoted: initialHasVoted,
  votedNominationId: initialVotedNominationId,
  isDark,
  onClose,
  onVoted,
}: VotingModalProps) {
  const scrollY = useRef(0);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [votedNominationId, setVotedNominationId] = useState<number | null>(initialVotedNominationId);
  const [voting, setVoting] = useState<number | null>(null);
  const { toast, showToast } = useToast();

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

  const handleVote = async (nominationId: number) => {
    if (hasVoted) {
      showToast("이미 투표했어요!");
      return;
    }
    if (voting !== null) return;
    setVoting(nominationId);
    try {
      await api.post<void>("/api/best-photo/vote", { nominationId });
      setHasVoted(true);
      setVotedNominationId(nominationId);
      showToast("투표 완료!");
      onVoted(nominationId);
    } catch {
      showToast("투표에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setVoting(null);
    }
  };

  const bg = isDark ? "bg-slate-900" : "bg-white";
  const border = isDark ? "border-slate-800" : "border-gray-100";
  const titleCls = isDark ? "text-slate-100" : "text-gray-900";
  const subCls = isDark ? "text-slate-400" : "text-gray-500";

  // roundId는 현재 사용되지 않지만 향후 확장을 위해 props로 유지
  void roundId;

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

      {/* 바텀시트 */}
      <motion.div
        className={`fixed z-[201] left-0 right-0 bottom-0 rounded-t-3xl shadow-2xl overflow-hidden ${bg}`}
        style={{ maxHeight: "90vh" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 36 }}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
        </div>

        {/* 헤더 */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${border}`}>
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <span className={`text-base font-bold ${titleCls}`}>이달의 베스트 포토 투표</span>
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

        {/* 안내 문구 */}
        <div className={`px-5 py-3 text-xs border-b ${border}
          ${hasVoted
            ? isDark ? "bg-amber-900/10 text-amber-300" : "bg-amber-50 text-amber-700"
            : subCls}`}>
          {hasVoted
            ? "✅ 투표 완료! 결과는 투표 종료 후 공개돼요."
            : "가장 예쁜 사진 하나에 투표하세요 — 1인 1표"}
        </div>

        {/* 사진 목록 */}
        <div
          className="overflow-y-auto overscroll-contain pb-8"
          style={{ maxHeight: "calc(90vh - 130px)" }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {nominations.length === 0 ? (
            <div className={`py-12 text-center text-sm ${subCls}`}>추천된 사진이 없어요</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4">
              {nominations.map((nom) => {
                const src = getMediaUrl(nom.albumPhotoThumbnailUrl ?? nom.albumPhotoUrl);
                const isVoting = voting === nom.id;
                const isVotedThis = votedNominationId === nom.id;
                const isOther = hasVoted && !isVotedThis;

                return (
                  <button
                    key={nom.id}
                    onClick={() => handleVote(nom.id)}
                    disabled={voting !== null}
                    className={`relative rounded-2xl overflow-hidden aspect-square transition-all active:scale-[0.97]
                      ${isVotedThis
                        ? "ring-[3px] ring-amber-400 ring-offset-2"
                        : isDark ? "bg-slate-800" : "bg-gray-100"}`}
                    aria-label={`${nom.nominatorName}의 사진에 투표`}
                  >
                    <Image
                      src={src}
                      alt={nom.nominatorName}
                      fill
                      className={`object-cover transition-all ${isOther ? "brightness-50" : ""}`}
                      sizes="(max-width: 768px) 45vw"
                      unoptimized
                    />

                    {/* 투표한 사진: 체크 + 이름 */}
                    {isVotedThis && (
                      <>
                        <div className="absolute inset-0 bg-amber-500/10" />
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 size={24} className="text-amber-400 drop-shadow" fill="currentColor" />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                          <p className="text-white text-xs font-semibold truncate">{nom.nominatorName}</p>
                          <p className="text-amber-300 text-[10px] font-medium">내가 투표한 사진 ⭐</p>
                        </div>
                      </>
                    )}

                    {/* 다른 사진: 회색 + "투표 완료" */}
                    {isOther && (
                      <>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <span className="text-white/70 text-xs font-semibold">투표 완료</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 py-2">
                          <p className="text-white/70 text-xs truncate">{nom.nominatorName}</p>
                        </div>
                      </>
                    )}

                    {/* 미투표 사진: 이름만 */}
                    {!hasVoted && !isVoting && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                        <p className="text-white text-xs font-semibold truncate">{nom.nominatorName}</p>
                      </div>
                    )}

                    {/* 투표 중 스피너 */}
                    {isVoting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <Toast message={toast} />
    </>,
    document.body
  );
}
