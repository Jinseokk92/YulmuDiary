"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { FamilyMembershipResponse } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미 가족 그룹이 있으면 바로 이동
  useEffect(() => {
    if (user?.familyGroupId != null) {
      router.replace("/diary");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const membership = await api.post<FamilyMembershipResponse>(
        "/api/family-groups/join",
        { inviteCode: code.trim() }
      );
      // 유저 정보에 familyGroupId·role 반영
      if (user) {
        setUser({
          ...user,
          familyGroupId: membership.familyGroupId,
          role: membership.role as "PARENT" | "RELATIVE",
        });
      }
      router.replace("/diary");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "초대 코드 인증에 실패했습니다.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        {/* 로고/타이틀 */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-primary-600 mb-2">율무일기</h1>
          <p className="text-gray-600 text-sm">
            가족 그룹에 가입하려면
            <br />
            초대 코드를 입력해 주세요.
          </p>
        </div>

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
      </div>
    </div>
  );
}
