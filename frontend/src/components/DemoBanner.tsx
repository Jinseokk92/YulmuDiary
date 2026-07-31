"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { darkPalette } from "@/lib/theme/darkPalette";

export default function DemoBanner() {
  const router = useRouter();
  const { isDemoMode, deactivateDemo } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  // sessionStorage에서 배너 닫힘 여부 복원
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("demo_banner_dismissed");
      if (stored === "true") setDismissed(true);
    }
  }, []);

  const handleLogin = () => {
    deactivateDemo();
    router.push("/login");
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("demo_banner_dismissed", "true");
    }
  };

  return (
    <AnimatePresence>
      {isDemoMode && !dismissed && (
        <motion.div
          key="demo-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{ overflow: "hidden" }}
        >
          <div
            className="flex items-center justify-between gap-2 px-4 py-2 text-xs"
            style={{
              backgroundColor: isDark ? darkPalette.surfaceSecondary : "#fff7ed",
              borderBottom: `1px solid ${isDark ? "rgba(234,88,12,0.3)" : "#fed7aa"}`,
              color: isDark ? "#fb923c" : "#c2410c",
            }}
          >
            <span className="flex-1 text-center font-medium">
              체험판 모드&nbsp;·&nbsp;로그인하면 모든 기능을 이용할 수 있어요
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleLogin}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: "#ea580c",
                  color: "#ffffff",
                }}
              >
                로그인
              </button>
              <button
                onClick={handleDismiss}
                className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  isDark ? "hover:bg-white/10" : "hover:bg-orange-100"
                }`}
                aria-label="배너 닫기"
              >
                <X size={13} style={{ color: isDark ? "#fb923c" : "#c2410c" }} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
