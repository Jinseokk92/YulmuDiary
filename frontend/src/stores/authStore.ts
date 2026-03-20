import { create } from "zustand";
import Cookies from "js-cookie";
import type { UserResponse } from "@/types";
import { DEMO_USER, ensureDemoDataInitialized } from "@/lib/demoData";

const TOKEN_KEY = "access_token";
const FAMILY_GROUP_KEY = "family_group_id";
const DEMO_MODE_KEY = "demo_mode";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  familyGroupId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;

  setToken: (token: string) => void;
  setUser: (user: UserResponse) => void;
  setFamilyGroup: (id: number | null) => void;
  logout: () => void;
  initialize: () => void;
  /** /api/auth/me를 직접 호출해 user + familyGroupId를 최신화 */
  fetchMe: () => Promise<void>;
  /** 체험판 모드 진입 */
  activateDemo: () => void;
  /** 체험판 모드 종료 */
  deactivateDemo: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  familyGroupId: null,
  isAuthenticated: false,
  isLoading: true,
  isDemoMode: false,

  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, { expires: 1 }); // 1일
    set({ token, isAuthenticated: true });
  },

  setUser: (user: UserResponse) => {
    set({ user });
  },

  setFamilyGroup: (id: number | null) => {
    if (id) {
      Cookies.set(FAMILY_GROUP_KEY, String(id), { expires: 365 });
    } else {
      Cookies.remove(FAMILY_GROUP_KEY);
    }
    set({ familyGroupId: id });
  },

  logout: () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove("refresh_token");
    Cookies.remove(FAMILY_GROUP_KEY);
    Cookies.remove(DEMO_MODE_KEY);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("demoMode");
    }
    set({ token: null, user: null, familyGroupId: null, isAuthenticated: false, isDemoMode: false });
  },

  initialize: () => {
    // 체험판 모드 확인: 쿠키와 sessionStorage 모두 있어야 유효한 세션
    // (브라우저 세션 복원으로 쿠키만 남고 sessionStorage는 비워진 경우 stale 처리)
    if (Cookies.get(DEMO_MODE_KEY) === "true") {
      const inSession =
        typeof window !== "undefined" &&
        sessionStorage.getItem("demoMode") === "true";
      if (!inSession) {
        // stale 쿠키 제거 후 일반 인증 흐름으로
        Cookies.remove(DEMO_MODE_KEY);
      } else {
        ensureDemoDataInitialized();
        set({
          isDemoMode: true,
          isAuthenticated: true,
          isLoading: false,
          familyGroupId: 99999,
          user: DEMO_USER,
        });
        return;
      }
    }

    const token = Cookies.get(TOKEN_KEY);
    const familyGroupIdStr = Cookies.get(FAMILY_GROUP_KEY);
    const familyGroupId = familyGroupIdStr ? Number(familyGroupIdStr) : null;
    if (token) {
      set({ token, isAuthenticated: true, isLoading: false, familyGroupId });
    } else {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    const token = Cookies.get(TOKEN_KEY);
    if (!token) return;
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
    try {
      const res = await fetch(`${base}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) return;
      const body = await res.json();
      const me: UserResponse = body.data;
      if (!me) return;
      const fgId = me.familyGroupId ?? null;
      if (fgId) Cookies.set(FAMILY_GROUP_KEY, String(fgId), { expires: 365 });
      else Cookies.remove(FAMILY_GROUP_KEY);
      set({ user: me, familyGroupId: fgId });
    } catch {
      /* 무시 */
    }
  },

  activateDemo: () => {
    ensureDemoDataInitialized();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("demoMode", "true");
    }
    Cookies.set(DEMO_MODE_KEY, "true"); // session cookie (expires 미설정)
    Cookies.set(FAMILY_GROUP_KEY, "99999", { expires: 365 });
    set({
      isDemoMode: true,
      isAuthenticated: true,
      isLoading: false,
      familyGroupId: 99999,
      user: DEMO_USER,
    });
  },

  deactivateDemo: () => {
    if (typeof window !== "undefined") {
      // demo_ 로 시작하는 sessionStorage 키 모두 제거
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("demo_")) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
      sessionStorage.removeItem("demoMode");
      sessionStorage.removeItem("demo_banner_dismissed");
    }
    Cookies.remove(DEMO_MODE_KEY);
    Cookies.remove(FAMILY_GROUP_KEY);
    Cookies.remove(TOKEN_KEY);
    Cookies.remove("refresh_token");
    set({
      isDemoMode: false,
      isAuthenticated: false,
      isLoading: false,
      familyGroupId: null,
      user: null,
      token: null,
    });
  },
}));

export function getAccessToken(): string | null {
  return Cookies.get(TOKEN_KEY) ?? null;
}
