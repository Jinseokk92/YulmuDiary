"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { Images } from "lucide-react";
import { api } from "@/lib/api";
import type { MyReactionPageResponse, MyReactionResponse, DiaryPostResponse } from "@/types";
import EmptyState from "@/components/ui/EmptyState";
import PostDetailModal from "@/components/activity/PostDetailModal";
import { SquareThumbnailCell, SquareSkeletonCell } from "@/components/activity/SquareThumbnailCell";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { useUiStore } from "@/stores/uiStore";
import { darkPalette } from "@/lib/theme/darkPalette";

const PAGE_SIZE = 30;

export default function MyReactionsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<MyReactionResponse[]>([]);
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
  const gridLineColor = isDark ? darkPalette.border : "#e5e7eb";

  const fetchReactions = useCallback(async (cursor: number | null, force = false) => {
    if (loadingRef.current) return;
    if (!force && !hasNextRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const params = new URLSearchParams({ size: String(PAGE_SIZE) });
      if (cursor !== null) params.set("cursor", String(cursor));
      const data = await api.get<MyReactionPageResponse>(`/api/users/me/reactions?${params}`);

      setItems((prev) => (cursor === null ? data.items : [...prev, ...data.items]));
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
    fetchReactions(null);
  }, [fetchReactions]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchReactions(nextCursorRef.current);
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchReactions]);

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
    await fetchReactions(null, true);
  }, [fetchReactions]);

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
              내 반응
            </h1>
            {initialLoaded && items.length > 0 && (
              <span className="text-sm tabular-nums" style={{ color: isDark ? darkPalette.textMuted : "#9ca3af" }}>
                {items.length}
                {hasNextRef.current ? "+" : ""}개
              </span>
            )}
          </div>

          {initialLoaded && items.length === 0 && !loading ? (
            <EmptyState
              title="반응한 게시글이 없어요"
              description="마음에 드는 일기에 이모지를 남겨보세요!"
            />
          ) : (
            <>
              <div className="grid grid-cols-3">
                {!initialLoaded &&
                  Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={`sk-${i}`}
                      className="aspect-square"
                      style={{
                        borderRight: (i + 1) % 3 !== 0 ? `1px solid ${gridLineColor}` : undefined,
                        borderBottom: `1px solid ${gridLineColor}`,
                      }}
                    >
                      <SquareSkeletonCell isDark={isDark} />
                    </div>
                  ))}

                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="aspect-square"
                    style={{
                      borderRight: (i + 1) % 3 !== 0 ? `1px solid ${gridLineColor}` : undefined,
                      borderBottom: `1px solid ${gridLineColor}`,
                    }}
                  >
                    <SquareThumbnailCell
                      onClick={() => openPost(item.postId)}
                      ariaLabel={`반응한 게시글: ${item.postContent?.slice(0, 20) ?? ""}`}
                      imageUrl={item.postThumbnailUrl}
                      text={item.postContent}
                      isDark={isDark}
                      emptyFallback={<Images size={16} style={{ color: isDark ? darkPalette.textMuted : "#d1d5db" }} />}
                      topLeftOverlay={
                        <span
                          className="select-none text-base leading-none drop-shadow-md"
                          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                        >
                          {item.emoji}
                        </span>
                      }
                    />
                  </div>
                ))}
              </div>

              {loading && initialLoaded && (
                <div className="grid grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={`sk-more-${i}`}
                      className="aspect-square"
                      style={{
                        borderRight: (i + 1) % 3 !== 0 ? `1px solid ${gridLineColor}` : undefined,
                        borderBottom: `1px solid ${gridLineColor}`,
                      }}
                    >
                      <SquareSkeletonCell isDark={isDark} />
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
