import { create } from 'zustand'

export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  email?: string
  phone?: string
  points: number
  membershipLevel: number
  membershipExpireAt: string | null
  membershipName: string
}

export interface LoginConfig {
  siteName: string
  siteLogo: string
  loginMethods: { email: boolean; phone: boolean; wechat: boolean }
  emailVerifyEnabled: boolean
  wechatMpQrcode: string
  wechatMpName: string
}

interface AuthState {
  token: string | null
  isLoggedIn: boolean
  isLicenseLocked: boolean
  lockMessage: string
  user: UserInfo | null
  loginConfig: LoginConfig | null
  brandConfig: {
    siteUrl: string
    siteName: string
    logoUrl: string
    primaryColor: string
    supportWechat: string
    supportEmail: string
  } | null
  setToken: (token: string) => void
  clearToken: () => void
  setUser: (user: UserInfo) => void
  setLoginConfig: (config: LoginConfig) => void
  setBrandConfig: (config: AuthState['brandConfig']) => void
  setLicenseLocked: (locked: boolean, message?: string) => void
  updatePoints: (points: number) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLoggedIn: false,
  isLicenseLocked: false,
  lockMessage: '',
  user: null,
  loginConfig: null,
  brandConfig: null,
  setToken: (token) => set({ token, isLoggedIn: true }),
  clearToken: () => set({ token: null, isLoggedIn: false, user: null }),
  setUser: (user) => set({ user }),
  setLoginConfig: (config) => set({ loginConfig: config }),
  setBrandConfig: (config) => set({ brandConfig: config }),
  setLicenseLocked: (locked, message) => set({ isLicenseLocked: locked, lockMessage: message || '服务已到期' }),
  updatePoints: (points) => set((s) => s.user ? { user: { ...s.user, points } } : {}),
}))
