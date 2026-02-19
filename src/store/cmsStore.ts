'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CMSStore {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useCMSStore = create<CMSStore>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: typeof window !== 'undefined' ? window.innerWidth < 1024 : true,
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'cms-storage',
    }
  )
);
