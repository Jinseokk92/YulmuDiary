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
}

export default function DiaryFeed({ data, currentPage }: DiaryFeedProps) {
  const router = useRouter();
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
  const isCommentOpen = useUiStore((state) => state.isCommentOpen);

  const handleRefresh = useCallback(async () => {
    router.refresh();
    // router.refresh()는 비동기가 아니므로 약간 대기해서 인디케이터를 자연스럽게 유지
    await new Promise((r) => setTimeout(r, 800));
  }, [router]);

  const { pullY, isRefreshing, progress } = usePullToRefresh({
    threshold: 72,
    onRefresh: handleRefresh,
    disabled: isDrawerOpen || isCommentOpen,
  });

  // DiaryCard.onDelete는 (postId: number) => void — 파라미터를 명시적으로 받되 무시
  const handleDelete = useCallback((_postId: number) => {
    router.refresh();
  }, [router]);

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
              <DiaryCard key={post.id} post={post} onDelete={handleDelete} />
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
