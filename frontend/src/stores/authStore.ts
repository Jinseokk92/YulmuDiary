import { create } from "zustand";
import Cookies from "js-cookie";
import type { UserResponse } from "@/types";

const TOKEN_KEY = "access_token";
const FAMILY_GROUP_KEY = "family_group_id";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  familyGroupId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setToken: (token: string) => void;
  setUser: (user: UserResponse) => void;
  setFamilyGroup: (id: number | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  familyGroupId: null,
  isAuthenticated: false,
  isLoading: true,

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
    set({ token: null, user: null, familyGroupId: null, isAuthenticated: false });
  },

  initialize: () => {
    const token = Cookies.get(TOKEN_KEY);
    const familyGroupIdStr = Cookies.get(FAMILY_GROUP_KEY);
    const familyGroupId = familyGroupIdStr ? Number(familyGroupIdStr) : null;
    if (token) {
      set({ token, isAuthenticated: true, isLoading: false, familyGroupId });
    } else {
      set({ isLoading: false });
    }
  },
}));

export function getAccessToken(): string | null {
  return Cookies.get(TOKEN_KEY) ?? null;
}
