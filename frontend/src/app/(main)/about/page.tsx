"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { darkPalette } from "@/lib/theme/darkPalette";

// ── 스크롤 fade-in 훅 ─────────────────────────────────────────────────────────

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ── fade-in 래퍼 ──────────────────────────────────────────────────────────────

function FadeBlock({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── 감성 문구 한 줄 ───────────────────────────────────────────────────────────

function LetterLine({
  text,
  delay,
  color,
  fontSize,
  fontStyle,
}: {
  text: string;
  delay: number;
  color: string;
  fontSize?: string;
  fontStyle?: string;
}) {
  return (
    <FadeBlock delay={delay} className="text-center px-6">
      <p
        style={{
          color,
          fontSize: fontSize ?? "17px",
          fontStyle: fontStyle ?? "normal",
          fontFamily: "Georgia, 'Nanum Myeongjo', serif",
          lineHeight: 1.85,
          letterSpacing: "0.02em",
        }}
      >
        {text}
      </p>
    </FadeBlock>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  // 다크모드 대응 색상 — 라이트의 편지지/세피아 콘셉트는 그대로 두고,
  // 다크는 밝은 세피아 대신 near-black 표면 + 중성 텍스트로 재설계한다.
  const headerBg     = isDark ? darkPalette.background : "transparent";
  const headerBorder = isDark ? darkPalette.border : "#f3f4f6";
  const backColor    = isDark ? darkPalette.textPrimary : "#4A3728";
  const heroBg       = isDark
    ? `linear-gradient(180deg, ${darkPalette.background} 0%, ${darkPalette.pageBackground} 100%)`
    : "linear-gradient(180deg, #fffbf5 0%, #fdf4e7 100%)";
  const letterBg     = isDark
    ? `linear-gradient(180deg, ${darkPalette.background} 0%, ${darkPalette.surface} 60%, ${darkPalette.background} 100%)`
    : "linear-gradient(180deg, #fdf4e7 0%, #fff9f2 50%, #fdf4e7 100%)";
  const creditsBg    = isDark ? darkPalette.background : "#faf7f2";
  const letterColor  = isDark ? darkPalette.textPrimary : "#4A3728";
  const lastLineColor= isDark ? "#e4701e"   : "#e4701e";
  const heroName     = isDark ? darkPalette.textPrimary : "#3d2310";
  const heroVersion  = isDark ? darkPalette.textSecondary : "#a18070";
  const heroTagline  = isDark ? darkPalette.textSecondary : "#7a5c4a";
  const creditsLabel = isDark ? darkPalette.textMuted : "#9ca3af";
  const creditsValue = isDark ? darkPalette.textSecondary : "#6b7280";
  const dividerColor = isDark ? darkPalette.border : "#e8d9c8";
  const footerColor  = isDark ? darkPalette.textMuted : "#b0a090";

  const letterLines = [
    { text: "율무야,", delay: 0 },
    { text: "언젠가 이 일기장을 펼쳐보는 날이 오면", delay: 80 },
    { text: "네가 오기 전부터 얼마나 소중했는지", delay: 160 },
    { text: "꼭 알게 되었으면 좋겠다 🌱", delay: 240 },
    { text: "25주차의 너는 850g,", delay: 0 },
    { text: "주수에 비해 커서 간식을 줄여야한데 😅", delay: 80 },
    { text: "엄마가 얼마나 입덧이 심했는지 넌 모를거야 🤢", delay: 160 },
    { text: "건강하게만 자라다오", delay: 0 },
    { text: "그리고 엄마말 안들으면 죽음이야 🌚", delay: 80 },
    { text: "엄마, 아빠는 봐주고 그런거 없어", delay: 160 },
  ];

  return (
    <div
      className="min-h-screen pb-32 overflow-x-hidden"
      style={{ background: isDark ? darkPalette.background : "#fffbf5" }}
    >
      {/* 헤더 */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 px-2 py-3 border-b"
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors active:opacity-70"
          aria-label="뒤로"
        >
          <ArrowLeft size={22} style={{ color: backColor }} />
        </button>
        <h1
          className="text-base font-bold"
          style={{ color: backColor, fontFamily: "Georgia, serif" }}
        >
          앱 정보
        </h1>
      </div>

      {/* ── 히어로 섹션 ── */}
      <div
        className="flex flex-col items-center pt-16 pb-16 px-6"
        style={{ background: heroBg }}
      >
        {/* 앱 아이콘 */}
        <FadeBlock delay={0}>
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-lg mb-6"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #e4701e 100%)",
              boxShadow: "0 8px 32px rgba(228,112,30,0.3)",
            }}
          >
            📋
          </div>
        </FadeBlock>

        <FadeBlock delay={120}>
          <h2
            className="text-3xl font-bold tracking-tight text-center mb-2"
            style={{ color: heroName, fontFamily: "Georgia, serif" }}
          >
            율무일기장
          </h2>
        </FadeBlock>

        <FadeBlock delay={200}>
          <p className="text-sm mb-6" style={{ color: heroVersion }}>
            v1.0.0
          </p>
        </FadeBlock>

        <FadeBlock delay={300}>
          <p
            className="text-base text-center leading-relaxed max-w-xs"
            style={{
              color: heroTagline,
              fontFamily: "Georgia, serif",
              lineHeight: 1.8,
            }}
          >
            율무의 성장을 기록하는
            <br />
            우리 가족만의 일기장.
            <br />
            소중한 매일을 함께 담아갑니다.
          </p>
        </FadeBlock>
      </div>

      {/* 구분선 */}
      <div className="flex items-center justify-center px-12 py-2">
        <div className="h-px flex-1" style={{ backgroundColor: dividerColor }} />
        <span className="mx-4 text-lg" style={{ color: dividerColor }}>✦</span>
        <div className="h-px flex-1" style={{ backgroundColor: dividerColor }} />
      </div>

      {/* ── 감성 편지 섹션 ── */}
      <div
        className="py-16 flex flex-col"
        style={{ background: letterBg, gap: "52px" }}
      >
        {letterLines.map((line, i) => (
          <LetterLine
            key={i}
            text={line.text}
            delay={line.delay}
            color={letterColor}
          />
        ))}

        {/* 구분 여백 */}
        <div style={{ height: "8px" }} />

        <LetterLine
          text="그럼에도 불구하고 사랑한다 율무야 ❤️"
          delay={0}
          color={lastLineColor}
          fontSize="20px"
          fontStyle="italic"
        />
      </div>

      {/* 구분선 */}
      <div className="flex items-center justify-center px-12 py-2">
        <div className="h-px flex-1" style={{ backgroundColor: dividerColor }} />
        <span className="mx-4 text-sm" style={{ color: dividerColor }}>— fin —</span>
        <div className="h-px flex-1" style={{ backgroundColor: dividerColor }} />
      </div>

      {/* ── 크레딧 섹션 ── */}
      <div
        className="pt-14 pb-10 flex flex-col items-center gap-8 px-6"
        style={{ background: creditsBg }}
      >
        <FadeBlock delay={0} className="text-center">
          <p
            className="text-xl font-semibold mb-1"
            style={{ color: isDark ? darkPalette.textPrimary : "#4A3728" }}
          >
            Made with ❤️
          </p>
        </FadeBlock>

        {/* 크레딧 항목들 */}
        {[
          { label: "기획 · 개발", value: "정진석" },
          { label: "UI/UX 아이디어", value: "김현정" },
          { label: "율무 아빠", value: "정진석" },
          { label: "율무 엄마", value: "김현정" },
        ].map((item, i) => (
          <FadeBlock key={i} delay={i * 80} className="text-center">
            <p
              className="text-xs uppercase tracking-widest mb-1"
              style={{ color: creditsLabel }}
            >
              {item.label}
            </p>
            <p
              className="text-base"
              style={{
                color: creditsValue,
                fontFamily: "Georgia, serif",
                letterSpacing: "0.05em",
              }}
            >
              {item.value}
            </p>
          </FadeBlock>
        ))}

        {/* 앱 아이콘 소형 */}
        <FadeBlock delay={0}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mt-4 shadow-md"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #e4701e 100%)",
              boxShadow: "0 4px 16px rgba(228,112,30,0.25)",
            }}
          >
            📋
          </div>
        </FadeBlock>
      </div>

      {/* ── 푸터 ── */}
      <div
        className="flex flex-col items-center gap-3 pt-6 pb-8 px-6"
        style={{ background: creditsBg }}
      >
        <p className="text-xs" style={{ color: footerColor }}>
          © 2026 율무일기장. All rights reserved.
        </p>
        <a
          href="mailto:wjdwlstjrz@naver.com"
          className="text-xs underline underline-offset-2 transition-opacity active:opacity-60"
          style={{ color: isDark ? darkPalette.textSecondary : "#a18070" }}
        >
          문의: wjdwlstjrz@naver.com
        </a>
      </div>
    </div>
  );
}
