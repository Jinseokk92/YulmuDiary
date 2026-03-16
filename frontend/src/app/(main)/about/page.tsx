"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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

  // 다크모드 대응 색상
  const headerBg     = isDark ? "#0f172a"   : "transparent";
  const headerBorder = isDark ? "#1e293b"   : "#f3f4f6";
  const backColor    = isDark ? "#e2e8f0"   : "#4A3728";
  const heroBg       = isDark
    ? "linear-gradient(180deg, #0f172a 0%, #1a1008 100%)"
    : "linear-gradient(180deg, #fffbf5 0%, #fdf4e7 100%)";
  const letterBg     = isDark
    ? "linear-gradient(180deg, #1a1008 0%, #0f172a 60%, #1a1008 100%)"
    : "linear-gradient(180deg, #fdf4e7 0%, #fff9f2 50%, #fdf4e7 100%)";
  const creditsBg    = isDark ? "#0f172a"   : "#faf7f2";
  const letterColor  = isDark ? "#d4b896"   : "#4A3728";
  const lastLineColor= isDark ? "#e4701e"   : "#e4701e";
  const heroName     = isDark ? "#f5dcc0"   : "#3d2310";
  const heroVersion  = isDark ? "#94a3b8"   : "#a18070";
  const heroTagline  = isDark ? "#b08060"   : "#7a5c4a";
  const creditsLabel = isDark ? "#64748b"   : "#9ca3af";
  const creditsValue = isDark ? "#94a3b8"   : "#6b7280";
  const dividerColor = isDark ? "#2d1e0f"   : "#e8d9c8";
  const footerColor  = isDark ? "#475569"   : "#b0a090";

  const letterLines = [
    { text: "이 일기장은 아직 세상에 오지 않은 너를 기다리며 만들기 시작했어.", delay: 0 },
    { text: "네가 처음 심장소리를 들려줬던 날,", delay: 80 },
    { text: "우리는 얼마나 울었는지 몰라.", delay: 160 },
    { text: "매일매일이 기적 같았고 하루하루가 선물이었어.", delay: 0 },
    { text: "언젠가 네가 이 일기장을 펼쳐본다면 알아줬으면 좋겠어.", delay: 0 },
    { text: "네가 태어나기 전부터 이렇게나 사랑받고 있었다는 걸.", delay: 0 },
  ];

  return (
    <div
      className="min-h-screen pb-32 overflow-x-hidden"
      style={{ background: isDark ? "#0f172a" : "#fffbf5" }}
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
          text="율무야, 사랑해."
          delay={0}
          color={lastLineColor}
          fontSize="22px"
          fontStyle="italic"
        />

        <div style={{ height: "4px" }} />

        <LetterLine
          text="그리고...."
          delay={0}
          color={letterColor}
          fontSize="15px"
        />

        <FadeBlock delay={200} className="text-center px-8">
          <p
            style={{
              color: isDark ? "#9ca3af" : "#7a6a5a",
              fontSize: "15px",
              fontFamily: "Georgia, serif",
              lineHeight: 1.8,
            }}
          >
            엄마 말 안들으면 아빠한테 혼난다 🌚
          </p>
        </FadeBlock>
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
            style={{ color: isDark ? "#d4b896" : "#4A3728" }}
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
          style={{ color: isDark ? "#94a3b8" : "#a18070" }}
        >
          문의: wjdwlstjrz@naver.com
        </a>
      </div>
    </div>
  );
}
