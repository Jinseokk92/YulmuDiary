"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { useUser } from "@/contexts/UserContext";
import { useFontSize } from "@/contexts/FontSizeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, ZoomIn, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SideDrawer from "@/components/layout/SideDrawer";
import { useUiStore } from "@/stores/uiStore";
import { api } from "@/lib/api";
import { darkPalette } from "@/lib/theme/darkPalette";

const GUIDE_INTERVAL_MS = 3 * 60 * 1000; // 5분마다 반복 표시

// ─── 말풍선 가이드 ─────────────────────────────────────────────────────────
function MenuGuide() {
  return (
    <div className="relative">
      {/* 꼬리: 말풍선 위쪽 오른편 → 메뉴 버튼 방향 */}
      <div
        className="absolute right-5 -top-2"
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderBottom: "8px solid #fef3c7",
        }}
      />
      {/* 꼬리 테두리 (외곽선) */}
      <div
        className="absolute right-[18px] -top-[11px]"
        style={{
          width: 0,
          height: 0,
          borderLeft: "9px solid transparent",
          borderRight: "9px solid transparent",
          borderBottom: "9px solid #fcd34d",
          zIndex: -1,
        }}
      />

      {/* 말풍선 본체 */}
      <div
        className="rounded-2xl px-4 py-3 shadow-lg border text-sm leading-snug"
        style={{
          backgroundColor: "#fef3c7",
          borderColor: "#fcd34d",
          color: "#92400e",
          whiteSpace: "nowrap",
        }}
      >
        여기를 누르면 로그아웃과 설정을 할 수 있어요!
      </div>
    </div>
  );
}

export default function Header() {
  const { currentUser, loading } = useUser();
  const { resolvedTheme } = useTheme();
  const { mode: fontSizeMode, toggle: toggleFontSize } = useFontSize();
  const router = useRouter();
  const drawerOpen = useUiStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen);
  const demoGuideStep = useUiStore((state) => state.demoGuideStep);
  const setDemoGuideStep = useUiStore((state) => state.setDemoGuideStep);
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => setDrawerOpen(false);
  }, [setDrawerOpen]);

  // mounted 후 1초 뒤 첫 표시, 이후 5분마다 반복
  useEffect(() => {
    if (!mounted) return;

    const showTimer = setTimeout(() => setShowGuide(true), 1000);
    const interval = setInterval(() => setShowGuide(true), GUIDE_INTERVAL_MS);

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, [mounted]);

  // 5초 후 자동으로 사라짐
  useEffect(() => {
    if (!showGuide) return;
    const hideTimer = setTimeout(() => setShowGuide(false), 5000);
    return () => clearTimeout(hideTimer);
  }, [showGuide]);

  // 미읽 알림 수 폴링 (30초 간격)
  useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = async () => {
      try {
        const data = await api.get<{ count: number }>("/api/notifications/unread-count");
        setUnreadCount(data?.count ?? 0);
      } catch {
        // 백엔드 미구현 시 무시
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const isDark = mounted && resolvedTheme === "dark";

  const handleMenuClick = () => {
    setShowGuide(false);
    setShowSkip(false);
    if (demoGuideStep === 1) setDemoGuideStep(2);
    setDrawerOpen(true);
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: isDark ? darkPalette.navigationBackground : "#ffffff",
          borderColor: isDark ? darkPalette.border : "#e5e7eb",
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
          {/* 로고 이미지 — 클릭 시 홈으로 이동 */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/icons/icon-192x192.png"
              alt="율무일기"
              width={36}
              height={36}
              className="object-contain rounded-xl"
              priority
            />
          </Link>

          {loading ? (
            <div className="h-8 w-20 rounded bg-gray-200 animate-pulse" />
          ) : currentUser ? (
            /* 돋보기 + 메뉴 버튼 + 말풍선을 묶는 영역 */
            <div className="flex items-center gap-1">

              {/* 돋보기 버튼 */}
              <button
                onClick={toggleFontSize}
                className="p-2 rounded-lg transition-colors active:scale-95"
                style={{
                  color: fontSizeMode === "large"
                    ? "#e4701e"
                    : isDark ? darkPalette.textSecondary : "#9ca3af",
                }}
                aria-label={fontSizeMode === "large" ? "글자 크기 줄이기" : "글자 크기 키우기"}
                title={fontSizeMode === "large" ? "글자 크기 줄이기" : "글자 크기 키우기"}
              >
                <ZoomIn size={20} />
              </button>

            {/* 알림 벨 버튼 */}
            <button
              onClick={() => {
                setUnreadCount(0);
                router.push("/notifications");
              }}
              className="relative p-2 rounded-lg transition-colors active:scale-95"
              style={{ color: isDark ? darkPalette.textSecondary : "#9ca3af" }}
              aria-label="알림"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* 메뉴 버튼 + 말풍선을 relative 컨테이너로 감쌈 */}
            <div className="relative">
              {/* Step 1 가이드: 펄스 링 */}
              {demoGuideStep === 1 && (
                <span className="absolute inset-0 rounded-xl animate-ping bg-orange-400/70 pointer-events-none" />
              )}

              <button
                onClick={handleMenuClick}
                className="relative p-2 rounded-xl active:scale-95 transition-all"
                style={{ zIndex: demoGuideStep === 1 ? 1 : undefined }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = isDark ? darkPalette.hover : "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
                aria-label="메뉴 열기"
              >
                <Menu
                  size={20}
                  style={{ color: demoGuideStep === 1 ? "#f97316" : isDark ? darkPalette.textMuted : "#9ca3af" }}
                />
              </button>

              {/* Step 1 가이드: 툴팁 말풍선 */}
              {demoGuideStep === 1 && (
                <motion.div
                  className="absolute top-full right-0 mt-3 z-50 pointer-events-none"
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                  transition={{ y: { repeat: Infinity, duration: 1.8, ease: "easeInOut" }, opacity: { duration: 0.2 }, scale: { duration: 0.2 } }}
                >
                  {/* 꼬리 (위쪽) */}
                  <div className="absolute right-3.5 -top-1.5" style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "8px solid #f97316" }} />
                  <div className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg whitespace-nowrap">
                    여기를 눌러주세요!
                  </div>
                </motion.div>
              )}

              {/* 기존 MenuGuide 말풍선 (Step 1 가이드 중에는 숨김) */}
              {demoGuideStep !== 1 && (
                <AnimatePresence>
                  {showGuide && (
                    <motion.div
                      className="absolute top-full right-0 mt-3 z-50"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                      >
                        <MenuGuide />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-primary-600"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Step 1 가이드 오버레이: z-[25] → 헤더(z-30) 아래, 본문 위 */}
      {demoGuideStep === 1 && mounted && createPortal(
        <div
          className="fixed inset-0"
          style={{ zIndex: 25, backgroundColor: isDark ? darkPalette.overlay : "rgba(0,0,0,0.5)" }}
          onClick={() => setShowSkip(true)}
        >
          {showSkip && (
            <div className="absolute inset-0 flex items-center justify-center px-8">
              <div
                className={`w-full max-w-xs rounded-2xl px-6 py-5 text-center ${isDark ? "shadow-none" : "shadow-2xl"}`}
                style={{ backgroundColor: isDark ? darkPalette.surface : "#ffffff" }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="mb-4 text-sm font-medium" style={{ color: isDark ? darkPalette.textPrimary : "#1f2937" }}>가이드를 건너뛸까요?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSkip(false)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                      isDark ? "border-[#262626] text-[#A8A8A8] hover:bg-[#2A2A2A]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("demo_guide_skipped", "true");
                      setDemoGuideStep(0);
                      setShowSkip(false);
                    }}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors ${
                      isDark ? "bg-[#2A2A2A] hover:bg-[#333333]" : "bg-gray-700 hover:bg-gray-800"
                    }`}
                  >
                    건너뛰기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
