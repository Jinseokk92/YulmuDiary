"use client";

import { useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { api } from "@/lib/api";
import type { DiaryPostResponse, DiaryPostPageResponse } from "@/types";
import DiaryCard from "./DiaryCard";
import DiaryPostSkeleton from "./DiaryPostSkeleton";
import EmptyState from "@/components/ui/EmptyState";

interface DiaryFeedProps {
  initialItems: DiaryPostResponse[];
  initialNextCursor: number | null;
  initialHasNext: boolean;
  babyId: number;
}

export default function DiaryFeed({
  initialItems,
  initialNextCursor,
  initialHasNext,
  babyId,
}: DiaryFeedProps) {
  const [posts, setPosts] = useState<DiaryPostResponse[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasNext || nextCursor === null) return;

    setLoading(true);
    setError(null);

    try {
      const page = await api.get<DiaryPostPageResponse>(
        `/api/diary-posts?babyId=${babyId}&cursor=${nextCursor}&size=10`
      );

      setPosts((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
      setHasNext(page.hasNext);
    } catch (e) {
      setError(e instanceof Error ? e.message : "피드를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [loading, hasNext, nextCursor, babyId]);

  // 삭제: posts state에서 즉시 제거
  const deletePost = useCallback((postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const { ref: sentinelRef } = useInView({
    threshold: 0,
    rootMargin: "200px",
    onChange: (inView) => {
      if (inView) loadMore();
    },
  });

  if (posts.length === 0 && !loading) {
    return (
      <EmptyState
        title="아직 일기가 없어요"
        description="첫 번째 일기를 작성해 보세요!"
      />
    );
  }

  return (
    <div className="flex flex-col py-4">
      {posts.map((post) => (
        <DiaryCard key={post.id} post={post} onDelete={deletePost} />
      ))}

      {loading && <DiaryPostSkeleton />}

      {error && (
        <div className="py-6 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button
            onClick={loadMore}
            className="text-sm text-primary-600 font-medium hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {hasNext && !loading && (
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      )}

      {!hasNext && posts.length > 0 && (
        <p className="py-8 text-center text-xs text-gray-300 dark:text-slate-600">
          모든 일기를 불러왔어요
        </p>
      )}
    </div>
  );
}
