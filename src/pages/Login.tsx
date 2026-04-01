import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { clawApi } from '@/services/api'
import { Loader2, RefreshCw, Bot } from 'lucide-react'

type TabKey = 'email' | 'phone' | 'wechat'
type Mode = 'login' | 'register'

export default function Login() {
  const { brandConfig, loginConfig, setToken, setUser } = useAuthStore()
  const [tab, setTab] = useState<TabKey>('email')
  const [mode, setMode] = useState<Mode>('login')

  // email fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [nickname, setNickname] = useState('')

  // phone fields
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [phonePassword, setPhonePassword] = useState('')
  const [phoneNickname, setPhoneNickname] = useState('')

  // wechat fields
  const [wechatCode, setWechatCode] = useState('')
  const [wechatTicket, setWechatTicket] = useState('')
  const [wechatLoading, setWechatLoading] = useState(false)
  const wechatPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Set default tab based on login config
  useEffect(() => {
    if (!loginConfig) return
    const methods = loginConfig.loginMethods
    if (methods.email) setTab('email')
    else if (methods.phone) setTab('phone')
    else if (methods.wechat) setTab('wechat')
  }, [loginConfig])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const availableTabs = useCallback((): TabKey[] => {
    if (!loginConfig) return ['email']
    const tabs: TabKey[] = []
    if (loginConfig.loginMethods.email) tabs.push('email')
    if (loginConfig.loginMethods.phone) tabs.push('phone')
    if (loginConfig.loginMethods.wechat) tabs.push('wechat')
    return tabs.length > 0 ? tabs : ['email']
  }, [loginConfig])

  const tabLabel = (t: TabKey) => t === 'email' ? '邮箱' : t === 'phone' ? '手机' : '微信'

  const handleSendSmsCode = async () => {
    if (countdown > 0 || !phone) return
    setError('')
    try {
      await clawApi.sendSmsCode(phone)
      setCountdown(60)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSendEmailCode = async () => {
    if (countdown > 0 || !email) return
    setError('')
    try {
      await clawApi.sendEmailCode(email)
      setCountdown(60)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Wechat: fetch verification code and start polling
  const startWechatLogin = useCallback(async () => {
    setWechatLoading(true)
    setError('')
    if (wechatPollRef.current) clearInterval(wechatPollRef.current)
    try {
      const data = await clawApi.getWechatCode()
      setWechatCode(data.code)
      setWechatTicket(data.ticket)
      // Poll every 2s for confirmation
      wechatPollRef.current = setInterval(async () => {
        try {
          const result = await clawApi.checkWechatLogin(data.ticket)
          if (result.status === 'confirmed' && result.token) {
            if (wechatPollRef.current) clearInterval(wechatPollRef.current)
            await window.electronAPI.setAuthToken(result.token)
            setToken(result.token)
            if (result.user) setUser(result.user)
          } else if (result.status === 'expired') {
            if (wechatPollRef.current) clearInterval(wechatPollRef.current)
            setError('验证码已过期，请重新获取')
            setWechatCode('')
          }
        } catch {}
      }, 2000)
    } catch (err: any) {
      setError(err.message || '获取微信验证码失败')
    } finally {
      setWechatLoading(false)
    }
  }, [setToken, setUser])

  // Cleanup wechat poll on unmount or tab switch
  useEffect(() => {
    return () => {
      if (wechatPollRef.current) clearInterval(wechatPollRef.current)
    }
  }, [])

  useEffect(() => {
    if (tab === 'wechat') {
      startWechatLogin()
    } else {
      if (wechatPollRef.current) clearInterval(wechatPollRef.current)
      setWechatCode('')
      setWechatTicket('')
    }
  }, [tab, startWechatLogin])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const body = tab === 'email'
        ? { type: 'email', email, password }
        : tab === 'phone'
        ? { type: 'phone', phone, code: smsCode }
        : { type: 'wechat' }

      const data = await clawApi.login(body)
      await window.electronAPI.setAuthToken(data.token)
      setToken(data.token)
      if (data.user) setUser(data.user)
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'email') {
        await clawApi.register({ email, password, code: emailCode, nickname: nickname || undefined })
      } else if (tab === 'phone') {
        await clawApi.registerPhone({ phone, code: smsCode, password: phonePassword, nickname: phoneNickname || undefined })
      }
      // Auto-login after register
      const body = tab === 'email'
        ? { type: 'email', email, password }
        : { type: 'phone', phone, code: smsCode }
      const data = await clawApi.login(body)
      await window.electronAPI.setAuthToken(data.token)
      setToken(data.token)
      if (data.user) setUser(data.user)
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const siteName = brandConfig?.siteName || loginConfig?.siteName || 'AI 助手'
  const logoUrl = brandConfig?.logoUrl || loginConfig?.siteLogo || ''
  const primaryColor = brandConfig?.primaryColor || '#4F46E5'
  const tabs = availableTabs()

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm mx-4">
        {/* Brand header */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-16 h-16 mx-auto mb-3 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
              <Bot className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{siteName}</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {/* Tabs - only show if more than 1 method */}
          {tabs.length > 1 && (
            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); setMode('login') }}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
                    tab === t
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tabLabel(t)}
                </button>
              ))}
            </div>
          )}

          {/* Email login */}
          {tab === 'email' && mode === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱地址</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com" onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码" onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          )}

          {/* Email register */}
          {tab === 'email' && mode === 'register' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱地址</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              {loginConfig?.emailVerifyEnabled && (
                <div className="flex gap-2">
                  <input
                    type="text" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} placeholder="验证码"
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    onClick={handleSendEmailCode} disabled={countdown > 0 || !email}
                    className="px-4 py-2.5 text-sm font-medium text-brand border border-brand rounded-xl hover:bg-brand/10 whitespace-nowrap disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="设置密码"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">昵称（选填）</label>
                <input
                  type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="给自己取个名字"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          )}

          {/* Phone login */}
          {tab === 'phone' && mode === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">手机号</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="138 0000 0000"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} placeholder="验证码"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  onClick={handleSendSmsCode} disabled={countdown > 0 || !phone}
                  className="px-4 py-2.5 text-sm font-medium text-brand border border-brand rounded-xl hover:bg-brand/10 whitespace-nowrap disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          )}

          {/* Phone register */}
          {tab === 'phone' && mode === 'register' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">手机号</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="138 0000 0000"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text" value={smsCode} onChange={(e) => setSmsCode(e.target.value)} placeholder="验证码"
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  onClick={handleSendSmsCode} disabled={countdown > 0 || !phone}
                  className="px-4 py-2.5 text-sm font-medium text-brand border border-brand rounded-xl hover:bg-brand/10 whitespace-nowrap disabled:opacity-50"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
                <input
                  type="password" value={phonePassword} onChange={(e) => setPhonePassword(e.target.value)} placeholder="设置密码"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">昵称（选填）</label>
                <input
                  type="text" value={phoneNickname} onChange={(e) => setPhoneNickname(e.target.value)} placeholder="给自己取个名字"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          )}

          {/* WeChat */}
          {tab === 'wechat' && (
            <div className="flex flex-col items-center py-4">
              {loginConfig?.wechatMpQrcode ? (
                <img src={loginConfig.wechatMpQrcode} alt="公众号二维码" className="w-48 h-48 rounded-xl object-contain" />
              ) : (
                <div className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                  公众号未配置
                </div>
              )}
              {loginConfig?.wechatMpName && (
                <p className="text-xs text-gray-400 mt-2">公众号：{loginConfig.wechatMpName}</p>
              )}
              {wechatLoading ? (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> 获取验证码中...
                </div>
              ) : wechatCode ? (
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    请关注公众号，发送验证码
                  </p>
                  <p className="text-3xl font-bold tracking-widest mt-2" style={{ color: primaryColor }}>
                    {wechatCode}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">验证码 5 分钟内有效，登录后自动跳转</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">请使用微信扫码登录</p>
              )}
              <button
                onClick={startWechatLogin}
                disabled={wechatLoading}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" /> 刷新验证码
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

          {/* Submit button */}
          {tab !== 'wechat' && (
            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full mt-6 py-2.5 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : mode === 'login' ? '登 录' : '注 册'}
            </button>
          )}

          {/* Toggle login/register */}
          {tab !== 'wechat' && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              {mode === 'login' ? (
                <>还没有账号？<button onClick={() => { setMode('register'); setError('') }} className="text-brand font-medium hover:underline">注册</button></>
              ) : (
                <>已有账号？<button onClick={() => { setMode('login'); setError('') }} className="text-brand font-medium hover:underline">登录</button></>
              )}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">v1.0.0</p>
      </div>
    </div>
  )
}
