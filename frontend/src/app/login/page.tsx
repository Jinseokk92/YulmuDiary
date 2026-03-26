"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FloatingYulmu from "@/components/FloatingYulmu";
import LoginBackground from "@/components/LoginBackground";
import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ─── 테마 스위처 ─────────────────────────────────────────────────────────────
function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 마운트 전: 레이아웃 시프트 방지 (동일 크기 자리 확보)
  if (!mounted) {
    return <div className="w-12 h-12" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileTap={{ scale: 0.88 }}
      className={`w-12 h-12 flex items-center justify-center rounded-2xl
                  bg-white/30 backdrop-blur-md
                  border border-white/60
                  hover:bg-white/45 transition-colors
                  ${isDark
                    // 다크모드: 노란색 글로우 + 어두운 배경 그림자
                    ? "shadow-[0_0_18px_rgba(253,224,71,0.28),0_4px_14px_rgba(0,0,0,0.4)]"
                    // 라이트모드: 일반 그림자
                    : "shadow-lg"
                  }`}
      aria-label="테마 전환"
    >
      {/* AnimatePresence: 아이콘 교체 시 회전 + 페이드 */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -60, opacity: 0 }}
          animate={{ rotate: 0,   opacity: 1 }}
          exit={{    rotate:  60, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun  className="w-5 h-5 text-yellow-300" />
          ) : (
            <Moon className="w-5 h-5 text-slate-500" />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// ─── 아이콘 ──────────────────────────────────────────────────────────────────
function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3C5.58 3 2 5.8 2 9.25c0 2.22 1.48 4.17 3.7 5.27-.16.6-.59 2.17-.67 2.51-.1.42.15.41.32.3.13-.09 2.1-1.43 2.95-2.01.54.08 1.1.12 1.7.12 4.42 0 8-2.8 8-6.19C18 5.8 14.42 3 10 3z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.33z" fill="#4285F4" />
      <path d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.08v2.58A9.99 9.99 0 0010 20z" fill="#34A853" />
      <path d="M4.42 11.89A6.01 6.01 0 014.1 10c0-.66.12-1.3.32-1.89V5.53H1.08A9.99 9.99 0 000 10c0 1.61.39 3.14 1.08 4.47l3.34-2.58z" fill="#FBBC05" />
      <path d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.86-2.87C14.96.99 12.7 0 10 0A9.99 9.99 0 001.08 5.53l3.34 2.58C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335" />
    </svg>
  );
}

// ─── 페이지 ──────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { activateDemo } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  const handleDemo = () => {
    activateDemo();
    router.push("/");
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 배경 애니메이션 레이어 (z-[-10]) */}
      <LoginBackground />

      {/* 우측 상단 테마 스위처: 모바일에서 노치/상태바 아래로 배치 */}
      <div className="absolute top-12 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeSwitcher />
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* 캐릭터 */}
        <FloatingYulmu />

        {/* 타이틀 */}
        <div className="mt-2 mb-8 text-center">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: isDark ? "#fb923c" : "#e4701e" }}
          >
            율무일기
          </h1>
          <p
            className="text-sm"
            style={{ color: isDark ? "#94a3b8" : "#6b7280" }}
          >
            우리 아이의 소중한 순간을 가족과 함께
          </p>
        </div>

        {/* 로그인 버튼 */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleKakaoLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                       bg-[#FEE500] text-[#191919] font-medium text-sm
                       hover:brightness-95 transition-all active:scale-[0.98]"
          >
            <KakaoIcon />
            카카오로 시작하기
          </button>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                       font-medium text-sm transition-all active:scale-[0.98]"
            style={isDark ? {
              backgroundColor: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
            } : {
              backgroundColor: "#ffffff",
              color: "#374151",
              border: "1px solid #d1d5db",
            }}
          >
            <GoogleIcon />
            Google로 시작하기
          </button>

          <button
            onClick={handleDemo}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                       font-medium text-sm transition-all active:scale-[0.98]"
            style={isDark ? {
              backgroundColor: "#1c1208",
              border: "1px dashed #92400e",
              color: "#fb923c",
            } : {
              backgroundColor: "#FFF3E8",
              border: "1px dashed #F0C8A0",
              color: "#C2601A",
            }}
          >
            👀 로그인 없이 체험해보기
          </button>
        </div>

        <p
          className="mt-8 text-xs"
          style={{ color: isDark ? "#475569" : "#9ca3af" }}
        >
          로그인 시 서비스 이용약관에 동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}
