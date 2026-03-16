"use client";

import { useState, useCallback, useRef, useMemo, useEffect, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import ImagePreview from "@/components/diary/ImagePreview";
import type { ImageFile } from "@/components/diary/ImagePreview";
import StickerPicker from "@/components/diary/StickerPicker";
import type { MediaUploadResponse, DiaryPostResponse, AlbumPhotoResponse } from "@/types";
import { calcLmpFromDueDate, calcPregnancyWeek } from "@/lib/utils";

const BABY_ID = 1;
const MAX_IMAGES = 10;

// 홈 화면과 동일한 출산 예정일 기준으로 임신 주차를 계산
const YULMU_DUE_DATE = "2026-06-27";

type SubmitStep = "idle" | "uploading" | "saving" | "albumSaving" | "done";

export default function NewPostPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [step, setStep] = useState<SubmitStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saveToAlbum, setSaveToAlbum] = useState(false);

  // ── 권한 + 노출 조건 ────────────────────────────────────────────────────────
  // PARENT만 앨범 저장 옵션을 볼 수 있고, 사진이 있어야 활성화
  // 체험판 모드에서는 currentUser가 초기에 null일 수 있으므로 sessionStorage로 보완
  const isDemoMode =
    typeof window !== "undefined" && sessionStorage.getItem("demoMode") === "true";
  const isParent = isDemoMode ? true : currentUser?.role === "PARENT";
  const showAlbumOption = isParent && images.length > 0;

  // 이미지 전체 제거 시 토글 자동 리셋
  useEffect(() => {
    if (images.length === 0) setSaveToAlbum(false);
  }, [images.length]);

  // ── 현재 임신 주차 계산 ────────────────────────────────────────────────────
  // growthPhaseType + growthIndex: 일기 작성 시점 기준으로 자동 결정
  const currentGrowthPhase = useMemo(() => {
    const lmp = calcLmpFromDueDate(YULMU_DUE_DATE);
    const { weeks } = calcPregnancyWeek(lmp);
    return { type: "PREGNANCY" as const, index: weeks };
  }, []);

  const growthLabel = `임신 ${currentGrowthPhase.index}주차`;

  // --- 이미지 선택 ---
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const remaining = MAX_IMAGES - images.length;
      const selected = Array.from(files).slice(0, remaining);

      const newImages: ImageFile[] = selected.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...newImages]);
      e.target.value = "";
    },
    [images.length]
  );

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // --- 이모지 삽입 ---
  const handleEmojiInsert = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setContent((prev) => prev.slice(0, start) + emoji + prev.slice(end));

    requestAnimationFrame(() => {
      const newPos = start + emoji.length;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
    });
  }, []);

  // --- 태그 ---
  const addTag = useCallback((raw: string) => {
    const value = raw.replace(/[#,]/g, "").trim();
    if (!value) return;
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setTagInput("");
  }, []);

  const handleTagKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(tagInput);
      } else if (e.key === "Backspace" && !tagInput) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, addTag]
  );

  const removeTag = useCallback((target: string) => {
    setTags((prev) => prev.filter((t) => t !== target));
  }, []);

  // --- 제출 ---
  const handleSubmit = useCallback(async () => {
    if (!currentUser) return;
    if (!content.trim() && images.length === 0) {
      setError("내용이나 이미지를 추가해 주세요.");
      return;
    }

    setError(null);
    let uploadedImageUrls: string[] = [];
    let uploadedThumbnailUrls: string[] = [];

    // Step 1: 이미지 처리
    if (images.length > 0) {
      setStep("uploading");

      if (isDemoMode) {
        // 체험판: blob URL을 그대로 사용 (data URL 변환 시 sessionStorage 5MB 초과 위험)
        uploadedImageUrls = images.map((img) => img.previewUrl);
        uploadedThumbnailUrls = images.map((img) => img.previewUrl);
      } else {
        // 실제 업로드
        try {
          const uploadPromises = images.map((img) => {
            const fd = new FormData();
            fd.append("files", img.file);
            return api.upload<MediaUploadResponse>("/api/media/upload", fd);
          });

          const results = await Promise.all(uploadPromises);
          for (const r of results) {
            for (const img of r.images) {
              uploadedImageUrls.push(img.imageUrl);
              uploadedThumbnailUrls.push(img.thumbnailUrl);
            }
          }
        } catch {
          setStep("idle");
          setError("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
          return;
        }
      }
    }

    // Step 2: 일기 저장
    setStep("saving");
    console.log("[NewPost] 일기 저장 시도 — isDemoMode:", isDemoMode, "/ 이미지 수:", uploadedImageUrls.length);

    try {
      const saved = await api.post<DiaryPostResponse>("/api/diary-posts", {
        babyId: BABY_ID,
        content: content.trim(),
        milestoneTag: tags.length > 0 ? tags.map((t) => `#${t}`).join(" ") : null,
        mediaUrls: uploadedImageUrls,
        mediaThumbnailUrls: uploadedThumbnailUrls,
      });
      console.log("[NewPost] 일기 저장 성공 — id:", saved?.id);
    } catch (err) {
      console.error("[NewPost] 일기 저장 실패:", err);
      setStep("idle");
      setError("일기 저장에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    // Step 3: 앨범 저장 (PARENT + saveToAlbum + 이미지가 실제로 업로드된 경우에만)
    // 일기는 이미 저장됐으므로 앨범 저장 실패는 조용히 무시 (allSettled)
    console.log("[NewPost] 앨범 저장 조건 — saveToAlbum:", saveToAlbum, "/ isParent:", isParent, "/ 이미지 수:", uploadedImageUrls.length);
    if (saveToAlbum && isParent && uploadedImageUrls.length > 0) {
      setStep("albumSaving");

      const today = new Date();
      const takenAt = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      await Promise.allSettled(
        uploadedImageUrls.map((url, i) =>
          api.post<AlbumPhotoResponse>("/api/album-photos", {
            babyId: BABY_ID,
            url,
            thumbnailUrl: uploadedThumbnailUrls[i] ?? url,
            growthPhaseType: currentGrowthPhase.type,
            growthIndex: currentGrowthPhase.index,
            takenAt,
          })
        )
      );
    }

    setStep("done");
    // 체험판 모드에서는 previewUrl(blob URL)을 uploadedImageUrls로 사용하므로 revoke하지 않음
    if (!isDemoMode) {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    }
    router.push("/diary");
  }, [currentUser, content, tags, images, saveToAlbum, isParent, currentGrowthPhase, router]);

  const isSubmitting = step !== "idle";
  const canSubmit = !isSubmitting && (content.trim() || images.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
          >
            취소
          </button>
          <h1 className="text-base font-semibold text-gray-900">새 일기</h1>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="text-sm font-semibold text-primary-500 hover:text-primary-600
                       disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {step === "uploading"
              ? "업로드 중..."
              : step === "saving" || step === "albumSaving"
                ? "저장 중..."
                : "공유"}
          </button>
        </div>
      </header>

      {/* 에러 배너 */}
      {error && (
        <div className="max-w-lg mx-auto w-full px-4 pt-3">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-red-400 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-600 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 본문 영역 */}
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col px-4 py-4">
        <div className="border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden flex flex-col">
          {/* 상단: 사진 영역 */}
          <div className="p-4">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">사진</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full py-10 border-2 border-dashed border-gray-200 rounded-lg
                           flex flex-col items-center gap-2 text-gray-400
                           hover:border-primary-300 hover:text-primary-400
                           disabled:opacity-40 transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  />
                </svg>
                <span className="text-sm">사진을 추가해 보세요</span>
                <span className="text-xs text-gray-300">최대 {MAX_IMAGES}장</span>
              </button>
            ) : (
              <>
                <ImagePreview images={images} onRemove={handleRemoveImage} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || images.length >= MAX_IMAGES}
                  className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span>
                    사진 추가{" "}
                    <span className="text-gray-300">
                      ({images.length}/{MAX_IMAGES})
                    </span>
                  </span>
                </button>
                {isDemoMode && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    체험판에서는 새로고침 시 이미지가 사라질 수 있어요
                  </p>
                )}
              </>
            )}

            {/* ── 앨범 저장 토글 ─────────────────────────────────────────────
                조건: 사진이 첨부되어 있고 + PARENT 역할인 경우에만 노출
                RELATIVE 사용자에게는 이 블록 자체가 렌더링되지 않음         */}
            {showAlbumOption && (
              <div className="mt-4 flex items-center justify-between
                              bg-emerald-50 border border-emerald-100
                              rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-emerald-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">율무 앨범에도 저장</p>
                    <p className="text-xs text-gray-400 mt-0.5">{growthLabel}으로 저장</p>
                  </div>
                </div>

                {/* iOS 스타일 토글 */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={saveToAlbum}
                  onClick={() => setSaveToAlbum((v) => !v)}
                  disabled={isSubmitting}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200
                             disabled:opacity-50 focus:outline-none
                             ${saveToAlbum ? "bg-emerald-500" : "bg-gray-200"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                                transition-transform duration-200
                                ${saveToAlbum ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200" />

          {/* 하단: 글 작성 영역 */}
          <div className="p-4 flex-1 flex flex-col space-y-4">
            <div>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">내용</h2>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                  }
                }}
                placeholder="오늘 아이의 하루를 기록해 보세요..."
                disabled={isSubmitting}
                className="w-full min-h-[200px] p-4 text-sm text-gray-800 placeholder:text-gray-300
                           bg-gray-50 border border-gray-200 rounded-lg outline-none
                           focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                           transition-all resize-none disabled:opacity-50"
              />
            </div>

            {/* 해시태그 */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-primary-50 text-primary-600
                             text-xs font-medium px-2.5 py-1 rounded-full border border-primary-100"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    disabled={isSubmitting}
                    className="text-primary-400 hover:text-primary-600 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagInput)}
                placeholder={tags.length === 0 ? "태그 입력 (예: 첫걸음마)" : "태그 추가..."}
                maxLength={30}
                disabled={isSubmitting}
                className="flex-1 min-w-[120px] text-sm bg-transparent outline-none
                           placeholder:text-gray-300 disabled:opacity-50"
              />
            </div>

            {/* 이모지 툴바 */}
            <div className="pt-2 border-t border-gray-100">
              <StickerPicker onSelect={handleEmojiInsert} />
            </div>
          </div>
        </div>
      </div>

      {/* 제출 진행 오버레이 */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-white/80 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">
            {step === "uploading"
              ? "사진을 업로드하고 있어요..."
              : step === "albumSaving"
                ? "앨범에 저장하고 있어요..."
                : "일기를 저장하고 있어요..."}
          </p>
        </div>
      )}
    </div>
  );
}
