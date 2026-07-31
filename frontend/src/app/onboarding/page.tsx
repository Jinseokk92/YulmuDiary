"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { darkPalette } from "@/lib/theme/darkPalette";
import type { FamilyMembershipResponse } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const familyGroupId = useAuthStore((s) => s.familyGroupId);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === "dark";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // 이미 가족 그룹이 있으면 즉시 이동 (성공 화면 노출 중에는 스킵)
  useEffect(() => {
    if (isJoined) return;
    const hasGroup = (user?.familyGroupId != null) || (familyGroupId != null);
    console.log("🔍 [Onboarding] guard check →", { userFamilyGroupId: user?.familyGroupId, storeFamilyGroupId: familyGroupId, hasGroup });
    if (hasGroup) {
      router.replace("/diary");
    }
  }, [user?.familyGroupId, familyGroupId, router, isJoined]);

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

      // 2. authStore 최신화 (쿠키 + 스토어 동기화)
      await fetchMe();

      // 3. 성공 UI 표시
      setIsJoined(true);

      // 4. 2초간 성공 메시지 노출 후 /diary로 이동
      console.log("🚀 [Onboarding] Waiting 2s for user to see the success message...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("🚀 [Onboarding] Redirecting to /diary...");
      router.replace("/diary");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      console.error("❌ [Onboarding] Join Failed:", err);
      setError(msg || "초대 코드 인증에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: isDark ? darkPalette.background : "#f9fafb" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-primary-600 mb-2">율무일기</h1>
          <p className="text-sm" style={{ color: isDark ? darkPalette.textSecondary : "#4b5563" }}>
            가족 그룹에 가입하려면
            <br />
            초대 코드를 입력해 주세요.
          </p>
        </div>

        {isJoined ? (
          <div className="text-center space-y-4 animate-in fade-in duration-500">
            <div className="text-4xl">🎉</div>
            <p className="font-medium" style={{ color: isDark ? darkPalette.textPrimary : "#1f2937" }}>가족 연결이 완료되었습니다!</p>
            <p className="text-sm" style={{ color: isDark ? darkPalette.textSecondary : "#6b7280" }}>자동으로 이동하지 않는다면 아래 버튼을 눌러주세요.</p>
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
                className="block text-sm font-medium mb-1"
                style={{ color: isDark ? darkPalette.textSecondary : "#374151" }}
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
                className="w-full px-4 py-3 border rounded-xl text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-400"
                style={{
                  borderColor: isDark ? darkPalette.border : "#d1d5db",
                  backgroundColor: isDark ? darkPalette.surfaceSecondary : "#ffffff",
                  color: isDark ? darkPalette.textPrimary : "#111827",
                }}
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
