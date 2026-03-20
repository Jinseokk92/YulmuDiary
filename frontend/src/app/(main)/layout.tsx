"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import BgmMiniPlayer from "@/components/BgmMiniPlayer";
import BgmFloatingPlayer from "@/components/BgmFloatingPlayer";
import MainBackground from "@/components/MainBackground";
import DemoBanner from "@/components/DemoBanner";
import type { UserResponse } from "@/types";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, familyGroupId, setUser, setFamilyGroup, isLoading, isDemoMode } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // initialize() 완료 전까지 항상 스피너 표시
  const [checking, setChecking] = useState(true);

  const fetchLatestStatus = useCallback(async () => {
    // 데모 모드는 실제 API 호출 없이 바로 렌더
    if (isDemoMode) {
      setChecking(false);
      return;
    }
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
  }, [isDemoMode, pathname, router, setUser, setFamilyGroup]);

  useEffect(() => {
    // initialize() 완료 전에는 실행하지 않음 (isAuthenticated 초기값 false를 잘못 참조 방지)
    if (isLoading) return;

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
  }, [isAuthenticated, isLoading, familyGroupId, fetchLatestStatus, router]);

  // 마운트 전에는 테마를 알 수 없으므로 기본값 사용
  const isDark = mounted && resolvedTheme === "dark";

  // 가드: initialize() 실행 중이거나 인증 확인 중일 때 스피너 노출
  if (isLoading || (checking && familyGroupId == null)) {
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
      {/* pb-16: BottomNav(3.5rem) + 여유 공간. 두 플레이어 모두 collapsed 기본이므로 홈/비홈 동일 */}
      <div id="app-shell" className="min-h-screen pb-16">
        <Header />
        <DemoBanner />
        <main className="max-w-lg mx-auto">{children}</main>
        <BottomNav />
        <BgmMiniPlayer />
        <BgmFloatingPlayer />
      </div>
    </>
  );
}
