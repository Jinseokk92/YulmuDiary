"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

// ─── 달 SVG ────────────────────────────────────────────────────────────────
function Moon() {
  return (
    <svg viewBox="0 0 120 120" width="80" height="80" aria-hidden>
      {/* 초승달: 큰 원에서 오른쪽 원을 잘라냄 */}
      <circle cx="55" cy="60" r="50" fill="#fef9c3" />
      <circle cx="80" cy="48" r="44" fill="#1e293b" />
    </svg>
  );
}

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

// ─── 별 타입 ────────────────────────────────────────────────────────────────
interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

// ─── 다크 배경 (별 50개 + 달) ────────────────────────────────────────────────
export function DarkBackground() {
  // Math.random()은 클라이언트에서만 실행됨 (mounted 후 렌더되므로 hydration 안전)
  const stars: Star[] = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.5 + 1,     // 1~2.5px
        duration: Math.random() * 3 + 2,   // 2~5s
        delay: Math.random() * 5,           // 0~5s
      })),
    []
  );

  return (
    <motion.div
      key="dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[-10] bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#020617] overflow-hidden"
    >
      {/* 별: opacity [0.2 → 1 → 0.2] 무한 반짝임 */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.15, 1, 0.15] }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 달: 아래→위 슬며시 떠오름 (초기 1회 애니메이션) */}
      <motion.div
        className="absolute top-10 right-10"
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2.2, ease: "easeOut" }}
      >
        <Moon />
      </motion.div>
    </motion.div>
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
      className="fixed inset-0 z-[-10] bg-gradient-to-b from-[#e0f2fe] to-[#f8fafc] overflow-hidden"
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
    // AnimatePresence mode="wait": 기존 배경 fade-out 후 새 배경 fade-in
    <AnimatePresence mode="wait">
      {resolvedTheme === "dark" ? <DarkBackground /> : <LightBackground />}
    </AnimatePresence>
  );
}
