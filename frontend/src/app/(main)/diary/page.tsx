"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { DiaryPostPaginatedResponse } from "@/types";
import DiaryFeed from "@/components/diary/DiaryFeed";
import DiaryPostSkeleton from "@/components/diary/DiaryPostSkeleton";
import FilterBar, {
  type DiaryFilters,
  DEFAULT_DIARY_FILTERS,
} from "@/components/diary/FilterBar";

const BABY_ID = 1;
const PAGE_SIZE = 5;

export default function DiaryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get("page");
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [filters, setFilters] = useState<DiaryFilters>(DEFAULT_DIARY_FILTERS);
  const [data, setData] = useState<DiaryPostPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // mode, userName은 UI 전용이므로 API 파라미터에 포함하지 않음
    const params = new URLSearchParams({
      babyId: String(BABY_ID),
      page: String(currentPage),
      size: String(PAGE_SIZE),
      sort: filters.sort,
    });
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.userId) params.set("userId", String(filters.userId));

    api
      .get<DiaryPostPaginatedResponse>(`/api/diary-posts/pages?${params}`)
      .then((result) => {
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
  }, [currentPage, refreshKey, filters]);

  const handleFiltersChange = useCallback(
    (newFilters: DiaryFilters) => {
      setFilters(newFilters);
      router.push("/diary?page=1");
    },
    [router]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 800));
  }, []);

  const handleDelete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div>
      <div className="px-4 pt-3 pb-1">
        <FilterBar filters={filters} onChange={handleFiltersChange} />
      </div>

      {loading ? (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <DiaryPostSkeleton key={i} />
          ))}
        </div>
      ) : !data ? null : (
        <DiaryFeed
          data={data}
          currentPage={currentPage}
          onRefresh={handleRefresh}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
