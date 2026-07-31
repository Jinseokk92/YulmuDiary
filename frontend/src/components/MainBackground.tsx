"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { darkPalette } from "@/lib/theme/darkPalette";

// ─── 다크: near-black 배경, 밤하늘 연출 없음 ──────────────────────────────
function SubtleDarkBg() {
  return (
    <motion.div
      key="main-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${darkPalette.background}, ${darkPalette.pageBackground})` }}
    />
  );
}

// ─── 라이트: 구름 2개 + 하늘색 그라디언트 ────────────────────────────────
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

const CLOUD_CONFIGS = [
  { width: 300, top: "8%",  duration: 38, delay: 0,   opacity: 0.22 },
  { width: 220, top: "48%", duration: 30, delay: -15, opacity: 0.18 },
];

function SubtleLightBg() {
  return (
    <motion.div
      key="main-light"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: "linear-gradient(to bottom, #e0f2fe, #f0f9ff, #f8fafc)" }}
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
            repeatType: "loop" as const,
          }}
        >
          <CloudShape opacity={cloud.opacity} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── 메인 export ─────────────────────────────────────────────────────────────
export default function MainBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      {resolvedTheme === "dark" ? <SubtleDarkBg /> : <SubtleLightBg />}
    </AnimatePresence>
  );
}
