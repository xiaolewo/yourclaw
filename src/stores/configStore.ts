import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'system' | 'light' | 'dark'

interface ConfigState {
  theme: ThemeMode
  autoStart: boolean
  minimizeToTray: boolean
  sendKey: 'Enter' | 'Ctrl+Enter'
  notifyMessage: boolean
  notifyTask: boolean
  defaultModelId: string
  setTheme: (theme: ThemeMode) => void
  setAutoStart: (v: boolean) => void
  setMinimizeToTray: (v: boolean) => void
  setSendKey: (k: 'Enter' | 'Ctrl+Enter') => void
  setNotifyMessage: (v: boolean) => void
  setNotifyTask: (v: boolean) => void
  setDefaultModelId: (id: string) => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      theme: 'system',
      autoStart: false,
      minimizeToTray: true,
      sendKey: 'Enter',
      notifyMessage: true,
      notifyTask: true,
      defaultModelId: '',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      setAutoStart: (v) => set({ autoStart: v }),
      setMinimizeToTray: (v) => set({ minimizeToTray: v }),
      setSendKey: (k) => set({ sendKey: k }),
      setNotifyMessage: (v) => set({ notifyMessage: v }),
      setNotifyTask: (v) => set({ notifyTask: v }),
      setDefaultModelId: (id) => set({ defaultModelId: id }),
    }),
    { name: 'yourclaw-config' },
  ),
)

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}
