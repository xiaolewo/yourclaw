import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useConfigStore, applyTheme } from '@/stores/configStore'
import { setApiBaseUrl, clawApi } from '@/services/api'
import Login from '@/pages/Login'
import Locked from '@/pages/Locked'
import Home from '@/pages/Home'
import { Loader2, AlertTriangle } from 'lucide-react'

export default function App() {
  const {
    isLoggedIn, isLicenseLocked,
    setToken, setUser, setBrandConfig, setLoginConfig, setLicenseLocked,
  } = useAuthStore()
  const [initializing, setInitializing] = useState(true)
  const [initError, setInitError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const api = window.electronAPI

        // 1. Load brand config (from local file, always available)
        const brand = await api.getBrandConfig()
        setBrandConfig({
          siteUrl: brand.siteUrl,
          siteName: brand.siteName,
          logoUrl: brand.logoUrl,
          primaryColor: brand.primaryColor,
          supportWechat: brand.supportWechat,
          supportEmail: brand.supportEmail,
        })

        // Apply brand color to CSS + theme
        document.documentElement.style.setProperty('--brand-color', brand.primaryColor)
        document.title = brand.siteName
        applyTheme(useConfigStore.getState().theme)

        // Set API base URL for all requests
        setApiBaseUrl(brand.siteUrl)

        // 2. Fetch login config from server (available login methods etc.)
        try {
          const config = await clawApi.getAuthConfig()
          setLoginConfig(config)
        } catch {
          // Server unreachable - still allow login attempt
        }

        // 3. Check stored token
        const token = await api.getAuthToken()
        if (token) {
          setToken(token)

          // Validate token by fetching user info
          try {
            const userInfo = await clawApi.getUserInfo()
            setUser(userInfo)
          } catch {
            // Token invalid or server down - token will be cleared by 401 handler in api.ts
          }

          // Check license
          const license = await api.checkLicense()
          if (!license.valid) {
            setLicenseLocked(true, license.message)
          }
        }

        // 4. Listen for license expiration events from heartbeat
        api.onLicenseExpired((message) => {
          setLicenseLocked(true, message)
        })
      } catch (err: any) {
        console.error('Init error:', err)
        setInitError(err.message || '初始化失败')
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [])

  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">正在初始化...</p>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-sm mx-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">初始化失败</h2>
          <p className="text-sm text-gray-500 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 text-sm text-white bg-brand rounded-xl"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (isLicenseLocked) return <Locked />
  if (!isLoggedIn) return <Login />
  return <Home />
}
