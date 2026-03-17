"use client";

import { memo, useState, useCallback, useRef, useEffect, type RefObject, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import type { DiaryPostResponse, ReactionResponse } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import { useUiStore } from "@/stores/uiStore";
import ImageCarousel from "./ImageCarousel";
import ImageViewer from "./ImageViewer";
import CommentBottomSheet, { type CommentBottomSheetHandle } from "./CommentBottomSheet";
import ReactionUsersSheet from "./ReactionUsersSheet";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UserAvatar from "@/components/ui/UserAvatar";

interface DiaryCardProps {
  post: DiaryPostResponse;
  onDelete: (postId: number) => void;
  disableNativeDrag?: boolean;
  highlight?: boolean;
}

interface ActionIconButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className: string;
  ariaLabel: string;
  disableNativeDrag: boolean;
  onPreventDrag: (e: React.DragEvent) => void;
  children: ReactNode;
}

function ActionIconButton({
  onClick,
  disabled,
  className,
  ariaLabel,
  disableNativeDrag,
  onPreventDrag,
  children,
}: ActionIconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      draggable={disableNativeDrag ? false : undefined}
      onDragStart={disableNativeDrag ? onPreventDrag : undefined}
      className={`${className} ${disableNativeDrag ? "select-none touch-manipulation" : ""}`}
    >
      {children}
    </button>
  );
}

function DiaryCardInner({ post, onDelete, disableNativeDrag = false, highlight = false }: DiaryCardProps) {
  const { currentUser } = useUser();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const commentSectionRef = useRef<CommentBottomSheetHandle>(null);
  const cardRef = useRef<HTMLElement>(null);
  const isAuthor = currentUser?.id === post.authorId;
  const isAdmin = currentUser?.isAdmin === true;

  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  // ─── 하이라이트 (알림에서 진입 시) ──────────────────────────────────
  const [isHighlighted, setIsHighlighted] = useState(highlight);

  useEffect(() => {
    if (!highlight) return;
    setIsHighlighted(true);
    const scrollTimer = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    const fadeTimer = setTimeout(() => setIsHighlighted(false), 1500);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(fadeTimer);
    };
  }, [highlight]);

  // ─── 삭제 상태 ─────────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ─── 댓글 시트 ─────────────────────────────────────────────────────
  const setCommentOpen = useUiStore((s) => s.setCommentOpen);
  const isImageViewerOpen = useUiStore((s) => s.isImageViewerOpen);
  const setImageViewerOpen = useUiStore((s) => s.setImageViewerOpen);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const handleBubbleClick = useCallback(() => {
    setCommentOpen(true);
    setIsCommentSheetOpen(true);
  }, [setCommentOpen]);
  const handleCommentClose = useCallback(() => {
    setCommentOpen(false);
    setIsCommentSheetOpen(false);
  }, [setCommentOpen]);

  const handlePreventDrag = useCallback((e: React.DragEvent) => {
    if (!disableNativeDrag) return;
    e.preventDefault();
  }, [disableNativeDrag]);

  // ─── 수정 상태 ─────────────────────────────────────────────────────
  // 수정 성공 후 props를 기다리지 않고 즉시 반영하기 위한 로컬 표시 상태
  const [displayContent, setDisplayContent] = useState(post.content);
  const [displayTag, setDisplayTag] = useState<string | null>(post.milestoneTag);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTag, setEditTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleEditStart = useCallback(() => {
    setEditContent(displayContent);
    setEditTag(displayTag ?? "");
    setIsEditing(true);
  }, [displayContent, displayTag]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleEditSave = useCallback(async () => {
    // 방어 로직: 빈 값 또는 공백만 있는 경우 전송 차단
    if (!editContent.trim()) return;
    if (!currentUser) return;

    setIsSaving(true);
    try {
      await api.put(
        `/api/diary-posts/${post.id}`,
        {
          babyId: post.babyId,
          content: editContent.trim(),
          milestoneTag: editTag.trim() || undefined,
          mediaUrls: post.media.map((m) => m.url),
          mediaThumbnailUrls: post.media.map((m) => m.thumbnailUrl ?? m.url),
        }
      );
      setDisplayContent(editContent.trim());
      setDisplayTag(editTag.trim() || null);
      setIsEditing(false);
    } catch {
      alert("수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [editContent, editTag, currentUser, post.id, post.babyId, post.media]);

  // ─── 삭제 핸들러 ───────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!currentUser) return;
    setDeleting(true);
    try {
      await api.delete(`/api/diary-posts/${post.id}`);
      onDelete(post.id);
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }, [post.id, onDelete, currentUser]);

  // ─── 이미지 뷰어 상태 ──────────────────────────────────────────────
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleImageClick = useCallback((index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
    setImageViewerOpen(true);
  }, [setImageViewerOpen]);

  const handleViewerClose = useCallback(() => {
    setViewerOpen(false);
    setImageViewerOpen(false);
  }, [setImageViewerOpen]);

  // 안전장치: PTR 등 외부 원인으로 isImageViewerOpen이 false가 되면 로컬 뷰어도 강제 닫기
  // (예: soft refresh 직전 DiaryFeed에서 setImageViewerOpen(false) 호출 시)
  useEffect(() => {
    if (!isImageViewerOpen && viewerOpen) {
      setViewerOpen(false);
    }
  }, [isImageViewerOpen, viewerOpen]);

  // ─── 좋아요(Heart) 상태 ────────────────────────────────────────────
  const [reactions, setReactions] = useState<ReactionResponse[]>(post.reactions ?? []);
  const [isLiking, setIsLiking] = useState(false);
  const [showReactionUsers, setShowReactionUsers] = useState(false);

  // ─── 캐러셀 더블탭 하트 오버레이 ───────────────────────────────────
  const [carouselHeartVisible, setCarouselHeartVisible] = useState(false);
  const [carouselHeartKey, setCarouselHeartKey] = useState(0);
  const carouselHeartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (carouselHeartTimerRef.current) clearTimeout(carouselHeartTimerRef.current);
    };
  }, []);

  const isLiked = currentUser
    ? reactions.some((r) => r.emoji === "❤️" && r.userId === currentUser.id)
    : false;
  const likeCount = reactions.filter((r) => r.emoji === "❤️").length;

  const handleToggleLike = useCallback(async () => {
    if (!currentUser || isLiking) return;
    setIsLiking(true);
    const prevReactions = reactions;
    const existing = reactions.find(
      (r) => r.emoji === "❤️" && r.userId === currentUser.id
    );

    if (existing) {
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const optimistic: ReactionResponse = {
        id: -Date.now(),
        userId: currentUser.id,
        emoji: "❤️",
        createdAt: new Date().toISOString(),
      };
      setReactions((prev) => [...prev, optimistic]);
    }

    try {
      const result = await api.post<ReactionResponse | null>(
        `/api/diary-posts/${post.id}/reactions`,
        { emoji: "❤️" }
      );
      if (result) {
        setReactions((prev) =>
          prev.map((r) => (r.id < 0 && r.emoji === "❤️" ? result : r))
        );
      }
    } catch {
      setReactions(prevReactions);
    } finally {
      setIsLiking(false);
    }
  }, [currentUser, post.id, reactions, isLiking]);

  // ─── 더블탭 좋아요 ─────────────────────────────────────────────────
  // 이미 좋아요가 눌린 상태에서는 취소하지 않음 (Instagram 패턴: 하트는 항상 표시)
  const handleDoubleTapLike = useCallback(() => {
    if (!isLiked) handleToggleLike();
  }, [isLiked, handleToggleLike]);

  // 캐러셀 더블탭: 하트 오버레이 + 좋아요
  const handleCarouselDoubleTap = useCallback(() => {
    setCarouselHeartKey((k) => k + 1);
    setCarouselHeartVisible(true);
    if (carouselHeartTimerRef.current) clearTimeout(carouselHeartTimerRef.current);
    carouselHeartTimerRef.current = setTimeout(() => {
      setCarouselHeartVisible(false);
    }, 750);
    handleDoubleTapLike();
  }, [handleDoubleTapLike]);

  // ─── 콘텐츠 분리 (첫 줄 = 제목) ──────────────────────────────────
  const lines = displayContent.split("\n");
  const title = lines.length > 1 ? lines[0] : null;
  const body = lines.length > 1 ? lines.slice(1).join("\n") : displayContent;

  return (
    <>
      <article
        ref={cardRef as RefObject<HTMLElement>}
        className={`border-b pb-8 mb-8 last:border-0 last:mb-0 backdrop-blur-sm
          ${isDark ? "border-slate-800" : "border-gray-100"}`}
        style={{
          backgroundColor: isHighlighted
            ? (isDark ? "rgba(120, 53, 15, 0.55)" : "#fff7ed")
            : (isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)"),
          transition: "background-color 1.5s ease",
        }}
      >

        {/* ── 상단: 프로필 + 수정/삭제 버튼 ── */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              nickname={post.authorNickname}
              profileImageUrl={post.authorProfileImageUrl}
              size="md"
            />
            <div className="flex flex-col">
              <span className={`text-sm font-semibold leading-none ${isDark ? "text-slate-100" : "text-gray-900"}`}>
                {post.authorNickname}
              </span>
              <span className={`text-[10px] mt-1 uppercase tracking-wider ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                Family Member
              </span>
            </div>
          </div>

          {/* 작성자 또는 어드민에게 노출, 수정 모드 중엔 숨김 */}
          {(isAuthor || isAdmin) && !isEditing && (
            <div className="flex items-center">
              {/* 수정 — 작성자에게만 */}
              {isAuthor && (
                <button
                  onClick={handleEditStart}
                  className="p-2 text-gray-300 dark:text-slate-600 hover:text-primary-500 transition-colors"
                  aria-label="수정"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                </button>
              )}
              {/* 삭제 — 작성자 또는 어드민 */}
              <button
                onClick={() => setConfirmOpen(true)}
                className="p-2 text-gray-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                aria-label="삭제"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── 중단: 사진 ── */}
        {post.media && post.media.length > 0 && (
          <div className="relative">
            <ImageCarousel
              media={post.media}
              diaryId={post.id}
              onImageClick={handleImageClick}
              onDoubleTap={handleCarouselDoubleTap}
            />

            {/* 더블탭 하트 오버레이 (캐러셀 위) */}
            <AnimatePresence>
              {carouselHeartVisible && (
                <motion.div
                  key={carouselHeartKey}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.4, 1, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.75, times: [0, 0.18, 0.45, 1] }}
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="#ef4444"
                    className="w-20 h-20 drop-shadow-2xl"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 이미지 전체 뷰어 */}
        {viewerOpen && post.media && post.media.length > 0 && (
          <ImageViewer
            media={post.media}
            initialIndex={viewerIndex}
            onClose={handleViewerClose}
            onDoubleTap={handleDoubleTapLike}
          />
        )}

        {/* ── 하단: 액션 + 텍스트 ── */}
        <div className="px-4 py-3">

          {/* 좋아요·댓글 아이콘 (수정 모드 중 숨김) */}
          {!isEditing && (
            <div
              className={`flex items-center gap-4 mb-3 ${disableNativeDrag ? "select-none touch-manipulation" : ""}`}
              onDragStart={disableNativeDrag ? handlePreventDrag : undefined}
            >
              <ActionIconButton
                onClick={handleToggleLike}
                disabled={isLiking}
                ariaLabel={isLiked ? "좋아요 취소" : "좋아요"}
                disableNativeDrag={disableNativeDrag}
                onPreventDrag={handlePreventDrag}
                className={`transition-all active:scale-90 ${
                  isLiked ? "text-red-500" : isDark ? "text-slate-300 hover:text-red-500" : "text-gray-700 hover:text-red-500"
                }`}
              >
                {isLiked ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`w-7 h-7 ${disableNativeDrag ? "pointer-events-none select-none" : ""}`}
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-7 h-7 ${disableNativeDrag ? "pointer-events-none select-none" : ""}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                )}
              </ActionIconButton>
              <ActionIconButton
                onClick={handleBubbleClick}
                ariaLabel="댓글 열기"
                disableNativeDrag={disableNativeDrag}
                onPreventDrag={handlePreventDrag}
                className={`hover:text-primary-500 transition-colors ${isDark ? "text-slate-300" : "text-gray-700"}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-7 h-7 ${disableNativeDrag ? "pointer-events-none select-none" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785c-.442.492.113 1.07.593.843a9.733 9.733 0 002.228-1.468h.002c.304-.297.703-.446 1.088-.436 1.144.03 2.308.038 3.475.038z"
                    />
                  </svg>
              </ActionIconButton>
            </div>
          )}

          {/* 좋아요 수 (수정 모드 중 숨김) */}
          {!isEditing && likeCount > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setShowReactionUsers(true)}
                className={`text-sm font-bold active:opacity-70 transition-opacity ${isDark ? "text-slate-100" : "text-gray-900"}`}
              >
                좋아요 {likeCount}개
              </button>
            </div>
          )}

          {/* ── 수정 모드 ── */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                autoFocus
                className={`w-full text-sm rounded-xl p-3 resize-none outline-none transition-colors
                           focus:border-primary-400
                           ${isDark
                             ? "text-slate-200 bg-slate-800 border border-slate-700"
                             : "text-gray-800 bg-white border border-gray-200"
                           }`}
                placeholder="일기 내용을 입력하세요"
              />
              <input
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                placeholder="해시태그 (예: #첫걸음 #백일)"
                className={`w-full text-sm rounded-xl px-3 py-2 outline-none transition-colors
                           focus:border-primary-400
                           ${isDark
                             ? "border border-slate-700 text-slate-200 bg-slate-800 placeholder:text-slate-600"
                             : "border border-gray-200 text-gray-700 bg-white placeholder:text-gray-300"
                           }`}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={handleEditCancel}
                  className={`px-4 py-1.5 text-sm rounded-lg transition-colors
                             ${isDark
                               ? "text-slate-400 border border-slate-700 hover:bg-slate-800"
                               : "text-gray-500 border border-gray-200 hover:bg-gray-50"
                             }`}
                >
                  취소
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isSaving || !editContent.trim()}
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-primary-500 rounded-lg
                             hover:bg-primary-600 disabled:opacity-40 transition-colors"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          ) : (
            /* ── 읽기 모드 ── */
            <div className="space-y-1.5">
              {title && (
                <h3 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-gray-900"}`}>{title}</h3>
              )}
              <p className={`text-sm leading-relaxed line-clamp-2 ${isDark ? "text-slate-200" : "text-gray-800"}`}>
                <span className="font-bold mr-2">{post.authorNickname}</span>
                {body}
              </p>
              {displayTag && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {displayTag.split(/\s+/).map((tag, i) => (
                    <span
                      key={i}
                      className="text-sm text-primary-600 font-medium hover:underline cursor-pointer"
                    >
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
              <p className={`text-[10px] uppercase pt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          )}
        </div>

        {/* 댓글 Bottom Sheet — AnimatePresence로 마운트/언마운트 시 애니메이션 */}
        <AnimatePresence>
          {isCommentSheetOpen && (
            <CommentBottomSheet
              ref={commentSectionRef}
              onClose={handleCommentClose}
              postId={post.id}
              initialCommentCount={post.commentCount ?? 0}
            />
          )}
        </AnimatePresence>
      </article>

      {/* 좋아요 누른 사람 목록 */}
      {showReactionUsers && (
        <ReactionUsersSheet
          postId={post.id}
          likeCount={likeCount}
          onClose={() => setShowReactionUsers(false)}
          isDark={isDark}
        />
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={confirmOpen}
        title="일기를 삭제할까요?"
        description="삭제된 일기는 복구할 수 없습니다."
        confirmLabel="삭제"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={deleting}
      />
    </>
  );
}

const DiaryCard = memo(DiaryCardInner);
export default DiaryCard;
