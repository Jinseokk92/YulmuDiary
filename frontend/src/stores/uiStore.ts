import { create } from "zustand";

interface UiState {
  isDrawerOpen: boolean;
  setDrawerOpen: (isOpen: boolean) => void;
  isCommentOpen: boolean;
  setCommentOpen: (isOpen: boolean) => void;
  isImageViewerOpen: boolean;
  setImageViewerOpen: (isOpen: boolean) => void;
  /** 체험판 이미지 깨짐 가이드 단계: 0=비활성, 1=햄버거 안내, 2=초기화 버튼 안내 */
  demoGuideStep: 0 | 1 | 2;
  setDemoGuideStep: (step: 0 | 1 | 2) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDrawerOpen: false,
  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  isCommentOpen: false,
  setCommentOpen: (isOpen) => set({ isCommentOpen: isOpen }),
  isImageViewerOpen: false,
  setImageViewerOpen: (isOpen) => set({ isImageViewerOpen: isOpen }),
  demoGuideStep: 0,
  setDemoGuideStep: (step) => set({ demoGuideStep: step }),
}));
