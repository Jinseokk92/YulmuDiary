"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface StickerPickerProps {
  onSelect: (emoji: string) => void;
  isDark?: boolean;
}

const CATEGORIES = [
  {
    label: "아기/육아",
    emojis: ["👶", "🍼", "🧒", "👣", "🎒", "🧸", "🪇", "🍭", "🎀", "🧷"],
  },
  {
    label: "감정",
    emojis: ["😊", "😂", "🥰", "😍", "🥺", "😢", "😴", "🤗", "😎", "🥳"],
  },
  {
    label: "동물",
    emojis: ["🐶", "🐱", "🐰", "🐻", "🦊", "🐥", "🐸", "🦋", "🐢", "🐳"],
  },
  {
    label: "음식",
    emojis: ["🍚", "🍜", "🍎", "🍌", "🧁", "🍪", "🥛", "🍓", "🥕", "🍙"],
  },
  {
    label: "날씨/자연",
    emojis: ["☀️", "🌈", "⭐", "🌸", "🍀", "🌻", "❄️", "🌙", "☁️", "🌊"],
  },
] as const;

export default function StickerPicker({ onSelect, isDark = false }: StickerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, handleClickOutside]);

  return (
    <div ref={pickerRef} className="relative">
      {/* 토글 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 text-sm transition-colors ${
          isDark ? "text-[#737373] hover:text-[#A8A8A8]" : "text-gray-400 hover:text-gray-600"
        }`}
        aria-label="이모지 삽입"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
          />
        </svg>
        <span>이모지</span>
      </button>

      {/* 피커 패널 */}
      {isOpen && (
        <div className={`absolute bottom-full left-0 mb-2 w-72 rounded-xl z-20 border ${
          isDark ? "bg-[#121212] border-[#262626]" : "bg-white border-gray-200 shadow-lg"
        }`}>
          {/* 카테고리 탭 */}
          <div className={`flex border-b px-1 pt-1 gap-0.5 overflow-x-auto scrollbar-hide ${
            isDark ? "border-[#262626]" : "border-gray-100"
          }`}>
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`shrink-0 px-2.5 py-1.5 text-xs rounded-t-lg transition-colors ${
                  activeTab === idx
                    ? isDark ? "bg-primary-500/15 text-primary-400 font-semibold" : "bg-primary-50 text-primary-600 font-semibold"
                    : isDark ? "text-[#737373] hover:text-[#A8A8A8]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 이모지 그리드 */}
          <div className="grid grid-cols-5 gap-1 p-3">
            {CATEGORIES[activeTab].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-center w-full aspect-square text-2xl
                           rounded-lg transition-colors ${
                             isDark ? "hover:bg-[#2A2A2A] active:bg-[#2A2A2A]" : "hover:bg-gray-100 active:bg-gray-200"
                           }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
