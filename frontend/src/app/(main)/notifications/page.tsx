"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationPageResponse, NotificationResponse } from "@/types";
import UserAvatar from "@/components/ui/UserAvatar";
import { Bell, MessageCircle, Heart } from "lucide-react";

const PAGE_SIZE = 20;

// ── 시간 그룹 ───────────────────────────────────────────────────────────────

type GroupLabel = "오늘" | "최근 7일" | "최근 30일" | "이전 활동";
const GROUP_ORDER: GroupLabel[] = ["오늘", "최근 7일", "최근 30일", "이전 활동"];
const DAY = 86_400_000;

function getGroupLabel(dateStr: string): GroupLabel {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < DAY) return "오늘";
  if (diff < 7 * DAY) return "최근 7일";
  if (diff < 30 * DAY) return "최근 30일";
  return "이전 활동";
}

function groupNotifications(
  items: NotificationResponse[]
): Map<GroupLabel, NotificationResponse[]> {
  const map = new Map<GroupLabel, NotificationResponse[]>();
  for (const item of items) {
    const label = getGroupLabel(item.createdAt);
    const existing = map.get(label);
    if (existing) existing.push(item);
    else map.set(label, [item]);
  }
  return map;
}

// ── 아바타 + 타입 뱃지 ──────────────────────────────────────────────────────

function AvatarWithBadge({
  nickname,
  profileImageUrl,
  type,
  reactionEmoji,
}: {
  nickname: string;
  profileImageUrl: string | null;
  type: "COMMENT" | "REACTION";
  reactionEmoji: string | null;
}) {
  return (
    <div className="relative shrink-0">
      <UserAvatar nickname={nickname} profileImageUrl={profileImageUrl} size="lg" />
      {/* 타입 뱃지 — 아바타 우하단 */}
      <span
        className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm"
        style={{
          backgroundColor: type === "COMMENT" ? "#3b82f6" : "#ef4444",
          fontSize: "10px",
          lineHeight: 1,
        }}
      >
        {type === "COMMENT" ? (
          <MessageCircle size={10} color="#fff" />
        ) : reactionEmoji ? (
          reactionEmoji
        ) : (
          <Heart size={10} color="#fff" />
        )}
      </span>
    </div>
  );
}

// ── 메시지 텍스트 (3-파트 렌더링) ────────────────────────────────────────────

function MessageText({
  item,
  textPrimary,
  textTertiary,
}: {
  item: NotificationResponse;
  textPrimary: string;
  textTertiary: string; // 댓글 미리보기 색상 (더 연한 회색)
}) {
  // 닉네임 · 액션베이스 · 댓글 미리보기 세 파트로 분리
  const { namePart, actionBase, grayPart } = useMemo(() => {
    const name = item.senderNickname;
    const msgAfterName = item.message.startsWith(name)
      ? item.message.slice(name.length)
      : item.message;

    if (item.type === "COMMENT" && item.commentPreview) {
      // msgAfterName = "님이 댓글을 남겼어요: 안녕하송ㅋ..."
      // commentPreview = "안녕하송ㅋ" (최대 30자)
      const previewIdx = msgAfterName.lastIndexOf(item.commentPreview);
      if (previewIdx !== -1) {
        return {
          namePart: item.message.startsWith(name) ? name : "",
          actionBase: msgAfterName.slice(0, previewIdx),
          grayPart: msgAfterName.slice(previewIdx),
        };
      }
    }

    return {
      namePart: item.message.startsWith(name) ? name : "",
      actionBase: msgAfterName,
      grayPart: null,
    };
  }, [item]);

  return (
    <p
      className="text-[13.5px] leading-snug"
      style={{
        color: textPrimary,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {namePart && (
        <span style={{ fontWeight: 700 }}>{namePart}</span>
      )}
      {actionBase}
      {grayPart && (
        <span style={{ color: textTertiary }}>{grayPart}</span>
      )}
    </p>
  );
}

// ── 개별 알림 행 ─────────────────────────────────────────────────────────────

const NotificationRow = memo(function NotificationRow({
  item,
  isDark,
  onClick,
}: {
  item: NotificationResponse;
  isDark: boolean;
  onClick: () => void;
}) {
  const [thumbError, setThumbError] = useState(false);

  const textPrimary   = isDark ? "#e2e8f0" : "#111827";
  const textSecondary = isDark ? "#94a3b8" : "#9ca3af";
  const textTertiary  = isDark ? "#64748b" : "#b0b7c3"; // 댓글 미리보기용 더 연한 색
  const unreadBg      = isDark ? "#1e1409" : "#fff8f2";

  const hasThumbnail = !!item.diaryThumbnailUrl && !thumbError;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors active:opacity-70"
      style={{ backgroundColor: item.isRead ? "transparent" : unreadBg }}
    >
      {/* 아바타 + 타입 뱃지 */}
      <AvatarWithBadge
        nickname={item.senderNickname}
        profileImageUrl={item.senderProfileImageUrl}
        type={item.type}
        reactionEmoji={item.reactionEmoji}
      />

      {/* 텍스트 영역 */}
      <div className="flex-1 min-w-0">
        <MessageText
          item={item}
          textPrimary={textPrimary}
          textTertiary={textTertiary}
        />
        <p className="text-[11px] mt-1 font-medium" style={{ color: textSecondary }}>
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>

      {/* 일기 썸네일 (44×44) 또는 미읽 점 */}
      {hasThumbnail ? (
        <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden">
          <Image
            src={item.diaryThumbnailUrl!}
            alt="일기 이미지"
            width={44}
            height={44}
            className="w-full h-full object-cover"
            onError={() => setThumbError(true)}
          />
        </div>
      ) : (
        <div className="shrink-0 w-11 flex justify-center pt-2">
          {!item.isRead && (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#e4701e" }}
            />
          )}
        </div>
      )}
    </button>
  );
});

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  // mounted: 다크모드 색상 적용 시점 제어용
  // "if (!mounted) return null" 패턴 사용 금지 →
  //   null 반환 시 sentinelRef.current = null 상태에서 IntersectionObserver가
  //   실행되어 sentinel이 영구히 관찰되지 않는 버그가 생김.
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 입장 시 전체 읽음 처리 (헤더 뱃지 제거)
  useEffect(() => {
    api.patch("/api/notifications/read-all").catch(() => {});
  }, []);

  const fetchMore = useCallback(async () => {
    if (loadingRef.current || !hasNext) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({ size: String(PAGE_SIZE) });
      if (cursor !== null) params.set("cursor", String(cursor));
      const data = await api.get<NotificationPageResponse>(
        `/api/notifications?${params}`
      );
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasNext(data.hasNext);
    } catch (err) {
      console.error("[알림 목록 로드 실패]", err);
      setHasNext(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasNext, cursor]);

  // sentinel이 항상 DOM에 있어야 IntersectionObserver가 첫 렌더 후 즉시 관찰 시작
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  const isDark = mounted && resolvedTheme === "dark";
  const bg          = isDark ? "#0f172a" : "#ffffff";
  const textPrimary = isDark ? "#e2e8f0" : "#111827";
  const textMuted   = isDark ? "#94a3b8" : "#6b7280";
  const divider     = isDark ? "#1e293b" : "#f3f4f6";

  const grouped = useMemo(() => groupNotifications(items), [items]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: bg }}>
      {/* 타이틀 */}
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-xl font-bold" style={{ color: textPrimary }}>
          알림
        </h1>
      </div>

      {/* 빈 상태 */}
      {items.length === 0 && !loading && !hasNext && (
        <div className="flex flex-col items-center gap-3 pt-24 pb-8">
          <Bell size={44} style={{ color: textMuted }} strokeWidth={1.2} />
          <p className="text-sm font-medium" style={{ color: textMuted }}>
            아직 알림이 없어요.
          </p>
          <p className="text-xs text-center leading-relaxed" style={{ color: textMuted }}>
            가족이 회원님의 일기에 댓글이나
            <br />
            반응을 남기면 알려드릴게요.
          </p>
        </div>
      )}

      {/* 시간대별 그룹 */}
      {GROUP_ORDER.map((label) => {
        const group = grouped.get(label);
        if (!group || group.length === 0) return null;
        return (
          <section key={label}>
            <div className="px-4 pt-5 pb-1">
              <h2
                className="text-[13px] font-bold"
                style={{ color: isDark ? "#94a3b8" : "#374151" }}
              >
                {label}
              </h2>
            </div>
            <div>
              {group.map((item, idx) => (
                <div key={item.id}>
                  <NotificationRow
                    item={item}
                    isDark={isDark}
                    onClick={() => router.push("/diary")}
                  />
                  {idx < group.length - 1 && (
                    <div className="h-px mx-4" style={{ backgroundColor: divider }} />
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* 무한스크롤 센티넬 — 항상 DOM에 존재 */}
      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="flex justify-center py-6">
          <div
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "#e4701e44", borderTopColor: "#e4701e" }}
          />
        </div>
      )}
    </div>
  );
}
