import { create } from 'zustand'
import { ToastData } from '../components/ui/ToastContainer'

interface UIState {
  sidebarOpen: boolean
  toasts: ToastData[]
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  showToast: (message: string, type: ToastData['type'], duration?: number) => void
  removeToast: (id: string) => void
}

let toastIdCounter = 0

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toasts: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  showToast: (message, type, duration = 5000) => {
    const id = `toast-${++toastIdCounter}`
    const toast: ToastData = { id, message, type, duration }
    set((state) => ({ toasts: [...state.toasts, toast] }))
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}))

