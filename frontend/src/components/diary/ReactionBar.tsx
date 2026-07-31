"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import type { ReactionResponse } from "@/types";

const EMOJI_LIST = ["❤️", "😍", "👏", "🎉", "😢"] as const;

interface ReactionBarProps {
  postId: number;
  initialReactions: ReactionResponse[];
  isDark?: boolean;
}

/** 이모지별 카운트와 내가 눌렀는지 여부를 계산 */
function summarize(reactions: ReactionResponse[], userId: number | null) {
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const emoji of EMOJI_LIST) {
    map.set(emoji, { count: 0, mine: false });
  }
  for (const r of reactions) {
    const entry = map.get(r.emoji);
    if (entry) {
      entry.count++;
      if (r.userId === userId) entry.mine = true;
    }
  }
  return map;
}

export default function ReactionBar({
  postId,
  initialReactions,
  isDark = false,
}: ReactionBarProps) {
  const { currentUser } = useUser();
  const [reactions, setReactions] = useState<ReactionResponse[]>(initialReactions ?? []);
  const [pending, setPending] = useState<string | null>(null); // 진행 중인 이모지

  const summary = summarize(reactions, currentUser?.id ?? null);

  const toggle = useCallback(
    async (emoji: string) => {
      if (!currentUser || pending) return;

      const userId = currentUser.id;
      const existing = reactions.find(
        (r) => r.emoji === emoji && r.userId === userId
      );

      // --- Optimistic Update ---
      const prevReactions = reactions;

      if (existing) {
        // 제거
        setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      } else {
        // 추가 (임시 ID)
        const optimistic: ReactionResponse = {
          id: -Date.now(),
          userId,
          emoji,
          createdAt: new Date().toISOString(),
        };
        setReactions((prev) => [...prev, optimistic]);
      }

      setPending(emoji);

      try {
        const result = await api.post<ReactionResponse | null>(
          `/api/diary-posts/${postId}/reactions`,
          { emoji },
          {
            headers: {
              "X-USER-ID": currentUser.id.toString(),
            },
          }
        );

        // 서버 응답으로 정확한 상태 반영
        if (result) {
          // 추가됨 — 임시 항목을 서버 데이터로 교체
          setReactions((prev) =>
            prev.map((r) => (r.id < 0 && r.emoji === emoji ? result : r))
          );
        }
        // result === null 이면 삭제된 것 → optimistic 상태가 이미 맞음
      } catch {
        // 롤백
        setReactions(prevReactions);
      } finally {
        setPending(null);
      }
    },
    [currentUser, reactions, pending, postId]
  );

  return (
    <div className="flex items-center gap-1">
      {EMOJI_LIST.map((emoji) => {
        const info = summary.get(emoji)!;
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={pending !== null}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-colors
              ${
                info.mine
                  ? isDark ? "bg-primary-500/10 ring-1 ring-primary-500/30" : "bg-primary-50 ring-1 ring-primary-200"
                  : isDark ? "bg-[#1A1A1A] hover:bg-[#2A2A2A]" : "bg-gray-50 hover:bg-gray-100"
              }
              ${pending !== null ? "opacity-60 cursor-not-allowed" : "active:scale-95"}`}
          >
            <span>{emoji}</span>
            {info.count > 0 && (
              <span
                className={`text-xs font-medium ${
                  info.mine ? "text-primary-600" : isDark ? "text-[#A8A8A8]" : "text-gray-500"
                }`}
              >
                {info.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
