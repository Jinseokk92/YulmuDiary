"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useTheme } from "next-themes";
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
  const highlightParam = searchParams.get("highlightId");
  const highlightId = highlightParam ? parseInt(highlightParam, 10) : null;

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [filters, setFilters] = useState<DiaryFilters>(DEFAULT_DIARY_FILTERS);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [data, setData] = useState<DiaryPostPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      babyId: String(BABY_ID),
      page: String(currentPage),
      size: String(PAGE_SIZE),
      sort: filters.sort,
    });
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.userId) params.set("userId", String(filters.userId));
    if (debouncedKeyword.trim()) params.set("keyword", debouncedKeyword.trim());

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
  }, [currentPage, refreshKey, filters, debouncedKeyword]);

  const handleFiltersChange = useCallback(
    (newFilters: DiaryFilters) => {
      setFilters(newFilters);
      router.push("/diary?page=1");
    },
    [router]
  );

  const handleKeywordChange = useCallback(
    (value: string) => {
      setKeyword(value);
      // 키워드 바뀌면 1페이지로
      if (currentPage !== 1) {
        router.push("/diary?page=1");
      }
    },
    [currentPage, router]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      // #을 제거한 순수 태그명으로 검색
      const plain = tag.startsWith("#") ? tag.slice(1) : tag;
      setKeyword(plain);
      router.push("/diary?page=1");
      // 검색바로 스크롤
      setTimeout(() => {
        searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        searchInputRef.current?.focus();
      }, 100);
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
      <div className="px-4 pt-2 pb-0">
        <FilterBar filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* 검색바 */}
      <div className="px-4 pt-2 pb-1">
        <div
          className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-colors
            ${isDark
              ? "bg-[#1A1A1A] border border-[#262626]"
              : "bg-gray-50 border border-gray-200"
            }`}
        >
          <Search
            size={16}
            className={`shrink-0 ${isDark ? "text-[#737373]" : "text-gray-400"}`}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="내용, 해시태그, 작성자 검색"
            className={`flex-1 min-w-0 bg-transparent text-sm outline-none
              ${isDark
                ? "text-[#F5F5F5] placeholder:text-[#737373]"
                : "text-gray-800 placeholder:text-gray-400"
              }`}
          />
          {keyword && (
            <button
              type="button"
              onClick={() => handleKeywordChange("")}
              aria-label="검색어 지우기"
              className={`shrink-0 p-0.5 rounded-full transition-colors
                ${isDark
                  ? "text-[#737373] hover:text-[#A8A8A8]"
                  : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <X size={14} />
            </button>
          )}
        </div>
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
          highlightId={highlightId}
          onTagClick={handleTagClick}
        />
      )}
    </div>
  );
}
