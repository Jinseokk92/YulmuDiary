"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-12 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-primary-500" : "bg-gray-300"
      }`}
    >
      <motion.span
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </button>
  );
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const { currentUser, logout } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const scrollYRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    const body = document.body;
    const appShell = document.getElementById("app-shell");

    if (isOpen) {
      scrollYRef.current = window.scrollY;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollYRef.current}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";

      if (appShell) {
        appShell.style.pointerEvents = "none";
        appShell.setAttribute("inert", "");
      }
    } else {
      const lockedY = scrollYRef.current;
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";

      if (appShell) {
        appShell.style.pointerEvents = "";
        appShell.removeAttribute("inert");
      }

      if (lockedY > 0) {
        window.scrollTo(0, lockedY);
      }
    }

    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";

      if (appShell) {
        appShell.style.pointerEvents = "";
        appShell.removeAttribute("inert");
      }
    };
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const isDark = mounted && resolvedTheme === "dark";

  const handleLogout = () => {
    onClose();
    logout();
    router.push("/login");
  };

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const bg = isDark ? "bg-[#0f172a]" : "bg-white";
  const text = isDark ? "text-white" : "text-gray-900";
  const subText = isDark ? "text-slate-400" : "text-gray-500";
  const divider = isDark ? "border-slate-700" : "border-gray-100";
  const rowHover = isDark ? "hover:bg-slate-800" : "hover:bg-gray-50";

  if (!mounted) return null;

  const drawer = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100]">
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`absolute inset-0 ${isDark ? "bg-black/60" : "bg-black/40"}`}
          />

          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className={`absolute right-0 top-0 flex w-72 max-w-[86vw] flex-col overflow-y-auto shadow-2xl ${bg} ${text}`}
            style={{ height: "100dvh" }}
            role="dialog"
            aria-modal="true"
            aria-label="side menu"
          >
            <div className={`flex h-14 items-center justify-between border-b px-5 ${divider}`}>
              <span className="text-base font-semibold">메뉴</span>
              <button
                onClick={onClose}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${rowHover}`}
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className={`border-b px-5 py-5 ${divider}`}>
              <div className="flex items-center gap-3">
                <UserAvatar
                  nickname={currentUser?.name ?? "?"}
                  profileImageUrl={currentUser?.profileImageUrl}
                  size="md"
                />
                <div>
                  <p className="text-sm font-semibold">
                    {currentUser?.name ?? "사용자"} <span className={subText}>님</span>
                  </p>
                  <p className={`mt-0.5 text-xs ${subText}`}>가족 구성원</p>
                </div>
              </div>
            </div>

            <div className="flex-1 px-5 py-4">
              <div className="mb-3 flex items-center gap-1.5">
                <Settings size={13} className="text-primary-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">설정</p>
              </div>

              <div
                className={`flex items-center justify-between rounded-2xl px-3 py-3.5 transition-colors ${rowHover}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isDark ? "bg-slate-700" : "bg-primary-50"
                    }`}
                  >
                    {isDark ? (
                      <Moon size={16} className="text-primary-400" />
                    ) : (
                      <Sun size={16} className="text-primary-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium">다크 모드</span>
                </div>
                <ToggleSwitch checked={isDark} onChange={handleToggleTheme} />
              </div>
            </div>

            <div className={`border-t px-5 pb-8 pt-4 ${divider}`}>
              <button
                onClick={handleLogout}
                className={`w-full rounded-2xl px-3 py-3.5 text-sm font-medium text-red-400 transition-colors ${
                  isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <LogOut size={18} />
                  로그아웃
                </span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(drawer, document.body);
}
