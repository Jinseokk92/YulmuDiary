"use client";

import { createContext, useContext, useEffect, useState } from "react";

type FontSizeMode = "normal" | "large";

const FontSizeContext = createContext<{
  mode: FontSizeMode;
  toggle: () => void;
}>({ mode: "normal", toggle: () => {} });

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<FontSizeMode>("normal");

  // 앱 첫 로드 시 localStorage에서 저장된 설정 복원
  useEffect(() => {
    const saved = localStorage.getItem("font-size-mode") as FontSizeMode | null;
    if (saved === "large") setMode("large");
  }, []);

  // mode 변경 시 <html> 요소에 클래스 반영
  // → rem 기반 모든 사이즈가 자동으로 스케일업
  useEffect(() => {
    if (mode === "large") {
      document.documentElement.classList.add("font-large");
    } else {
      document.documentElement.classList.remove("font-large");
    }
  }, [mode]);

  const toggle = () => {
    setMode((prev) => {
      const next = prev === "normal" ? "large" : "normal";
      localStorage.setItem("font-size-mode", next);
      return next;
    });
  };

  return (
    <FontSizeContext.Provider value={{ mode, toggle }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
