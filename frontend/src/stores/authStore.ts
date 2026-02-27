import { create } from "zustand";
import Cookies from "js-cookie";
import type { UserResponse } from "@/types";

const TOKEN_KEY = "access_token";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setToken: (token: string) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, { expires: 1 }); // 1일
    set({ token, isAuthenticated: true });
  },

  setUser: (user: UserResponse) => {
    set({ user });
  },

  logout: () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove("refresh_token");
    set({ token: null, user: null, isAuthenticated: false });
  },

  initialize: () => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      set({ token, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));

export function getAccessToken(): string | null {
  return Cookies.get(TOKEN_KEY) ?? null;
}
