"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DiaryPostPaginatedResponse } from "@/types";
import DiaryCard from "./DiaryCard";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "./Pagination";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { useUiStore } from "@/stores/uiStore";

interface DiaryFeedProps {
  data: DiaryPostPaginatedResponse;
  currentPage: number; // 1-based (URL 파라미터)
  onRefresh?: () => Promise<void>;
  onDelete?: (postId: number) => void;
  highlightId?: number | null;
}

export default function DiaryFeed({ data, currentPage, onRefresh, onDelete, highlightId }: DiaryFeedProps) {
  const router = useRouter();
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);

  const isCommentOpen = useUiStore((state) => state.isCommentOpen);
  const isImageViewerOpen = useUiStore((state) => state.isImageViewerOpen);
  const setImageViewerOpen = useUiStore((state) => state.setImageViewerOpen);

  const handleRefresh = useCallback(async () => {
    setImageViewerOpen(false);
    if (onRefresh) {
      await onRefresh();
    } else {
      router.refresh();
      await new Promise((r) => setTimeout(r, 800));
    }
  }, [router, setImageViewerOpen, onRefresh]);

  const { pullY, isRefreshing, progress } = usePullToRefresh({
    threshold: 72,
    onRefresh: handleRefresh,
    disabled: isDrawerOpen || isCommentOpen || isImageViewerOpen,
  });

  const handleDelete = useCallback((postId: number) => {
    if (onDelete) {
      onDelete(postId);
    } else {
      router.refresh();
    }
  }, [router, onDelete]);

  const handlePageChange = useCallback((page: number) => {
    router.push(`/diary?page=${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router]);

  return (
    <div style={{ position: "relative" }}>
      {/* 절대 위치 스피너 — 콘텐츠가 translateY로 밀릴 때 드러나는 공간에 자연스럽게 표시 */}
      <PullToRefreshIndicator
        pullY={isDrawerOpen ? 0 : pullY}
        isRefreshing={isDrawerOpen ? false : isRefreshing}
        progress={isDrawerOpen ? 0 : progress}
      />

      <div
        style={{
          transform: isDrawerOpen ? "none" : `translateY(${pullY}px)`,
          transition: isDrawerOpen ? "none" : isRefreshing ? "transform 0.2s ease" : "none",
        }}
      >
        {!data?.content?.length ? (
          <EmptyState
            title="아직 일기가 없어요"
            description="첫 번째 일기를 작성해 보세요!"
          />
        ) : (
          <div className="flex flex-col py-4">
            {data.content.map((post) => (
              <DiaryCard key={post.id} post={post} onDelete={handleDelete} highlight={highlightId === post.id} />
            ))}

            <Pagination
              currentPage={currentPage}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
