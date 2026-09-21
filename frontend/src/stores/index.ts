import { create } from "zustand"

interface Branch {
  id: string
  name: string
  code: string
  status?: string
}

interface AppState {
  sidebarOpen: boolean
  mobileOpen: boolean
  branches: Record<string, Branch>
  toggleSidebar: () => void
  setMobileOpen: (open: boolean) => void
  setBranch: (code: string, branch: Branch) => void
  getBranch: (code: string) => Branch | undefined
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  mobileOpen: false,
  branches: {},
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setMobileOpen: (open) => set({ mobileOpen: open }),
  setBranch: (code, branch) =>
    set((state) => ({
      branches: { ...state.branches, [code]: branch },
    })),
  getBranch: (code) => get().branches[code],
}))
