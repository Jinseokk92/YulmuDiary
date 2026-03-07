"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/contexts/UserContext";
import { useFontSize } from "@/contexts/FontSizeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import SideDrawer from "@/components/layout/SideDrawer";
import { useUiStore } from "@/stores/uiStore";

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
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

  const isDark = mounted && resolvedTheme === "dark";

  const handleMenuClick = () => {
    setShowGuide(false);
    setDrawerOpen(true);
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderColor: isDark ? "#1e293b" : "#e5e7eb",
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
                    : isDark ? "#94a3b8" : "#9ca3af",
                }}
                aria-label={fontSizeMode === "large" ? "글자 크기 줄이기" : "글자 크기 키우기"}
                title={fontSizeMode === "large" ? "글자 크기 줄이기" : "글자 크기 키우기"}
              >
                <ZoomIn size={20} />
              </button>

            {/* 메뉴 버튼 + 말풍선을 relative 컨테이너로 감쌈 */}
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl active:scale-95 transition-all"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = isDark ? "#1e293b" : "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
                aria-label="메뉴 열기"
              >
                <UserAvatar
                  nickname={currentUser.name}
                  profileImageUrl={currentUser.profileImageUrl}
                  size="sm"
                />
                <span
                  className="text-sm font-medium max-w-[6rem] truncate"
                  style={{ color: isDark ? "#e2e8f0" : "#374151" }}
                >
                  {currentUser.name}
                </span>
                <Menu
                  size={18}
                  style={{ color: isDark ? "#64748b" : "#9ca3af" }}
                  className="ml-0.5"
                />
              </button>

              {/* 말풍선 */}
              <AnimatePresence>
                {showGuide && (
                  /* 외부 div: 입장/퇴장 페이드 */
                  <motion.div
                    className="absolute top-full right-0 mt-3 z-50"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    {/* 내부 div: 둥둥 float 효과 */}
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        ease: "easeInOut",
                      }}
                    >
                      <MenuGuide />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
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
    </>
  );
}
