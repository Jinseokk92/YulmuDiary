"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { FamilyMembershipResponse } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setFamilyGroup = useAuthStore((s) => s.setFamilyGroup);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // 이미 가족 그룹이 있으면 바로 이동
  useEffect(() => {
    if (user?.familyGroupId != null) {
      router.replace("/diary");
    }
  }, [user?.familyGroupId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inviteCode = code.trim();
    if (!inviteCode || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // 1. API 호출
      const result = await api.post<FamilyMembershipResponse>(
        "/api/family-groups/join",
        { inviteCode }
      );

      console.log("✅ [Onboarding] Join Success:", result);

      // 2. 동기화 (쿠키 + 스토어)
      Cookies.set("family_group_id", String(result.familyGroupId), { expires: 365 });

      if (user) {
        setUser({
          ...user,
          familyGroupId: result.familyGroupId,
          role: result.role,
        });
        setFamilyGroup(result.familyGroupId);
      }

      setIsJoined(true);

      // 3. 시니어의 UX 디테일: 성공 메시지를 2초간 노출하여 유저가 상황을 인지하게 함
      console.log("🚀 [Onboarding] Waiting 2s for user to see the success message...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. 페이지 전환 보장
      console.log("🚀 [Onboarding] Redirecting to /diary...");
      await router.replace("/diary");

    } catch (err: unknown) {
      console.error("❌ [Onboarding] Join Failed:", err);
      const msg =
        err instanceof Error ? err.message : "초대 코드 인증에 실패했습니다.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-primary-600 mb-2">율무일기</h1>
          <p className="text-gray-600 text-sm">
            가족 그룹에 가입하려면
            <br />
            초대 코드를 입력해 주세요.
          </p>
        </div>

        {isJoined ? (
          <div className="text-center space-y-4 animate-in fade-in duration-500">
            <div className="text-4xl">🎉</div>
            <p className="text-gray-800 font-medium">가족 연결이 완료되었습니다!</p>
            <p className="text-gray-500 text-sm">자동으로 이동하지 않는다면 아래 버튼을 눌러주세요.</p>
            <button
              onClick={() => router.replace("/diary")}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold"
            >
              홈으로 이동하기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="invite-code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                초대 코드
              </label>
              <input
                id="invite-code"
                type="text"
                maxLength={6}
                placeholder="6자리 코드 입력"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-400"
                autoComplete="off"
                spellCheck={false}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={code.trim().length === 0 || isSubmitting}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "확인 중..." : "가족 그룹 가입"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
