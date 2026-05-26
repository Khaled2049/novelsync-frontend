import { create } from "zustand";

interface DemoStore {
  isDemo: boolean;
  setDemoMode: (enabled: boolean) => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  isDemo: false,
  setDemoMode: (enabled) => set({ isDemo: enabled }),
}));
