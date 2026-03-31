import { useAuthStore } from '@/stores/authStore'

let baseUrl = ''

export function setApiBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, '')
}

export function getApiBaseUrl() {
  return baseUrl
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${baseUrl}${path}`, { ...options, headers })

  if (res.status === 401) {
    useAuthStore.getState().clearToken()
    window.electronAPI?.clearAuthToken()
    throw new Error('登录已过期，请重新登录')
  }

  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `请求失败 (${res.status})`)
  // Backend wraps response as { code, message, data }, unwrap it
  return json.data !== undefined ? json.data : json
}

export const clawApi = {
  getAuthConfig: () => request<{
    siteName: string
    siteLogo: string
    loginMethods: { email: boolean; phone: boolean; wechat: boolean }
    emailVerifyEnabled: boolean
  }>('/claw/auth/config', { method: 'GET' }),

  login: (body: { type: string; email?: string; password?: string; phone?: string; code?: string }) =>
    request<{ token: string; user: any }>('/claw/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  sendSmsCode: (phone: string) =>
    request('/auth/send-sms-code', {
      method: 'POST',
      body: JSON.stringify({ phone, type: 4 }),
    }),

  sendEmailCode: (email: string) =>
    request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email, type: 4 }),
    }),

  register: (body: { email?: string; phone?: string; password?: string; code?: string; nickname?: string }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  registerPhone: (body: { phone: string; code: string; password: string; nickname?: string }) =>
    request('/auth/register/phone', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getUserInfo: () => request<{
    id: number
    nickname: string
    avatar: string
    email?: string
    phone?: string
    points: number
    membershipLevel: number
    membershipExpireAt: string | null
    membershipName: string
  }>('/claw/user/info', { method: 'GET' }),

  getModels: () => request<Array<{
    id: string
    displayName: string
    modelId: string
    icon: string
    description: string
    pointsCost: number
    billingType: string
    isDefault: boolean
  }>>('/claw/models', { method: 'GET' }),

  heartbeat: (licenseKey: string) =>
    request<{ valid: boolean; message?: string }>('/claw/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ licenseKey }),
    }),
}
