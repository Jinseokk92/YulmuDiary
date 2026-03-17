"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  X, Moon, Sun, LogOut, LogIn, PenLine, ChevronDown,
  FileText, Heart, MessageCircle, Bell, Info, ArrowLeft, Camera, Loader2, Bookmark, RotateCcw, Shield,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { api } from "@/lib/api";
import UserAvatar from "@/components/ui/UserAvatar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { resetDemoData } from "@/lib/demoData";
import type { UserResponse, UserStatsResponse } from "@/types";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type DrawerView = "menu" | "profile";
type AccordionKey = "activity" | "album" | "settings";

// ─── 토글 스위치 ─────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-12 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-primary-500" : "bg-gray-300"
      }`}
    >
      <motion.span
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </button>
  );
}

// ─── 아코디언 섹션 ────────────────────────────────────────────────────────────
interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  rowHover: string;
  labelColor: string;
  children: React.ReactNode;
}
function AccordionSection({ title, isOpen, onToggle, rowHover, labelColor, children }: AccordionSectionProps) {
  return (
    <div className="px-3 py-0.5">
      <button
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors ${rowHover}`}
      >
        <span className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>{title}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className={labelColor}>
          <ChevronDown size={15} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="pb-1 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── 아코디언 항목 ────────────────────────────────────────────────────────────
function AccordionItem({ label, icon, rowHover, itemColor, onClick }: {
  label: string; icon: React.ReactNode; rowHover: string; itemColor: string; onClick?: () => void;
}) {
  return (
    <div className="px-1">
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition-colors ${rowHover} ${itemColor}`}
      >
        {icon}
        {label}
      </button>
    </div>
  );
}

// ─── 메인 드로어 ──────────────────────────────────────────────────────────────
export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const { currentUser, logout } = useUser();
  const { isParent } = useAuth();
  const { setUser, isDemoMode, deactivateDemo } = useAuthStore();
  const demoGuideStep = useUiStore((state) => state.demoGuideStep);
  const setDemoGuideStep = useUiStore((state) => state.setDemoGuideStep);
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<DrawerView>("menu");
  const [openSection, setOpenSection] = useState<AccordionKey | null>("activity");
  const scrollYRef = useRef(0);

  // ── 프로필 수정 로컬 상태 ──
  const [editNickname, setEditNickname] = useState("");
  const [editBio, setEditBio] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState(false);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // 드로어 열릴 때 통계 조회
  useEffect(() => {
    if (isOpen) {
      api.get<UserStatsResponse>("/api/users/me/stats")
        .then(setStats)
        .catch(() => {});
    }
  }, [isOpen]);

  // 드로어 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setView("menu");
      setOpenSection("activity");
    }
  }, [isOpen]);

  // Step 2 중 드로어가 닫히면 Step 1로 복원 (클로즈 애니메이션 후)
  useEffect(() => {
    if (isOpen || demoGuideStep !== 2) return;
    const t = setTimeout(() => setDemoGuideStep(1), 350);
    return () => clearTimeout(t);
  }, [isOpen, demoGuideStep, setDemoGuideStep]);

  // 스크롤 잠금 — position:fixed 방식 (iOS Safari 대응)
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const body = document.body;
    const appShell = document.getElementById("app-shell");

    if (isOpen) {
      scrollYRef.current = window.scrollY;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollYRef.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      if (appShell) { appShell.style.pointerEvents = "none"; appShell.setAttribute("inert", ""); }
    } else {
      const lockedY = scrollYRef.current;
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      if (appShell) { appShell.style.pointerEvents = ""; appShell.removeAttribute("inert"); }
      if (lockedY > 0) window.scrollTo(0, lockedY);
    }
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      if (appShell) { appShell.style.pointerEvents = ""; appShell.removeAttribute("inert"); }
    };
  }, [isOpen, mounted]);

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const isDark = mounted && resolvedTheme === "dark";

  const handleLogout = () => { onClose(); logout(); router.push("/login"); };
  const toggleSection = (key: AccordionKey) =>
    setOpenSection(prev => prev === key ? null : key);

  // 프로필 수정 진입: 현재 값으로 초기화
  const openProfileEdit = () => {
    setEditNickname(currentUser?.name ?? "");
    setEditBio(currentUser?.bio ?? "");
    setPhotoPreview(null);
    setPhotoUploading(false);
    setPhotoError(null);
    setSaveError(null);
    setDemoNotice(false);
    setView("profile");
  };

  // 사진 선택 → 즉시 업로드
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (isDemoMode) {
      setDemoNotice(true);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl); // 낙관적 프리뷰
    setPhotoUploading(true);
    setPhotoError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await api.putForm<UserResponse>("/api/users/me/profile-image", formData);

      const serverUrl = updated.profileImageUrl ?? null;
      setPhotoPreview(serverUrl);
      if (currentUser && serverUrl) {
        setUser({ ...currentUser, profileImageUrl: serverUrl });
      }
    } catch (err) {
      setPhotoPreview(null); // 실패 시 기존 사진으로 복귀
      setPhotoError(err instanceof Error ? err.message : "사진 업로드에 실패했습니다.");
    } finally {
      setPhotoUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  // 저장
  const handleSaveProfile = async () => {
    if (!editNickname.trim()) return;

    if (isDemoMode) {
      setDemoNotice(true);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await api.put<UserResponse>("/api/users/me", {
        name: editNickname.trim(),
        bio: editBio.trim() || null,
      });

      if (currentUser && updated) {
        setUser({
          ...currentUser,
          name: updated.name,
          bio: updated.bio ?? null,
        });
      }

      setView("menu");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 색상 토큰
  const bg         = isDark ? "bg-[#0f172a]"      : "bg-white";
  const text        = isDark ? "text-white"         : "text-gray-900";
  const subText     = isDark ? "text-slate-400"     : "text-gray-500";
  const divider     = isDark ? "border-slate-700"   : "border-gray-100";
  const rowHover    = isDark ? "hover:bg-slate-800" : "hover:bg-gray-50";
  const labelColor  = isDark ? "text-slate-500"     : "text-gray-400";
  const itemColor   = isDark ? "text-slate-300"     : "text-gray-600";
  const iconColor   = isDark ? "#64748b"            : "#9ca3af";
  const inputBorder = isDark ? "border-slate-700 bg-slate-800/50 text-white placeholder-slate-500"
                              : "border-gray-200 bg-white text-gray-900 placeholder-gray-400";
  const roleText    = isParent ? "율무 부모" : "율무 가족";

  // 프로필 수정 뷰에서 보여줄 아바타 소스
  const avatarPreview = photoPreview ?? currentUser?.profileImageUrl ?? null;

  if (!mounted) return null;

  const drawer = (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100]">
          {/* 오버레이 */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`absolute inset-0 ${isDark ? "bg-black/60" : "bg-black/40"}`}
          />

          {/* 드로어 패널 */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={`absolute right-0 top-0 flex w-72 max-w-[86vw] flex-col shadow-2xl ${bg} ${text}`}
            style={{ height: "100dvh", overflow: "hidden" }}
            role="dialog" aria-modal="true" aria-label="사이드 메뉴"
          >
            {/* ── 뷰 슬라이드 컨테이너 ── */}
            <AnimatePresence mode="wait" initial={false}>

              {view === "menu" && (
                <motion.div
                  key="menu"
                  initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  className="flex h-full flex-col overflow-y-auto"
                >
                  {/* 닫기 버튼 */}
                  <div className="flex h-12 items-center justify-end px-4 shrink-0">
                    <button onClick={onClose}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${rowHover}`}
                      aria-label="닫기"
                    >
                      <X size={18} style={{ color: iconColor }} />
                    </button>
                  </div>

                  {/* 프로필 영역 */}
                  <div className={`relative border-b px-5 pb-6 shrink-0 ${divider}`}>
                    <button
                      onClick={openProfileEdit}
                      className={`absolute right-4 top-0 flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${rowHover}`}
                      aria-label="프로필 수정"
                    >
                      <PenLine size={15} style={{ color: iconColor }} />
                    </button>

                    <div className="flex flex-col items-center gap-3">
                      <UserAvatar
                        nickname={currentUser?.name ?? "?"}
                        profileImageUrl={currentUser?.profileImageUrl}
                        size="lg"
                        className="!w-14 !h-14"
                      />
                      <div className="text-center">
                        <p className={`text-base font-semibold ${text}`}>
                          {currentUser?.name ?? "사용자"}&nbsp;
                          <span className={subText}>님</span>
                        </p>
                        <p className={`mt-0.5 text-xs ${subText}`}>{roleText}</p>
                        {isDemoMode && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-600 font-medium mt-1">
                            체험판
                          </span>
                        )}
                        {currentUser?.bio && (
                          <p
                            className={`mt-2 text-xs leading-snug ${isDark ? "text-slate-300" : "text-gray-600"}`}
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {currentUser.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 활동 요약 */}
                    <div className={`mt-4 flex items-center justify-center gap-3 text-xs ${subText}`}>
                      <span>게시글&nbsp;<strong className={text}>{stats ? stats.postCount : "·"}</strong></span>
                      <span className={labelColor}>·</span>
                      <span>사진&nbsp;<strong className={text}>{stats ? stats.photoCount : "·"}</strong></span>
                      <span className={labelColor}>·</span>
                      <span>반응&nbsp;<strong className={text}>{stats ? stats.reactionCount : "·"}</strong></span>
                    </div>
                  </div>

                  {/* 아코디언 메뉴 */}
                  <div className="flex-1 py-2">
                    {/* 관리자 전용 메뉴 */}
                    {currentUser?.isAdmin && (
                      <div className="px-3 py-0.5">
                        <button
                          onClick={() => { onClose(); router.push("/family-manage"); }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors ${rowHover}`}
                        >
                          <Shield size={14} className="text-primary-500 shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
                            가족 관리
                          </span>
                        </button>
                      </div>
                    )}

                    <AccordionSection title="내 활동" isOpen={openSection === "activity"}
                      onToggle={() => toggleSection("activity")} rowHover={rowHover} labelColor={labelColor}
                    >
                      <AccordionItem label="게시글"  icon={<FileText      size={14} />} rowHover={rowHover} itemColor={itemColor} onClick={() => { onClose(); router.push("/my-posts"); }} />
                      <AccordionItem label="반응"    icon={<Heart         size={14} />} rowHover={rowHover} itemColor={itemColor} onClick={() => { onClose(); router.push("/my-reactions"); }} />
                      <AccordionItem label="댓글"    icon={<MessageCircle size={14} />} rowHover={rowHover} itemColor={itemColor} onClick={() => { onClose(); router.push("/my-comments"); }} />
                    </AccordionSection>

                    <AccordionSection title="율무 앨범" isOpen={openSection === "album"}
                      onToggle={() => toggleSection("album")} rowHover={rowHover} labelColor={labelColor}
                    >
                      <AccordionItem
                        label="즐겨찾기"
                        icon={<Bookmark size={14} />}
                        rowHover={rowHover}
                        itemColor={itemColor}
                        onClick={() => { onClose(); router.push("/album/favorites"); }}
                      />
                    </AccordionSection>

                    <AccordionSection title="설정" isOpen={openSection === "settings"}
                      onToggle={() => toggleSection("settings")} rowHover={rowHover} labelColor={labelColor}
                    >
                      <div className="px-1">
                        <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors ${rowHover}`}>
                          <div className={`flex items-center gap-2.5 text-sm ${itemColor}`}>
                            {isDark ? <Moon size={14} /> : <Sun size={14} />}
                            다크 모드
                          </div>
                          <ToggleSwitch checked={isDark} onChange={() => setTheme(isDark ? "light" : "dark")} />
                        </div>
                      </div>
                      <AccordionItem label="알림 설정" icon={<Bell size={14} />} rowHover={rowHover} itemColor={itemColor} onClick={() => { onClose(); router.push("/settings/notifications"); }} />
                      <AccordionItem label="앱 정보"   icon={<Info size={14} />} rowHover={rowHover} itemColor={itemColor} onClick={() => { onClose(); router.push("/about"); }} />
                    </AccordionSection>
                  </div>

                  {/* 로그아웃 / 로그인하기 */}
                  <div className={`border-t px-5 pb-8 pt-4 shrink-0 ${divider}`}>
                    {isDemoMode ? (
                      <div className="flex flex-col gap-2">
                        {/* Step 2 가이드: 펄스 + 툴팁 */}
                        <div className="relative">
                          {demoGuideStep === 2 && (
                            <>
                              <span className="absolute inset-0 rounded-2xl animate-ping bg-orange-400/60 pointer-events-none" />
                              <div className="absolute bottom-full left-0 right-0 pointer-events-none" style={{ paddingBottom: "8px" }}>
                                <div className="relative inline-block w-full">
                                  {/* 꼬리 (아래쪽) */}
                                  <div className="absolute left-5 -bottom-1.5" style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "8px solid #f97316" }} />
                                  <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                                    className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
                                  >
                                    여기를 눌러 데이터를 초기화하세요!
                                  </motion.div>
                                </div>
                              </div>
                            </>
                          )}
                          <button
                            onClick={() => setResetConfirmOpen(true)}
                            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                              demoGuideStep === 2
                                ? "bg-orange-50 text-orange-600"
                                : isDark
                                  ? "text-slate-400 hover:bg-slate-800"
                                  : "text-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            <RotateCcw size={16} />
                            체험판 초기화
                          </button>
                        </div>
                        <button
                          onClick={() => { deactivateDemo(); onClose(); router.push("/login"); }}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-medium text-primary-500 transition-colors ${
                            isDark ? "hover:bg-primary-500/10" : "hover:bg-primary-50"
                          }`}
                        >
                          <LogIn size={18} />
                          로그인하기
                        </button>
                      </div>
                    ) : (
                      <button onClick={handleLogout}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-sm font-medium text-red-400 transition-colors ${
                          isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                        }`}
                      >
                        <LogOut size={18} />
                        로그아웃
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {view === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  className="flex h-full flex-col overflow-y-auto"
                >
                  {/* 헤더 */}
                  <div className={`flex h-12 items-center justify-between border-b px-4 shrink-0 ${divider}`}>
                    <button
                      onClick={() => setView("menu")}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${rowHover}`}
                      aria-label="뒤로"
                    >
                      <ArrowLeft size={18} style={{ color: iconColor }} />
                    </button>
                    <span className="text-sm font-semibold">프로필 수정</span>
                    <div className="w-8" />
                  </div>

                  {/* 폼 */}
                  <div className="flex-1 px-5 py-6 space-y-5">

                    {/* 프로필 사진 */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarPreview}
                            alt="프로필"
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-400 to-primary-200 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              {editNickname.charAt(0) || currentUser?.name?.charAt(0) || "?"}
                            </span>
                          </div>
                        )}
                        {/* 카메라 오버레이 */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={photoUploading}
                          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
                          aria-label="사진 변경"
                        >
                          {photoUploading
                            ? <Loader2 size={14} className="text-white animate-spin" />
                            : <Camera size={14} className="text-white" />
                          }
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoUploading}
                        className={`text-xs disabled:opacity-50 ${isDark ? "text-primary-400" : "text-primary-500"}`}
                      >
                        {photoUploading ? "업로드 중..." : "사진 변경"}
                      </button>
                      {photoError && (
                        <p className="text-xs text-red-400 text-center">{photoError}</p>
                      )}
                    </div>

                    {/* 닉네임 */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${subText}`}>닉네임</label>
                      <input
                        type="text"
                        value={editNickname}
                        onChange={e => setEditNickname(e.target.value)}
                        maxLength={20}
                        placeholder="닉네임을 입력하세요"
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors ${inputBorder}`}
                      />
                    </div>

                    {/* 한 줄 소개 */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-medium ${subText}`}>한 줄 소개</label>
                      <textarea
                        value={editBio}
                        onChange={e => setEditBio(e.target.value)}
                        maxLength={60}
                        rows={2}
                        placeholder="나를 한 줄로 소개해보세요"
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors ${inputBorder}`}
                      />
                    </div>
                  </div>

                  {/* 저장 / 취소 버튼 */}
                  <div className={`border-t px-5 pb-8 pt-4 flex flex-col gap-2 shrink-0 ${divider}`}>
                    {demoNotice && (
                      <div
                        className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs"
                        style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c" }}
                      >
                        <span className="flex-1 leading-snug">
                          프로필 수정은 로그인 후 이용할 수 있어요
                        </span>
                        <button
                          onClick={() => { deactivateDemo(); onClose(); router.push("/login"); }}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold"
                          style={{ backgroundColor: "#ea580c", color: "#ffffff" }}
                        >
                          로그인
                        </button>
                      </div>
                    )}
                    {saveError && (
                      <p className="text-center text-xs text-red-400">{saveError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setView("menu")}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                          isDark
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={!editNickname.trim() || saving}
                        className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                      >
                        {saving ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
    {/* 체험판 초기화 확인 모달 — z-[1200]으로 드로어(z-[1100]) 위에 렌더 */}
    <div className="relative z-[1200]">
      <ConfirmModal
        open={resetConfirmOpen}
        title="체험판 데이터를 모두 초기화할까요?"
        description="작성한 글과 일정이 모두 사라져요."
        confirmLabel="초기화"
        onConfirm={() => {
          resetDemoData();
          setDemoGuideStep(0);
          setResetConfirmOpen(false);
          onClose();
          router.push("/");
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
    </>
  );

  return createPortal(drawer, document.body);
}
