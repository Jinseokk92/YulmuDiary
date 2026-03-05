"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    api
      .get<UserResponse>("/api/auth/me")
      .then((me) => {
        setUser(me);
        if (me.familyGroupId == null) {
          router.replace("/onboarding");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [isAuthenticated, router, setUser]);

  if (checking) {
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
