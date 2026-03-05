"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import type { UserResponse } from "@/types";

interface UserContextValue {
  /** 현재 로그인한 사용자 */
  currentUser: UserResponse | null;
  /** 로딩 중 여부 */
  loading: boolean;
  /** 로그아웃 */
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, initialize, setUser, setFamilyGroup, logout } =
    useAuthStore();

  // 앱 시작 시 쿠키에서 토큰 복원
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 토큰이 있으면 내 정보 조회 (GET /api/auth/me)
  useEffect(() => {
    if (!isAuthenticated) return;

    api
      .get<UserResponse>("/api/auth/me")
      .then((me) => {
        setUser({ id: me.id, name: me.name, profileImageUrl: me.profileImageUrl });
        setFamilyGroup(me.familyGroupId ?? null);
      })
      .catch(() => {
        // 토큰 만료 등으로 실패 시 로그아웃
        logout();
      });
  }, [isAuthenticated, setUser, setFamilyGroup, logout]);

  return (
    <UserContext.Provider
      value={{
        currentUser: user,
        loading: isLoading,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser는 UserProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}
