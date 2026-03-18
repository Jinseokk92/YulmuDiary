"use client";

import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { api } from "@/lib/api";
import ImageViewer from "@/components/diary/ImageViewer";
import { useAuthStore } from "@/stores/authStore";
import { getMediaUrl } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";
import DatePickerSheet from "@/components/ui/DatePickerSheet";
import type { MediaDto, MilestoneResponse } from "@/types";

// ── 상수 ──────────────────────────────────────────────────────────────────────

const MAX_PHOTOS          = 10;
const LINE_COLOR_ACHIEVED = "#e4701e";
const LINE_COLOR_PENDING  = "#d1d5db";

// ── 역 원 ─────────────────────────────────────────────────────────────────────

function getMilestoneStationThumbnailUrl(photoUrls: string[]): string | null {
  const firstPhotoUrl = photoUrls[0];
  return firstPhotoUrl ? getMediaUrl(firstPhotoUrl) : null;
}

function buildMilestoneViewerMedia(photoUrls: string[]): MediaDto[] {
  return photoUrls.map((url, index) => ({
    id: index + 1,
    url,
    thumbnailUrl: null,
    type: "PHOTO",
    displayOrder: index,
  }));
}

const StationCircle = memo(function StationCircle({
  milestone,
  isDark,
  onPhotoOpen,
}: {
  milestone: MilestoneResponse;
  isDark: boolean;
  onPhotoOpen?: (milestone: MilestoneResponse) => void;
}) {
  const firstPhotoUrl = getMilestoneStationThumbnailUrl(milestone.photoUrls);

  if (milestone.achieved) {
    if (firstPhotoUrl && onPhotoOpen) {
      return (
        <button
          type="button"
          onClick={() => onPhotoOpen(milestone)}
          aria-label={`${milestone.title} 사진 전체보기`}
          className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-primary-500 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          <Image src={firstPhotoUrl} alt={milestone.title} fill className="object-cover" sizes="44px" />
        </button>
      );
    }
    return (
      <div className="w-11 h-11 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2
      ${isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
      <span className="text-xs font-bold">{milestone.displayOrder}</span>
    </div>
  );
});

// ── 연결선 ─────────────────────────────────────────────────────────────────────

const StationLine = memo(function StationLine({
  achieved,
  isDark,
  invisible,
}: {
  achieved: boolean;
  isDark: boolean;
  invisible?: boolean;
}) {
  if (invisible) return <div className="w-0.5 min-h-3 shrink-0" />;
  if (achieved) return <div className="w-0.5 flex-1 min-h-3 shrink-0" style={{ background: LINE_COLOR_ACHIEVED }} />;
  return (
    <div className="w-0 flex-1 min-h-3 shrink-0"
      style={{ borderLeft: `2px dashed ${isDark ? "#475569" : LINE_COLOR_PENDING}` }} />
  );
});

// ── 달성 상세 모달 ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  milestone: MilestoneResponse;
  isParent: boolean;
  isDark: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}

function DetailModal({ milestone, isParent, isDark, onClose, onEdit, onDeleted }: DetailModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [photoIdx, setPhotoIdx]       = useState(0);

  // 배경 스크롤 차단
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", prevent);
      window.scrollTo(0, scrollY);
    };
  }, []);

  const bg      = isDark ? "bg-slate-900 text-slate-100" : "bg-white text-gray-900";
  const sub     = isDark ? "text-slate-400" : "text-gray-500";
  const divider = isDark ? "border-slate-700" : "border-gray-100";
  const photoUrls = milestone.photoUrls.map(getMediaUrl);
  const hasPhotos = photoUrls.length > 0;

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/api/milestones/${milestone.id}/achieve`);
      setConfirmOpen(false);
      onDeleted();
    } catch {
      alert("삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }, [milestone.id, onDeleted]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative ${bg} w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden`}>

          {/* 사진 캐러셀 */}
          {hasPhotos && (
            <div className="relative w-full aspect-[4/3] bg-black">
              <Image
                key={photoIdx}
                src={photoUrls[photoIdx]}
                alt={`${milestone.title} ${photoIdx + 1}`}
                fill
                className="object-cover"
                sizes="(max-width:640px) 100vw, 384px"
              />
              {/* 좌우 버튼 */}
              {photoUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => Math.max(0, i - 1)); }}
                    disabled={photoIdx === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center disabled:opacity-30"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => Math.min(photoUrls.length - 1, i + 1)); }}
                    disabled={photoIdx === photoUrls.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center disabled:opacity-30"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                  {/* 인덱스 dots */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {photoUrls.map((_, i) => (
                      <button key={i} onClick={() => setPhotoIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIdx ? "bg-white" : "bg-white/40"}`}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* 닫기 */}
              <button onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="p-5">
            {!hasPhotos && (
              <div className="flex justify-end mb-3">
                <button onClick={onClose}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 text-xs font-semibold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                달성!
              </span>
              <span className={`text-xs ${sub}`}>{milestone.achievedDate}</span>
            </div>

            <h3 className="text-lg font-bold mb-1">{milestone.title}</h3>
            <p className={`text-sm ${sub} mb-3`}>{milestone.description}</p>

            {milestone.memo && (
              <div className={`p-3 rounded-xl text-sm mb-4 ${isDark ? "bg-slate-800" : "bg-gray-50"}`}>
                {milestone.memo}
              </div>
            )}

            {isParent && (
              <div className={`flex gap-2 pt-3 border-t ${divider}`}>
                <button onClick={onEdit}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                  수정
                </button>
                <button onClick={() => setConfirmOpen(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${isDark ? "text-red-400 hover:bg-red-900/30" : "text-red-500 hover:bg-red-50"}`}>
                  기록 삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="기록을 삭제할까요?"
        description={`"${milestone.title}" 달성 기록과 사진이 함께 삭제됩니다.`}
        confirmLabel="삭제"
        loading={isDeleting}
        zIndex={200}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>,
    document.body
  );
}

// ── 기록/수정 바텀시트 ─────────────────────────────────────────────────────────

type ExistingPhoto = { id: string; url: string };
type NewPhoto      = { id: string; file: File; preview: string };
type PhotoItem =
  | ({ kind: "existing" } & ExistingPhoto)
  | ({ kind: "new" } & NewPhoto);

function createExistingPhoto(url: string, index: number): ExistingPhoto {
  return { id: `existing-${index}-${url}`, url };
}

function createNewPhoto(file: File, preview: string): NewPhoto {
  return { id: crypto.randomUUID(), file, preview };
}

function getPhotoSrc(photo: PhotoItem): string {
  return photo.kind === "new" ? photo.preview : getMediaUrl(photo.url);
}

function formatRecordDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${year}.${month}.${day}`;
}

interface RecordBottomSheetProps {
  milestone: MilestoneResponse;
  isEdit: boolean;
  isDark: boolean;
  onClose: () => void;
  onSaved: (updated: MilestoneResponse) => void;
}

function RecordBottomSheet({ milestone, isEdit, isDark, onClose, onSaved }: RecordBottomSheetProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate]               = useState(milestone.achievedDate ?? today);
  const [memo, setMemo]               = useState(milestone.memo ?? "");
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(() =>
    isEdit ? milestone.photoUrls.map((url, index) => createExistingPhoto(url, index)) : []
  );
  const [newPhotos, setNewPhotos]     = useState<NewPhoto[]>([]);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [sheetMaxHeight, setSheetMaxHeight] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPhotoSourceSheet, setShowPhotoSourceSheet] = useState(false);
  const [isMemoFocused, setIsMemoFocused]   = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef  = useRef<HTMLInputElement>(null);
  const memoRef         = useRef<HTMLTextAreaElement>(null);
  const handleAreaRef   = useRef<HTMLDivElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const dismissY      = useMotionValue(0);

  const bg       = isDark ? "bg-slate-900 text-slate-100" : "bg-white text-gray-900";
  const inputCls = isDark
    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-primary-500"
    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-400";
  const labelCls = isDark ? "text-slate-300" : "text-gray-700";
  const fieldCls = `w-full rounded-2xl border box-border text-[16px] outline-none transition-colors ${inputCls}`;
  const singleLineFieldCls = `${fieldCls} min-h-[54px] px-4 py-[0.9375rem] leading-[1.35]`;
  const textareaFieldCls = `${fieldCls} min-h-[124px] px-4 py-3 leading-[1.5] resize-none`;
  const buttonFieldCls = `${singleLineFieldCls} flex items-center justify-between gap-3 text-left`;
  const footerCls = isDark
    ? "border-slate-800 bg-slate-900/95 supports-[backdrop-filter]:bg-slate-900/90"
    : "border-gray-100 bg-white/95 supports-[backdrop-filter]:bg-white/90";
  const photoItems: PhotoItem[] = [
    ...existingPhotos.map((photo) => ({ kind: "existing" as const, ...photo })),
    ...newPhotos.map((photo) => ({ kind: "new" as const, ...photo })),
  ];
  const totalPhotoCount = photoItems.length;

  // blob URL 정리
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrlsRef.current.clear();
    };
  }, []);

  // 부모 스크롤 잠금
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", prevent);
      window.scrollTo(0, scrollY);
    };
  }, []);

  // visualViewport 기반 키보드 대응
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handle = () => {
      const kbh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(kbh);
      setSheetMaxHeight(Math.floor(vv.height * 0.96));
    };
    handle();
    vv.addEventListener("resize", handle);
    vv.addEventListener("scroll", handle);
    return () => { vv.removeEventListener("resize", handle); vv.removeEventListener("scroll", handle); };
  }, []);

  // 드래그 핸들 (dismiss)
  useEffect(() => {
    const handle = handleAreaRef.current;
    if (!handle) return;
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onMove  = (e: TouchEvent) => {
      e.preventDefault(); e.stopPropagation();
      const dy = e.touches[0].clientY - startY;
      if (dy > 0) dismissY.set(dy);
    };
    const onEnd = () => {
      if (dismissY.get() > 80) {
        animate(dismissY, window.innerHeight * 1.5, { duration: 0.2, ease: "easeIn" }).then(onClose);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - totalPhotoCount;
    const toAdd = files.slice(0, remaining);
    const nextPhotos = toAdd.map((file) => {
      const preview = URL.createObjectURL(file);
      previewUrlsRef.current.add(preview);
      return createNewPhoto(file, preview);
    });
    setNewPhotos((prev) => [...prev, ...nextPhotos]);
    // 같은 파일 재선택 허용
    e.target.value = "";
  };

  const openPhotoSourceSheet = () => {
    if (saving || !canAddMore) return;
    setShowPhotoSourceSheet(true);
  };

  const openCameraPicker = () => {
    setShowPhotoSourceSheet(false);
    cameraInputRef.current?.click();
  };

  const handleRemovePhoto = (photo: PhotoItem) => {
    if (photo.kind === "existing") {
      setExistingPhotos((prev) => prev.filter((item) => item.id !== photo.id));
      return;
    }

    previewUrlsRef.current.delete(photo.preview);
    URL.revokeObjectURL(photo.preview);
    setNewPhotos((prev) => prev.filter((item) => item.id !== photo.id));
  };

  const handleSubmit = useCallback(async () => {
    if (!date) { setError("날짜를 선택해주세요."); return; }
    if (totalPhotoCount === 0) { setError("사진을 최소 1장 추가해주세요."); return; }
    if (totalPhotoCount > MAX_PHOTOS) { setError(`사진은 최대 ${MAX_PHOTOS}장까지 추가할 수 있어요.`); return; }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("achievedDate", date);
      if (memo.trim()) fd.append("memo", memo.trim());

      const keepImageUrls = existingPhotos.map((photo) => photo.url);

      keepImageUrls.forEach((url) => fd.append("keepImageUrls", url));
      newPhotos.forEach((photo) => fd.append("newPhotos", photo.file));

      const updated = await api.patchForm<MilestoneResponse>(`/api/milestones/${milestone.id}/achieve`, fd);
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [date, memo, totalPhotoCount, existingPhotos, newPhotos, milestone.id, onSaved]);

  const canAddMore = totalPhotoCount < MAX_PHOTOS;
  const hasPhotos = totalPhotoCount > 0;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40"
        style={{ zIndex: 110 }}
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0, transition: { type: "spring", stiffness: 400, damping: 40 } }}
        exit={{ y: "100%", transition: { duration: 0.25, ease: "easeIn" } }}
        className={`fixed left-0 right-0 mx-auto w-full max-w-lg shadow-[0_-4px_24px_rgba(0,0,0,0.12)]
          flex flex-col overflow-hidden box-border border-t
          ${isMemoFocused && keyboardHeight > 0 ? "" : "rounded-t-3xl"}
          ${isDark ? "border-slate-800" : "border-gray-100"} ${bg}`}
        style={{
          y: isMemoFocused && keyboardHeight > 0 ? 0 : dismissY,
          top: isMemoFocused && keyboardHeight > 0 ? 0 : undefined,
          bottom: keyboardHeight,
          maxHeight: isMemoFocused && keyboardHeight > 0 ? undefined : (sheetMaxHeight ?? "92vh"),
          zIndex: 111,
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div ref={handleAreaRef} style={{ touchAction: "none" }} className="shrink-0">
          <div className="flex justify-center pt-3 pb-2">
            <div className={`w-10 h-1 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />
          </div>
          <div className={`flex items-center justify-between px-5 pt-1 pb-4 border-b ${isDark ? "border-slate-800" : "border-gray-100"}`}>
            <h3 className="text-[17px] font-bold leading-6">
              {isEdit ? "기록 수정" : `${milestone.title} 기록하기`}
            </h3>
            <button onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 폼 스크롤 영역 */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ touchAction: "pan-y" }}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="px-5 pt-5 pb-6 space-y-6">
            {/* 날짜 */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${labelCls}`}>달성 날짜 *</label>
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className={buttonFieldCls}
                aria-haspopup="dialog"
                aria-expanded={showDatePicker}
              >
                <span className="flex min-w-0 flex-col items-start">
                  <span className="text-[15px] font-medium leading-5">
                    {formatRecordDate(date)}
                  </span>
                  <span className={`mt-0.5 text-[11px] leading-4 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    달성한 날짜를 선택해주세요
                  </span>
                </span>
                <svg className={`h-5 w-5 shrink-0 ${isDark ? "text-slate-400" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3.75v2.25m7.5-2.25v2.25M3.75 8.25h16.5M5.25 5.25h13.5A1.5 1.5 0 0120.25 6.75v11.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5z" />
                </svg>
              </button>
            </div>

            {/* 감상 */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${labelCls}`}>감상 (선택)</label>
              <textarea
                ref={memoRef}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                onFocus={() => {
                  setIsMemoFocused(true);
                  setTimeout(() => {
                    memoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 320);
                }}
                onBlur={() => setIsMemoFocused(false)}
                placeholder="이 순간을 기록해주세요"
                rows={4}
                className={textareaFieldCls}
                style={{ WebkitTextSizeAdjust: "100%" }}
              />
            </div>

            {/* 사진 */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <label className={`text-xs font-semibold ${labelCls}`}>
                  사진 ({totalPhotoCount}/{MAX_PHOTOS})
                </label>
                {hasPhotos && (
                  <span className={`text-[11px] leading-4 text-right ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    기존 + 새 사진을 한 화면에서 관리
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {photoItems.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`relative aspect-square overflow-hidden rounded-2xl border box-border ${isDark ? "border-slate-800 bg-slate-800" : "border-gray-100 bg-gray-100"}`}
                  >
                    <Image
                      src={getPhotoSrc(p)}
                      alt={`사진 ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width:512px) 33vw, 170px"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(p)}
                      aria-label={`사진 ${idx + 1} 삭제`}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {canAddMore && (
                  <button
                    type="button"
                    onClick={openPhotoSourceSheet}
                    className={`rounded-2xl border-2 border-dashed box-border flex flex-col items-center justify-center px-4 transition-colors
                      ${hasPhotos ? "aspect-square gap-1.5" : "col-span-3 min-h-[168px] gap-2.5"}
                      ${isDark ? "border-slate-700 hover:border-primary-500 text-slate-500" : "border-gray-200 hover:border-primary-400 text-gray-400"}`}
                  >
                    {hasPhotos ? (
                      <>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className="text-[11px]">사진 추가</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                        <span className="text-sm font-medium">사진을 추가해보세요</span>
                        <span className={`text-xs ${isDark ? "text-slate-600" : "text-gray-300"}`}>
                          최대 {MAX_PHOTOS}장
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                id="milestone-gallery-input"
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div
          className={`shrink-0 border-t px-5 pt-4 backdrop-blur-sm ${footerCls}`}
          style={{ paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
        >
          <button
            onClick={handleSubmit}
            disabled={saving || !date}
            className="w-full min-h-[54px] rounded-2xl bg-primary-500 px-4 py-3.5 text-[15px] font-semibold text-white hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "저장 중..." : isEdit ? "수정하기" : "저장"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPhotoSourceSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-black/45"
              style={{ zIndex: 112 }}
              onClick={() => setShowPhotoSourceSheet(false)}
            />
            <motion.div
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="fixed inset-x-0 mx-auto w-full max-w-lg px-3"
              style={{
                zIndex: 113,
                bottom: 0,
                paddingBottom: "max(0.75rem, calc(env(safe-area-inset-bottom) + 0.25rem))",
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className={`overflow-hidden rounded-[28px] border shadow-[0_-12px_36px_rgba(0,0,0,0.18)] ${isDark ? "border-slate-800 bg-slate-900" : "border-gray-100 bg-white"}`}>
                <div className="space-y-2 px-3 pt-3 pb-3">
                  <label
                    htmlFor="milestone-gallery-input"
                    onClick={() => setShowPhotoSourceSheet(false)}
                    className={`flex min-h-[54px] w-full cursor-pointer items-center justify-center rounded-2xl px-4 text-[15px] font-semibold transition-colors ${isDark ? "bg-slate-800 text-slate-100 hover:bg-slate-700" : "bg-gray-50 text-gray-900 hover:bg-gray-100"}`}
                  >
                    사진 보관함
                  </label>
                  <button
                    type="button"
                    onClick={openCameraPicker}
                    className={`flex min-h-[54px] w-full items-center justify-center rounded-2xl px-4 text-[15px] font-semibold transition-colors ${isDark ? "bg-slate-800 text-slate-100 hover:bg-slate-700" : "bg-gray-50 text-gray-900 hover:bg-gray-100"}`}
                  >
                    사진 찍기
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoSourceSheet(false)}
                className={`mt-2 flex min-h-[54px] w-full items-center justify-center rounded-2xl border text-[15px] font-semibold transition-colors ${isDark ? "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                취소
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showDatePicker && (
        <DatePickerSheet
          value={date}
          onChange={setDate}
          onClose={() => setShowDatePicker(false)}
          isDark={isDark}
          lockBody={false}
          maxDate={today}
        />
      )}
    </>,
    document.body
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function MilestonesPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);

  const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);
  const [isLoading, setIsLoading]   = useState(true);

  const [detailTarget, setDetailTarget] = useState<MilestoneResponse | null>(null);
  const [recordTarget, setRecordTarget] = useState<MilestoneResponse | null>(null);
  const [photoViewerTarget, setPhotoViewerTarget] = useState<MilestoneResponse | null>(null);
  const [isEditMode, setIsEditMode]     = useState(false);

  const isDark   = mounted && resolvedTheme === "dark";
  const isParent = user?.role === "PARENT";

  const card     = isDark ? "bg-slate-900/80 border border-slate-800" : "bg-white/90 border border-white/60";
  const sub      = isDark ? "text-slate-400" : "text-gray-500";
  const titleCls = isDark ? "text-slate-100" : "text-gray-900";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    api.get<MilestoneResponse[]>("/api/milestones")
      .then(setMilestones)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const achievedCount = milestones.filter((m) => m.achieved).length;
  const total         = milestones.length;

  const handleSaved = useCallback((updated: MilestoneResponse) => {
    setMilestones((prev) => prev.map((m) => m.id === updated.id ? updated : m));
    setRecordTarget(null);
    setDetailTarget(null);
  }, []);

  const handleDeleted = useCallback((id: number) => {
    setMilestones((prev) => prev.map((m) =>
      m.id === id ? { ...m, achieved: false, achievedDate: null, memo: null, photoUrls: [] } : m
    ));
    setDetailTarget(null);
  }, []);

  const handleEdit = useCallback(() => {
    if (!detailTarget) return;
    setRecordTarget(detailTarget);
    setIsEditMode(true);
    setDetailTarget(null);
  }, [detailTarget]);

  const handleRecord = useCallback((m: MilestoneResponse) => {
    setRecordTarget(m);
    setIsEditMode(false);
  }, []);

  const handleOpenPhotoViewer = useCallback((milestone: MilestoneResponse) => {
    if (milestone.photoUrls.length === 0) return;
    setPhotoViewerTarget(milestone);
  }, []);

  const handleClosePhotoViewer = useCallback(() => {
    setPhotoViewerTarget(null);
  }, []);

  const photoViewerMedia = useMemo(
    () => photoViewerTarget ? buildMilestoneViewerMedia(photoViewerTarget.photoUrls) : [],
    [photoViewerTarget]
  );

  if (!mounted) return null;

  return (
    <div className="px-4 py-6 pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
            ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-gray-100 text-gray-600"}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className={`text-lg font-bold ${titleCls}`}>이정표</h1>
          <p className={`text-xs ${sub}`}>율무의 성장 여정</p>
        </div>
      </div>

      {/* 달성 현황 카드 */}
      {!isLoading && total > 0 && (
        <section className={`${card} rounded-2xl p-4 shadow-sm backdrop-blur-sm mb-6`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${titleCls}`}>달성 현황</span>
            <span className="text-sm font-bold text-primary-500">{achievedCount} / {total}</span>
          </div>
          <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-700"
              style={{ width: total > 0 ? `${(achievedCount / total) * 100}%` : "0%" }}
            />
          </div>
          <p className={`text-xs mt-1.5 ${sub}`}>
            {achievedCount === 0
              ? "첫 번째 이정표를 기록해보세요"
              : total - achievedCount > 0
                ? `${total - achievedCount}개의 이정표가 남아있어요`
                : "모든 이정표를 달성했어요! 🎉"}
          </p>
        </section>
      )}

      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className={`w-11 h-11 rounded-full animate-pulse ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
              <div className="flex-1 space-y-1.5">
                <div className={`h-4 w-24 rounded animate-pulse ${isDark ? "bg-slate-800" : "bg-gray-200"}`} />
                <div className={`h-3 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-gray-100"}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 지하철 노선도 */}
      {!isLoading && (
        <div>
          {milestones.map((m, idx) => {
            const isFirst        = idx === 0;
            const isLast         = idx === milestones.length - 1;
            const topAchieved    = isFirst ? false : milestones[idx - 1].achieved;
            const bottomAchieved = m.achieved;

            return (
              <div key={m.id} className="flex gap-4">
                <div className="flex flex-col items-center" style={{ width: 44 }}>
                  <StationLine achieved={topAchieved} isDark={isDark} invisible={isFirst} />
                  <StationCircle milestone={m} isDark={isDark} onPhotoOpen={handleOpenPhotoViewer} />
                  <StationLine achieved={bottomAchieved} isDark={isDark} invisible={isLast} />
                </div>

                <div
                  className={`flex-1 py-2 min-w-0 ${isLast ? "pb-0" : "pb-6"}`}
                  onClick={() => { if (m.achieved) setDetailTarget(m); }}
                  style={{ cursor: m.achieved ? "pointer" : "default" }}
                >
                  {m.achieved ? (
                    <span className="inline-block mb-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 text-[10px] font-bold">
                      달성 {m.achievedDate}
                    </span>
                  ) : (
                    <span className={`inline-block mb-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                      ${isDark ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-400"}`}>
                      {m.expectedMonth}
                    </span>
                  )}

                  <p className={`text-sm font-semibold leading-snug ${titleCls}`}>{m.title}</p>
                  <p className={`text-xs mt-0.5 ${sub} line-clamp-1`}>{m.description}</p>

                  {/* 사진 개수 뱃지 */}
                  {m.achieved && m.photoUrls.length > 0 && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] mt-1 ${sub}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      {m.photoUrls.length}장
                    </span>
                  )}
                  {m.achieved && m.memo && (
                    <p className={`text-xs mt-0.5 line-clamp-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                      {m.memo}
                    </p>
                  )}

                  {isParent && !m.achieved && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRecord(m); }}
                      className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors
                        ${isDark
                          ? "border-primary-700 text-primary-400 hover:bg-primary-900/30"
                          : "border-primary-300 text-primary-500 hover:bg-primary-50"}`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      기록하기
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailTarget && (
        <DetailModal
          milestone={detailTarget}
          isParent={isParent}
          isDark={isDark}
          onClose={() => setDetailTarget(null)}
          onEdit={handleEdit}
          onDeleted={() => handleDeleted(detailTarget.id)}
        />
      )}

      {recordTarget && (
        <RecordBottomSheet
          milestone={recordTarget}
          isEdit={isEditMode}
          isDark={isDark}
          onClose={() => setRecordTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {photoViewerTarget && photoViewerMedia.length > 0 && (
        <ImageViewer
          media={photoViewerMedia}
          initialIndex={0}
          onClose={handleClosePhotoViewer}
        />
      )}
    </div>
  );
}
