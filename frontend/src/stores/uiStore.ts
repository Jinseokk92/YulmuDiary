import { create } from "zustand";

interface UiState {
  isDrawerOpen: boolean;
  setDrawerOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDrawerOpen: false,
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
}));
