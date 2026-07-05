import { create } from "zustand"

interface AppState {
  sidebarOpen: boolean
  mobileOpen: boolean
  toggleSidebar: () => void
  setMobileOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  mobileOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMobileOpen: (open) => set({ mobileOpen: open }),
}))
