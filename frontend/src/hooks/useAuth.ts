"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

interface UseAuthReturn {
  /** PARENT 권한 보유 여부 */
  isParent: boolean;
  /** 인증 정보 로딩 중 여부 */
  isLoading: boolean;
  /** 현재 사용자의 가족 그룹 ID */
  familyGroupId: number | null;
}

/**
 * 현재 로그인 사용자의 권한 정보를 반환하는 훅.
 *
 * - `isParent`: true이면 일정 등록·수정·삭제 가능, false이면 읽기 전용
 * - authStore.user는 UserProvider에서 /api/auth/me 호출 후 채워짐
 */
export function useAuth(): UseAuthReturn {
  const { user, isLoading } = useAuthStore();

  return {
    isParent: user?.role === "PARENT",
    isLoading,
    familyGroupId: user?.familyGroupId ?? null,
  };
}

/**
 * PARENT 권한이 필요한 페이지의 접근 제어 Guard 훅.
 *
 * 사용법: 등록·수정 전용 페이지 최상단에서 호출.
 * RELATIVE 유저가 URL을 직접 입력해 접근하면 즉시 redirectTo로 replace.
 *
 * @example
 * // /schedule/new 페이지
 * const { isParent } = useRequireParent("/schedule");
 * if (!isParent) return null; // 리다이렉트 대기 중 렌더 차단
 */
/**
 * 관리자 권한이 필요한 페이지의 접근 제어 Guard 훅.
 * isAdmin이 아닌 유저가 접근하면 redirectTo로 replace.
 */
export function useRequireAdmin(redirectTo = "/") {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const isAdmin = user?.isAdmin === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      router.replace(redirectTo);
    }
  }, [isAdmin, isLoading, router, redirectTo]);

  return { isAdmin, isLoading };
}

export function useRequireParent(redirectTo = "/") {
  const router = useRouter();
  const { isParent, isLoading } = useAuth();

  useEffect(() => {
    // 로딩 중에는 판단 보류 (user 아직 null)
    if (isLoading) return;
    if (!isParent) {
      router.replace(redirectTo);
    }
  }, [isParent, isLoading, router, redirectTo]);

  return { isParent, isLoading };
}
