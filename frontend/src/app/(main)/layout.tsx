"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import type { UserResponse } from "@/types";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, setUser, setFamilyGroup } = useAuthStore();
  
  // 낙관적 UI: 이미 스토어에 그룹 정보가 있다면 로딩 없이 바로 렌더링 시작
  const [checking, setChecking] = useState(user?.familyGroupId == null);

  const fetchLatestStatus = useCallback(async () => {
    try {
      const me = await api.get<UserResponse>("/api/auth/me");
      setUser(me);
      setFamilyGroup(me.familyGroupId ?? null);
      
      if (me.familyGroupId == null && pathname !== "/join") {
        router.replace("/onboarding");
      } else {
        setChecking(false);
      }
    } catch (error) {
      router.replace("/login");
    }
  }, [pathname, router, setUser, setFamilyGroup]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // 이미 familyGroupId가 있다면 즉시 로딩을 풀고 백그라운드에서 갱신
    if (user?.familyGroupId != null) {
      setChecking(false);
      fetchLatestStatus();
    } else {
      fetchLatestStatus();
    }
  }, [isAuthenticated, user?.familyGroupId, fetchLatestStatus, router]);

  // 가드: 그룹 정보가 아예 없고 체크 중일 때만 스피너 노출
  if (checking && user?.familyGroupId == null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
