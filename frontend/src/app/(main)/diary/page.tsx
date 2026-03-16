"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { DiaryPostPaginatedResponse } from "@/types";
import DiaryFeed from "@/components/diary/DiaryFeed";
import DiaryPostSkeleton from "@/components/diary/DiaryPostSkeleton";

const BABY_ID = 1;
const PAGE_SIZE = 5;

export default function DiaryPage() {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [data, setData] = useState<DiaryPostPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    console.log("[DiaryPage] useEffect 실행 — page:", currentPage, "refreshKey:", refreshKey);
    api
      .get<DiaryPostPaginatedResponse>(
        `/api/diary-posts/pages?babyId=${BABY_ID}&page=${currentPage}&size=${PAGE_SIZE}`
      )
      .then((result) => {
        console.log("[DiaryPage] 데이터 수신 — content 개수:", result?.content?.length, result);
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[DiaryPage] 데이터 로드 실패:", err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentPage, refreshKey]);

  const handleRefresh = useCallback(async () => {
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 800));
  }, []);

  const handleDelete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, i) => (
          <DiaryPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <DiaryFeed
      data={data}
      currentPage={currentPage}
      onRefresh={handleRefresh}
      onDelete={handleDelete}
    />
  );
}
