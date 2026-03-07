"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import MainBackground from "@/components/MainBackground";
import type { UserResponse } from "@/types";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, familyGroupId, setUser, setFamilyGroup } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 낙관적 UI: 스토어의 familyGroupId(쿠키 복원값)가 있으면 즉시 렌더링
  const [checking, setChecking] = useState(familyGroupId == null);

  const fetchLatestStatus = useCallback(async () => {
    try {
      const me = await api.get<UserResponse>("/api/auth/me");
      console.log("📋 [Layout] /api/auth/me →", { id: me.id, familyGroupId: me.familyGroupId, pathname });
      setUser(me);
      setFamilyGroup(me.familyGroupId ?? null);

      if (me.familyGroupId == null && pathname !== "/join") {
        console.warn("⚠️ [Layout] familyGroupId 없음 → /onboarding 리다이렉트");
        router.replace("/onboarding");
      } else {
        setChecking(false);
      }
    } catch (error) {
      console.error("❌ [Layout] /api/auth/me 실패 → /login 리다이렉트", error);
      router.replace("/login");
    }
  }, [pathname, router, setUser, setFamilyGroup]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // 이미 familyGroupId가 있다면 즉시 로딩을 풀고 백그라운드에서 갱신
    if (familyGroupId != null) {
      setChecking(false);
      fetchLatestStatus();
    } else {
      fetchLatestStatus();
    }
  }, [isAuthenticated, familyGroupId, fetchLatestStatus, router]);

  // 마운트 전에는 테마를 알 수 없으므로 기본값 사용
  const isDark = mounted && resolvedTheme === "dark";

  // 가드: 그룹 정보가 아예 없고 체크 중일 때만 스피너 노출
  if (checking && familyGroupId == null) {
    return (
      <>
        <MainBackground />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ color: isDark ? "#f1f5f9" : "#111827" }}
        >
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <MainBackground />
      <div id="app-shell" className="min-h-screen pb-16">
        <Header />
        <main className="max-w-lg mx-auto">{children}</main>
        <BottomNav />
      </div>
    </>
  );
}
