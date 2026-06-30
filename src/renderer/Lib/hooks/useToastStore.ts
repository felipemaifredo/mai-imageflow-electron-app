//Libs
import { create } from "zustand"

//Types
export type ToastType = "success" | "error" | "info"

export type ToastItem = {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type ToastStoreState = {
  toasts: ToastItem[]
  addToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

//Main
export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  addToast: (message, type, duration = 5000) => {
    let id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, duration)
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}))
