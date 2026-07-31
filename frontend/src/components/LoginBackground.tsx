"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { darkPalette } from "@/lib/theme/darkPalette";

// ─── 구름 SVG ───────────────────────────────────────────────────────────────
function CloudShape({ opacity }: { opacity: number }) {
  return (
    <svg viewBox="0 0 300 120" style={{ opacity }} aria-hidden>
      <ellipse cx="150" cy="95" rx="130" ry="35" fill="white" />
      <ellipse cx="95"  cy="72" rx="78"  ry="52" fill="white" />
      <ellipse cx="200" cy="72" rx="68"  ry="46" fill="white" />
      <ellipse cx="150" cy="60" rx="95"  ry="55" fill="white" />
    </svg>
  );
}

// ─── 다크 배경 (near-black, 밤하늘 연출 없음) ─────────────────────────────────
export function DarkBackground() {
  return (
    <motion.div
      key="dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${darkPalette.background}, ${darkPalette.pageBackground})` }}
    />
  );
}

// ─── 구름 설정 ───────────────────────────────────────────────────────────────
const CLOUD_CONFIGS = [
  { width: 260, top: "8%",  duration: 30, delay: 0,   opacity: 0.55 },
  { width: 340, top: "32%", duration: 40, delay: -14, opacity: 0.38 },
  { width: 190, top: "62%", duration: 23, delay: -7,  opacity: 0.48 },
];

// ─── 라이트 배경 (구름 3개) ──────────────────────────────────────────────────
function LightBackground() {
  return (
    <motion.div
      key="light"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-0 bg-gradient-to-b from-[#e0f2fe] to-[#f8fafc] overflow-hidden pointer-events-none"
    >
      {CLOUD_CONFIGS.map((cloud, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: cloud.top, width: cloud.width }}
          initial={{ x: "-110%" }}
          animate={{ x: "110vw" }}
          transition={{
            duration: cloud.duration,
            delay: cloud.delay,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          }}
        >
          <CloudShape opacity={cloud.opacity} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── 메인 export ─────────────────────────────────────────────────────────────
export default function LoginBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hydration 오류 방지: 클라이언트 마운트 후에만 테마 읽기
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    // pointer-events-none: 배경 레이어가 버튼/콘텐츠 클릭을 가로막지 않도록 함
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence mode="wait">
        {resolvedTheme === "dark"
          ? <DarkBackground key="dark" />
          : <LightBackground key="light" />}
      </AnimatePresence>
    </div>
  );
}
