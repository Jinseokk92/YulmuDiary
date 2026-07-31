"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { MyCommentPageResponse, MyCommentResponse, DiaryPostResponse } from "@/types";
import EmptyState from "@/components/ui/EmptyState";
import PostDetailModal from "@/components/activity/PostDetailModal";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { useUiStore } from "@/stores/uiStore";
import { darkPalette } from "@/lib/theme/darkPalette";

const PAGE_SIZE = 20;

function SkeletonRow({ isDark }: { isDark: boolean }) {
  const bg = isDark ? darkPalette.border : "#f3f4f6";
  const bg2 = isDark ? darkPalette.surfaceSecondary : "#e5e7eb";

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: bg }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded" style={{ backgroundColor: bg }} />
        <div className="h-2.5 w-1/2 animate-pulse rounded" style={{ backgroundColor: bg2 }} />
      </div>
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg" style={{ backgroundColor: bg }} />
    </div>
  );
}

function CommentRow({
  comment,
  onClick,
  isDark,
}: {
  comment: MyCommentResponse;
  onClick: () => void;
  isDark: boolean;
}) {
  const contentColor = isDark ? darkPalette.textPrimary : "#111827";
  const postColor = isDark ? darkPalette.textMuted : "#9ca3af";
  const timeColor = isDark ? darkPalette.textMuted : "#d1d5db";
  const iconBg = isDark ? darkPalette.surfaceSecondary : "#f3f4f6";
  const iconColor = isDark ? darkPalette.textMuted : "#9ca3af";
  const hoverBg = isDark ? "hover:bg-[#2A2A2A]" : "hover:bg-gray-50";

  return (
    <button
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${hoverBg}`}
      onClick={onClick}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        <MessageCircle size={16} style={{ color: iconColor }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-snug" style={{ color: contentColor }}>
          {comment.content}
        </p>
        {comment.postContent && (
          <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: postColor }}>
            {comment.postContent}
          </p>
        )}
        <p className="mt-1 text-[11px]" style={{ color: timeColor }}>
          {formatRelativeTime(comment.createdAt)}
        </p>
      </div>

      {comment.postThumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.postThumbnailUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-lg" style={{ backgroundColor: iconBg }} />
      )}
    </button>
  );
}

export default function MyCommentsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [comments, setComments] = useState<MyCommentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [selectedPost, setSelectedPost] = useState<DiaryPostResponse | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);

  const loadingRef = useRef(false);
  const hasNextRef = useRef(true);
  const nextCursorRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const dividerColor = isDark ? darkPalette.border : "#f3f4f6";

  const fetchComments = useCallback(async (cursor: number | null, force = false) => {
    if (loadingRef.current) return;
    if (!force && !hasNextRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const params = new URLSearchParams({ size: String(PAGE_SIZE) });
      if (cursor !== null) params.set("cursor", String(cursor));
      const data = await api.get<MyCommentPageResponse>(`/api/users/me/comments?${params}`);

      setComments((prev) => (cursor === null ? data.items : [...prev, ...data.items]));
      hasNextRef.current = data.hasNext;
      nextCursorRef.current = data.nextCursor;
    } catch {
      // ignore
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchComments(null);
  }, [fetchComments]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchComments(nextCursorRef.current);
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchComments]);

  const openPost = useCallback(async (postId: number) => {
    setLoadingPost(true);
    try {
      const post = await api.get<DiaryPostResponse>(`/api/diary-posts/${postId}`);
      setSelectedPost(post);
    } catch {
      // ignore
    } finally {
      setLoadingPost(false);
    }
  }, []);

  const handleDeleteInModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchComments(null, true);
  }, [fetchComments]);

  const isOverlayOpen = selectedPost !== null || loadingPost;

  const { pullY, isRefreshing, progress } = usePullToRefresh({
    threshold: 72,
    onRefresh: handleRefresh,
    disabled: isDrawerOpen || isOverlayOpen,
  });

  return (
    <div style={{ position: "relative" }}>
      <PullToRefreshIndicator
        pullY={isDrawerOpen || isOverlayOpen ? 0 : pullY}
        isRefreshing={isDrawerOpen || isOverlayOpen ? false : isRefreshing}
        progress={isDrawerOpen || isOverlayOpen ? 0 : progress}
      />

      <div
        style={{
          transform: isDrawerOpen || isOverlayOpen ? "none" : `translateY(${pullY}px)`,
          transition: isDrawerOpen || isOverlayOpen ? "none" : isRefreshing ? "transform 0.2s ease" : "none",
        }}
      >
        <div className="mx-auto max-w-lg pb-24">
          <div className="flex items-baseline gap-2 px-4 pb-4 pt-6">
            <h1 className="text-lg font-bold" style={{ color: isDark ? darkPalette.textPrimary : "#111827" }}>
              내 댓글
            </h1>
            {initialLoaded && comments.length > 0 && (
              <span className="text-sm tabular-nums" style={{ color: isDark ? darkPalette.textMuted : "#9ca3af" }}>
                {comments.length}
                {hasNextRef.current ? "+" : ""}개
              </span>
            )}
          </div>

          {initialLoaded && comments.length === 0 && !loading ? (
            <EmptyState title="작성한 댓글이 없어요" description="일기에 댓글을 남겨보세요!" />
          ) : (
            <>
              <div style={{ borderTop: `1px solid ${dividerColor}` }}>
                {!initialLoaded &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={`sk-${i}`} style={{ borderBottom: `1px solid ${dividerColor}` }}>
                      <SkeletonRow isDark={isDark} />
                    </div>
                  ))}

                {comments.map((comment) => (
                  <div key={comment.id} style={{ borderBottom: `1px solid ${dividerColor}` }}>
                    <CommentRow comment={comment} onClick={() => openPost(comment.postId)} isDark={isDark} />
                  </div>
                ))}
              </div>

              {loading && initialLoaded && (
                <div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`sk-more-${i}`} style={{ borderBottom: `1px solid ${dividerColor}` }}>
                      <SkeletonRow isDark={isDark} />
                    </div>
                  ))}
                </div>
              )}

              <div ref={sentinelRef} className="h-4" />
            </>
          )}

          <PostDetailModal
            open={selectedPost !== null || loadingPost}
            post={selectedPost}
            loading={loadingPost}
            onClose={() => setSelectedPost(null)}
            onDelete={handleDeleteInModal}
            disableNativeDrag
          />
        </div>
      </div>
    </div>
  );
}
