"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { X, Moon, Sun, LogOut, Settings } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import UserAvatar from "@/components/ui/UserAvatar";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── 커스텀 토글 스위치 ────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none
                  ${checked ? "bg-primary-500" : "bg-gray-300"}`}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </button>
  );
}

// ─── 사이드 드로어 ────────────────────────────────────────────────────────
export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const { currentUser, logout } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isDark = mounted && resolvedTheme === "dark";

  const handleLogout = () => {
    onClose();
    logout();
    router.push("/login");
  };

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // tailwind.config에 darkMode:"class" 없으므로 isDark로 직접 분기
  const bg      = isDark ? "bg-[#0f172a]"   : "bg-white";
  const text     = isDark ? "text-white"      : "text-gray-900";
  const subText  = isDark ? "text-slate-400"  : "text-gray-500";
  const divider  = isDark ? "border-slate-700" : "border-gray-100";
  const rowHover = isDark ? "hover:bg-slate-800" : "hover:bg-gray-50";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── 오버레이 ── */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`fixed inset-0 z-40 backdrop-blur-sm ${isDark ? "bg-black/60" : "bg-black/40"}`}
          />

          {/* ── 드로어 패널 ── */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={`fixed top-0 right-0 z-50 h-full w-72 flex flex-col
                        shadow-2xl ${bg} ${text}`}
          >
            {/* ── 드로어 헤더 ── */}
            <div className={`flex items-center justify-between px-5 h-14 border-b ${divider}`}>
              <span className="font-semibold text-base">메뉴</span>
              <button
                onClick={onClose}
                className={`w-9 h-9 flex items-center justify-center rounded-xl
                            ${rowHover} transition-colors`}
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            {/* ── 사용자 정보 ── */}
            <div className={`px-5 py-5 border-b ${divider}`}>
              <div className="flex items-center gap-3">
                <UserAvatar
                  nickname={currentUser?.name ?? "?"}
                  profileImageUrl={currentUser?.profileImageUrl}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {currentUser?.name ?? "사용자"}{" "}
                    <span className={subText}>님</span>
                  </p>
                  <p className={`text-xs mt-0.5 ${subText}`}>가족 구성원</p>
                </div>
              </div>
            </div>

            {/* ── 설정 섹션 ── */}
            <div className="px-5 py-4 flex-1">
              <div className="flex items-center gap-1.5 mb-3">
                <Settings size={13} className="text-primary-500" />
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
                  설정
                </p>
              </div>

              {/* 다크모드 토글 */}
              <div
                className={`flex items-center justify-between px-3 py-3.5 rounded-2xl
                            transition-colors ${rowHover}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center
                                  ${isDark ? "bg-slate-700" : "bg-primary-50"}`}>
                    {isDark
                      ? <Moon size={16} className="text-primary-400" />
                      : <Sun  size={16} className="text-primary-500" />
                    }
                  </div>
                  <span className="text-sm font-medium">다크 모드</span>
                </div>
                <ToggleSwitch checked={isDark} onChange={handleToggleTheme} />
              </div>
            </div>

            {/* ── 로그아웃 ── */}
            <div className={`px-5 pb-8 border-t ${divider} pt-4`}>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl
                            text-sm font-medium text-red-400
                            ${isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"}
                            transition-colors`}
              >
                <LogOut size={18} />
                로그아웃
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
