"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse, AuthMeResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setToken(token);

    // 가족 그룹 가입 여부 확인
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json() as Promise<ApiResponse<AuthMeResponse>>)
      .then((body) => {
        const familyGroupId = body.data?.familyGroupId;
        if (familyGroupId) {
          Cookies.set("family_group_id", String(familyGroupId), { expires: 365 });
          router.replace("/diary");
        } else {
          router.replace("/join");
        }
      })
      .catch(() => {
        // /api/auth/me 실패해도 일단 /join으로 보냄
        router.replace("/join");
      });
  }, [searchParams, setToken, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">로그인 처리 중...</p>
      </div>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
