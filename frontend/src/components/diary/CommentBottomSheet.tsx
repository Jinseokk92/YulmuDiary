"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import type { CommentResponse } from "@/types";
import CommentSection from "./CommentSection";

const QUICK_EMOJIS = ["❤️", "😍", "👍", "😂", "😭", "🥰", "🙌", "✨"] as const;

// isOpen 제거 — 부모에서 조건부 렌더링으로 마운트/언마운트 제어
interface CommentBottomSheetProps {
  onClose: () => void;
  postId: number;
  initialCommentCount: number;
}

export interface CommentBottomSheetHandle {
  focusInput: () => void;
}

const CommentBottomSheet = forwardRef<CommentBottomSheetHandle, CommentBottomSheetProps>(
  ({ onClose, postId, initialCommentCount }, ref) => {
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

    // ─── 스크롤 영역 ref ─────────────────────────────────────────────
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // ─── 키보드 높이 (visualViewport 기반) ───────────────────────────
    // iOS: window.innerHeight 고정, visualViewport.height가 줄어듦
    // Android: window.innerHeight 자체가 줄어들어 kbh=0으로 계산되지만
    //          시트가 자연스럽게 따라 올라가므로 문제 없음
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // 중복 fetch 방지 ref
    const isFetchingRef = useRef(false);

    // 낙관적 업데이트 롤백용 snapshot ref
    const commentsRef = useRef<CommentResponse[]>([]);
    useEffect(() => {
      commentsRef.current = comments;
    });

    // ─── 무한 스크롤 sentinel ────────────────────────────────────────
    const { ref: loadMoreRef, inView } = useInView({
      threshold: 0.5,
      skip: !hasNext || isLoading,
    });
    const sentinelRef = useRef<HTMLDivElement>(null);
    const setsentinel = useCallback(
      (node: HTMLDivElement | null) => {
        (sentinelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        loadMoreRef(node);
      },
      [loadMoreRef]
    );

    // ─── 댓글 목록 최하단 스크롤 ────────────────────────────────────
    const scrollToBottom = useCallback(() => {
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      });
    }, []);

    // ─── visualViewport 기반 키보드 높이 추적 ────────────────────────
    useEffect(() => {
      const vv = window.visualViewport;
      if (!vv) return;

      const handleViewportChange = () => {
        // 키보드 높이 = 전체 창 높이 - 현재 보이는 영역 - 스크롤 오프셋
        const kbh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        setKeyboardHeight(kbh);
        // 키보드 올라오면 댓글 최하단으로 스크롤
        if (kbh > 0) scrollToBottom();
      };

      vv.addEventListener("resize", handleViewportChange);
      vv.addEventListener("scroll", handleViewportChange);

      return () => {
        vv.removeEventListener("resize", handleViewportChange);
        vv.removeEventListener("scroll", handleViewportChange);
      };
    }, [scrollToBottom]);

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
    // 컴포넌트 마운트 시 항상 잠금 (조건부 렌더링으로 관리)
    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }, []);

    // ─── 마운트 시: 초기 fetch + 입력창 포커스 (애니메이션 후) ──────
    useEffect(() => {
      const timer = setTimeout(() => {
        fetchComments();
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── 핸들 노출 ──────────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        focusInput: () => inputRef.current?.focus(),
      }),
      []
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
        scrollToBottom();

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
      [input, currentUser, isSubmitting, postId, scrollToBottom]
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
    const sheet = (
      <>
        {/* 반투명 오버레이 — 클릭 시 닫힘 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40"
          style={{ zIndex: 100 }}
          onClick={onClose}
        />

        {/*
          바텀 시트 — Portal로 document.body에 마운트하여 부모 transform/overflow 영향 차단
          - max-w-lg mx-auto: 데스크톱에서 중앙 정렬, 모바일은 100% 너비
          - bottom: keyboardHeight → 키보드가 올라오면 시트도 함께 올라감
          - height: 75svh (svh = Small Viewport Height, 키보드 무관 최소 뷰포트 기준)
        */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="fixed left-0 right-0 mx-auto w-full max-w-lg
                      bg-white dark:bg-slate-900 rounded-t-3xl
                      border-t border-gray-100 dark:border-slate-800
                      shadow-[0_-4px_24px_rgba(0,0,0,0.08)]
                      flex flex-col box-border"
          style={{
            bottom: keyboardHeight,
            height: "75svh",
            zIndex: 101,
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* ── 핸들 바 ── */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-slate-700" />
          </div>

          {/* ── Header (고정) ── */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-slate-800 shrink-0">
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">댓글</span>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Scrollable Content (flex-1: 남은 공간 전부 차지) ── */}
          <div
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto overscroll-contain"
          >
            <CommentSection
              comments={comments}
              isLoading={isLoading}
              currentUser={currentUser}
              onDelete={handleDelete}
            />
            {/* 무한 스크롤 sentinel */}
            <div ref={setsentinel} className="h-4" />
          </div>

          {/* ── Fixed Footer: 이모지 퀵 바 + 입력폼 ── */}
          {currentUser && (
            <div className="shrink-0 border-t border-gray-100 dark:border-slate-800">
              {/* 이모지 퀵 바 */}
              <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 overflow-x-auto scrollbar-none">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInput((prev) => prev + emoji)}
                    className="text-xl shrink-0 w-9 h-9 flex items-center justify-center
                               rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-110
                               transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* 입력폼 */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 px-4 pb-4 pt-1"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={scrollToBottom}
                  placeholder="댓글 달기..."
                  disabled={isSubmitting}
                  className="flex-1 text-sm bg-transparent border-none outline-none
                             placeholder:text-gray-300 dark:placeholder:text-slate-600
                             text-gray-700 dark:text-slate-200 py-1"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSubmitting}
                  className="text-sm font-semibold text-primary-500 disabled:text-gray-300
                             dark:disabled:text-slate-600 hover:text-primary-600 transition-colors shrink-0"
                >
                  게시
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </>
    );

    return createPortal(sheet, document.body);
  }
);

CommentBottomSheet.displayName = "CommentBottomSheet";
export default CommentBottomSheet;
