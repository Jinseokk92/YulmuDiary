"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { FamilyMembershipResponse } from "@/types";

export default function JoinPage() {
  const router = useRouter();
  const setFamilyGroup = useAuthStore((s) => s.setFamilyGroup);
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.post<FamilyMembershipResponse>("/api/family-groups/join", {
        inviteCode: inviteCode.trim(),
      });
      // 쿠키 + Zustand store 동시 업데이트 (미들웨어와 클라이언트 상태 일치)
      Cookies.set("family_group_id", String(result.familyGroupId), { expires: 365 });
      setFamilyGroup(result.familyGroupId);
      router.push("/");
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        setError("이미 가족 그룹에 참여한 상태입니다.");
      } else {
        setError("올바르지 않은 초대 코드입니다. 다시 확인해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* 안내 문구 */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">👶</div>
          <h1 className="text-2xl font-bold text-gray-800">가족 그룹 참여</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            우리 아이의 초대 코드를 입력해 주세요.
            <br />
            코드는 가족 대표에게 받을 수 있어요.
          </p>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="초대 코드 입력"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength={20}
            disabled={isLoading}
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !inviteCode.trim()}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed active:opacity-90 transition-opacity"
          >
            {isLoading ? "참여 중..." : "참여하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
