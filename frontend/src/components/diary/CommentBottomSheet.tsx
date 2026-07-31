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
import { motion, useMotionValue, animate } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import { useUiStore } from "@/stores/uiStore";
import type { CommentResponse } from "@/types";
import CommentSection from "./CommentSection";
import ConfirmModal from "@/components/ui/ConfirmModal";

const QUICK_EMOJIS = ["❤️", "😍", "👍", "😂", "😭", "🥰", "🙌", "✨"] as const;

// isOpen 제거 — 부모에서 조건부 렌더링으로 마운트/언마운트 제어
interface CommentBottomSheetProps {
  onClose: () => void;
  postId: number;
  initialCommentCount: number;
  onCommentCountChange?: (delta: number) => void;
}

export interface CommentBottomSheetHandle {
  focusInput: () => void;
}

const CommentBottomSheet = forwardRef<CommentBottomSheetHandle, CommentBottomSheetProps>(
  ({ onClose, postId, initialCommentCount, onCommentCountChange }, ref) => {
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

    // ─── dismiss 드래그 ──────────────────────────────────────────────
    const handleAreaRef = useRef<HTMLDivElement>(null);
    const dismissY = useMotionValue(0);

    // ─── 시트 위치/높이 (visualViewport 기반) ───────────────────────
    // iOS: window.innerHeight 고정, visualViewport.height가 줄어듦
    // Android: window.innerHeight 자체가 줄어들어 kbh=0이지만 fixed 위치가 자연히 조정됨
    // 문제: height:"75svh"(고정) + bottom:kbh → 합계 > window.innerHeight → 시트 상단 넘침
    // 해결: 시트 높이를 vv.height 기준으로 제한
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [sheetHeight, setSheetHeight] = useState<string | number>("75svh");

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

    // ─── visualViewport 기반 시트 위치·높이 통합 계산 ────────────────
    useEffect(() => {
      const vv = window.visualViewport;
      if (!vv) return;

      // 마운트 시점의 window.innerHeight를 목표 높이 기준으로 사용
      // (이후 키보드가 올라와도 initH는 변하지 않음)
      const initH = window.innerHeight;

      const handleViewportChange = () => {
        // 키보드 높이 = 전체 창 높이 - 현재 보이는 영역 높이 - 스크롤 오프셋
        const kbh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        setKeyboardHeight(kbh);

        // 시트 높이: 목표(initH * 0.75 ≈ 75svh)와 가시 영역 96%의 최솟값
        // 키보드가 열려 vv.height가 줄면 시트도 같이 줄어들어 넘침 방지
        const targetH = initH * 0.75;
        const maxH = Math.floor(vv.height * 0.96);
        setSheetHeight(Math.min(targetH, maxH));

        if (kbh > 0) scrollToBottom();
      };

      // 마운트 시 즉시 계산 (resize/scroll 이벤트 전에 초기값 설정)
      handleViewportChange();

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

    // ─── 언마운트 시 isCommentOpen 정리 ─────────────────────────────
    // 페이지 이탈 등 비정상 경로로 unmount될 때도 uiStore 누수 방지
    const setCommentOpen = useUiStore((s) => s.setCommentOpen);
    useEffect(() => {
      return () => {
        setCommentOpen(false);
      };
    }, [setCommentOpen]);

    // ─── 부모 스크롤 잠금 ───────────────────────────────────────────
    // - position:fixed + overflow:hidden : 배경 스크롤 차단
    // - touchmove preventDefault : document 레벨에서 모든 터치 스크롤 차단
    // - 스크롤 영역 내부는 onTouchMove stopPropagation으로 document 리스너 도달 차단
    useEffect(() => {
      const scrollY = window.scrollY;
      console.log("[CommentBottomSheet] 스크롤 잠금 시작 — scrollY:", scrollY, "파일: CommentBottomSheet.tsx");

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      console.log("[CommentBottomSheet] body.position:", document.body.style.position, "body.top:", document.body.style.top);

      const preventTouchMove = (e: TouchEvent) => {
        console.log("[CommentBottomSheet] touchmove 차단 — target:", (e.target as HTMLElement)?.tagName, (e.target as HTMLElement)?.className?.slice?.(0, 40));
        e.preventDefault();
      };

      document.addEventListener("touchmove", preventTouchMove, { passive: false });

      return () => {
        console.log("[CommentBottomSheet] 스크롤 잠금 해제 — scrollY 복원:", scrollY);
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        document.removeEventListener("touchmove", preventTouchMove);
        window.scrollTo(0, scrollY);
      };
    }, []);

    // ─── 핸들 drag-to-dismiss ────────────────────────────────────────
    useEffect(() => {
      const handle = handleAreaRef.current;
      if (!handle) return;

      let startY = 0;

      const onStart = (e: TouchEvent) => {
        startY = e.touches[0].clientY;
      };

      const onMove = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const dy = e.touches[0].clientY - startY;
        if (dy > 0) {
          dismissY.set(dy);
        }
      };

      const onEnd = () => {
        if (dismissY.get() > 80) {
          animate(dismissY, window.innerHeight * 1.5, {
            duration: 0.2,
            ease: "easeIn",
          }).then(onClose);
        } else {
          animate(dismissY, 0, { type: "spring", stiffness: 400, damping: 40 });
        }
      };

      handle.addEventListener("touchstart", onStart, { passive: true });
      handle.addEventListener("touchmove", onMove, { passive: false });
      handle.addEventListener("touchend", onEnd, { passive: true });

      return () => {
        handle.removeEventListener("touchstart", onStart);
        handle.removeEventListener("touchmove", onMove);
        handle.removeEventListener("touchend", onEnd);
      };
    }, [onClose, dismissY]);

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
          onCommentCountChange?.(1);
        } catch {
          setComments(prevComments);
          alert("댓글 저장에 실패했습니다.");
        } finally {
          setIsSubmitting(false);
        }
      },
      [input, currentUser, isSubmitting, postId, scrollToBottom, onCommentCountChange]
    );

    // ─── admin 타인 댓글 삭제 확인 ─────────────────────────────────
    const [adminDeleteTarget, setAdminDeleteTarget] = useState<number | null>(null);
    const [isAdminDeleting, setIsAdminDeleting] = useState(false);

    // ─── 댓글 삭제 (낙관적 업데이트) ───────────────────────────────
    const executeDelete = useCallback(
      async (commentId: number) => {
        if (!currentUser) return;
        const prevComments = [...commentsRef.current];
        setComments((prev) => prev.filter((c) => c.id !== commentId));

        try {
          await api.delete(`/api/diary-posts/${postId}/comments/${commentId}`);
          onCommentCountChange?.(-1);
        } catch {
          setComments(prevComments);
          alert("댓글 삭제에 실패했습니다.");
        }
      },
      [postId, currentUser, onCommentCountChange]
    );

    const handleDelete = useCallback(
      (commentId: number) => {
        if (!currentUser) return;
        const target = commentsRef.current.find((c) => c.id === commentId);
        // admin이 타인 댓글 삭제 → 확인 다이얼로그
        if (currentUser.isAdmin && target && target.authorId !== currentUser.id) {
          setAdminDeleteTarget(commentId);
          return;
        }
        executeDelete(commentId);
      },
      [currentUser, executeDelete]
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
          className="fixed inset-0 bg-black/40 dark:bg-black/65"
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
          animate={{ y: 0, transition: { type: "spring", stiffness: 400, damping: 40 } }}
          exit={{ y: "100%", transition: { duration: 0.25, ease: "easeIn" } }}
          className="fixed left-0 right-0 mx-auto w-full max-w-lg
                      bg-white dark:bg-[#121212] rounded-t-3xl
                      border-t border-gray-100 dark:border-[#262626]
                      shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-none
                      flex flex-col box-border"
          style={{
            y: dismissY,
            bottom: keyboardHeight,
            height: sheetHeight,
            zIndex: 101,
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* ── Drag 영역: 핸들 바 + 헤더 ── */}
          <div ref={handleAreaRef} style={{ touchAction: "none" }} className="shrink-0">
          {/* ── 핸들 바 ── */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
          </div>

          {/* ── Header (고정) ── */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-[#262626]">
            <span className="text-sm font-semibold text-gray-800 dark:text-[#F5F5F5]">댓글</span>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 dark:text-[#737373] hover:text-gray-600 dark:hover:text-[#A8A8A8] transition-colors"
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
          </div>{/* ── Drag 영역 끝 ── */}

          {/* ── Scrollable Content (flex-1: 남은 공간 전부 차지) ── */}
          <div
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ touchAction: "pan-y" }}
            onTouchMove={(e) => e.stopPropagation()}
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
            <div className="shrink-0 border-t border-gray-100 dark:border-[#262626]">
              {/* 이모지 퀵 바 */}
              <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 overflow-x-auto scrollbar-none">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInput((prev) => prev + emoji)}
                    className="text-xl shrink-0 w-9 h-9 flex items-center justify-center
                               rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2A2A] active:scale-110
                               transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* 입력폼 */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 px-4 pt-1"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
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
                             placeholder:text-gray-300 dark:placeholder:text-[#737373]
                             text-gray-700 dark:text-[#F5F5F5] py-1"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSubmitting}
                  className="text-sm font-semibold text-primary-500 disabled:text-gray-300
                             dark:disabled:text-[#737373] hover:text-primary-600 transition-colors shrink-0"
                >
                  게시
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </>
    );

    return createPortal(
      <>
        {sheet}
        <ConfirmModal
          open={adminDeleteTarget !== null}
          title="댓글을 삭제할까요?"
          description="관리자 권한으로 다른 멤버의 댓글을 삭제합니다."
          confirmLabel="삭제"
          loading={isAdminDeleting}
          zIndex={200}
          onConfirm={async () => {
            if (adminDeleteTarget === null) return;
            setIsAdminDeleting(true);
            await executeDelete(adminDeleteTarget);
            setIsAdminDeleting(false);
            setAdminDeleteTarget(null);
          }}
          onCancel={() => setAdminDeleteTarget(null)}
        />
      </>,
      document.body
    );
  }
);

CommentBottomSheet.displayName = "CommentBottomSheet";
export default CommentBottomSheet;
