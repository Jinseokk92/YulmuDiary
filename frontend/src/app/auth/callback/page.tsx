"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import {
  SESSION_KEY_AUTOPLAY_ATTEMPTED,
  BGM_RETRY_EVENT,
} from "@/components/BgmPlayer";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setToken = useAuthStore((s) => s.setToken);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    const token = searchParams.get("token");
    const onboarding = searchParams.get("onboarding");

    if (!token) {
      router.replace("/login");
      return;
    }

    // 1. 토큰 저장 (access_token 쿠키 설정)
    setToken(token);

    // 2. /api/auth/me 호출 → family_group_id 쿠키 복원
    //    middleware가 쿠키 기반으로 동작하므로 리다이렉트 전에 반드시 필요
    fetchMe().then(() => {
      console.log("🔑 [Callback] fetchMe complete, onboarding param:", onboarding);

      // 소셜 로그인 전에 세팅된 BGM autoplay 플래그를 초기화하고 재시도를 요청한다.
      // 같은 탭에서 OAuth 흐름을 거치면 sessionStorage가 유지되어 BgmPlayer가
      // alreadyAttempted=true 로 판단, fallback 등록 자체를 건너뛰는 문제를 방지한다.
      sessionStorage.removeItem(SESSION_KEY_AUTOPLAY_ATTEMPTED);
      window.dispatchEvent(new CustomEvent(BGM_RETRY_EVENT));

      // /auth/success에서 2.3초 축하 화면 후 최종 경로로 이동
      const dest =
        onboarding === "true"
          ? "/auth/success?onboarding=true"
          : "/auth/success";
      router.replace(dest);
    });
  }, [searchParams, setToken, fetchMe, router]);

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
