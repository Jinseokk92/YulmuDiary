"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useInView } from "react-intersection-observer";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import type { CommentResponse } from "@/types";
import CommentSection from "./CommentSection";

interface CommentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  initialCommentCount: number;
}

export interface CommentBottomSheetHandle {
  focusInput: () => void;
  openComments: () => void;
}

const CommentBottomSheet = forwardRef<CommentBottomSheetHandle, CommentBottomSheetProps>(
  ({ isOpen, onClose, postId, initialCommentCount }, ref) => {
    const { currentUser } = useUser();

    // ─── 댓글 데이터 상태 ───────────────────────────────────────────
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [hasNext, setHasNext] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ─── 입력 상태 ──────────────────────────────────────────────────
    const [input, setInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 중복 fetch 방지 ref
    const isFetchingRef = useRef(false);

    // 낙관적 업데이트 롤백용 snapshot ref
    const commentsRef = useRef<CommentResponse[]>([]);
    useEffect(() => {
      commentsRef.current = comments;
    });

    // ─── 무한 스크롤 sentinel (바텀 시트 스크롤 영역 하단) ──────────
    // loadMoreRef: 라이브러리 RefCallback, sentinelRef: HTMLDivElement 타입 명시
    const { ref: loadMoreRef, inView } = useInView({
      threshold: 0.5,
      skip: !isOpen || !hasNext || isLoading,
    });
    const sentinelRef = useRef<HTMLDivElement>(null);
    const setsentinel = useCallback(
      (node: HTMLDivElement | null) => {
        (sentinelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        loadMoreRef(node);
      },
      [loadMoreRef]
    );

    // ─── 댓글 fetch (커서 기반 페이징) ─────────────────────────────
    const fetchComments = useCallback(
      async (cursorId?: number | null) => {
        if (!postId || isFetchingRef.current) return;
        isFetchingRef.current = true;
        setIsLoading(true);

        try {
          const query = cursorId ? `?cursor=${cursorId}&size=10` : "?size=10";
          const response = await api.get<any>(
            `/api/diary-posts/${postId}/comments${query}`
          );

          let items: CommentResponse[] = [];
          let next: number | null = null;
          let more = false;

          if (Array.isArray(response)) {
            items = response;
          } else if (response && typeof response === "object") {
            items = response.items || response.content || [];
            next = response.nextCursor || response.nextCursorId || null;
            more = response.hasNext || response.last === false || false;
          }

          setComments((prev) => (cursorId ? [...prev, ...items] : items));
          setNextCursor(next);
          setHasNext(more);
          setIsLoaded(true);
        } catch {
          // 댓글 로드 실패 시 무시
        } finally {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      },
      [postId]
    );

    // ─── postId 변경 시 상태 리셋 ───────────────────────────────────
    useEffect(() => {
      if (!postId) return;
      setComments([]);
      setNextCursor(null);
      setHasNext(false);
      setIsLoaded(false);
    }, [postId]);

    // ─── 무한 스크롤 트리거 ─────────────────────────────────────────
    useEffect(() => {
      if (inView && hasNext && !isLoading) {
        fetchComments(nextCursor);
      }
    }, [inView, hasNext, isLoading, nextCursor, fetchComments]);

    // ─── 부모 스크롤 잠금 (Scroll Bleeding 방지) ────────────────────
    useEffect(() => {
      if (!isOpen) return;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

    // ─── 시트 열림: 초기 fetch + 입력창 포커스 (애니메이션 후) ──────
    useEffect(() => {
      if (!isOpen) return;
      const timer = setTimeout(() => {
        if (!isLoaded) fetchComments();
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }, [isOpen, isLoaded, fetchComments]);

    // ─── 핸들 노출 ──────────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        focusInput: () => inputRef.current?.focus(),
        openComments: () => {
          if (!isLoaded) fetchComments();
        },
      }),
      [isLoaded, fetchComments]
    );

    // ─── 댓글 작성 (낙관적 업데이트) ───────────────────────────────
    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || !currentUser || isSubmitting) return;

        const prevComments = [...commentsRef.current];
        const tempId = -Date.now();
        const optimisticComment: CommentResponse = {
          id: tempId,
          authorId: currentUser.id,
          nickname: currentUser.name,
          content: trimmed,
          createdAt: new Date().toISOString(),
        };

        setComments((prev) => [...prev, optimisticComment]);
        setInput("");
        setIsSubmitting(true);

        try {
          const created = await api.post<CommentResponse>(
            `/api/diary-posts/${postId}/comments`,
            { content: trimmed }
          );
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? created : c))
          );
        } catch {
          setComments(prevComments);
          alert("댓글 저장에 실패했습니다.");
        } finally {
          setIsSubmitting(false);
        }
      },
      [input, currentUser, isSubmitting, postId]
    );

    // ─── 댓글 삭제 (낙관적 업데이트) ───────────────────────────────
    const handleDelete = useCallback(
      async (commentId: number) => {
        if (!currentUser) return;
        const prevComments = [...commentsRef.current];
        setComments((prev) => prev.filter((c) => c.id !== commentId));

        try {
          await api.delete(`/api/diary-posts/${postId}/comments/${commentId}`);
        } catch {
          setComments(prevComments);
          alert("댓글 삭제에 실패했습니다.");
        }
      },
      [postId, currentUser]
    );

    // ─── 렌더 ───────────────────────────────────────────────────────
    return (
      // 투명 오버레이 — 클릭 감지용, dim 없음 / flex로 바텀 시트를 하단 중앙 정렬
      <div
        className={`fixed inset-0 z-50 bg-transparent flex justify-center items-end ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={onClose}
      >
        {/* 바텀 시트 컨테이너 — 레이아웃과 동일한 max-w-lg로 너비 제한 */}
        <div
          className={`w-full max-w-lg h-[75vh] bg-white rounded-t-3xl
                      border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]
                      flex flex-col box-border
                      transform transition-transform duration-300
                      ${isOpen ? "translate-y-0" : "translate-y-full"}`}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* 핸들 바 */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* 헤더 — 고정 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
            <span className="text-sm font-semibold text-gray-800">댓글</span>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 댓글 목록 — 독립 스크롤 */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <CommentSection
              comments={comments}
              isLoading={isLoading}
              currentUser={currentUser}
              onDelete={handleDelete}
            />

            {/* 무한 스크롤 sentinel (HTMLDivElement 타입 명시) */}
            <div ref={setsentinel} className="h-4" />
          </div>

          {/* 댓글 입력 폼 — 고정 하단 */}
          {currentUser && (
            <form
              onSubmit={handleSubmit}
              className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-gray-100"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="댓글 달기..."
                disabled={isSubmitting}
                className="flex-1 text-sm bg-transparent border-none outline-none
                           placeholder:text-gray-300 text-gray-700 py-1"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSubmitting}
                className="text-sm font-semibold text-primary-500 disabled:text-gray-300
                           hover:text-primary-600 transition-colors shrink-0"
              >
                게시
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }
);

CommentBottomSheet.displayName = "CommentBottomSheet";
export default CommentBottomSheet;
