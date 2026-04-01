import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { clawApi } from '@/services/api'
import { Settings, Loader2, LogOut, Coins, Bot, User, RefreshCw, AlertCircle } from 'lucide-react'
import SettingsPage from '@/pages/Settings'

export default function Home() {
  const { brandConfig, user, setUser, clearToken } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)
  const [clawUrl, setClawUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const webviewRef = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      try {
        setError(null)
        // Fetch user info
        const userInfo = await clawApi.getUserInfo().catch(() => null)
        if (userInfo) setUser(userInfo)

        // Sync model list to OpenClaw config before starting
        const models = await clawApi.getModels().catch(() => [])
        if (models.length > 0) {
          await window.electronAPI.syncOpenClawModels(models)
        }

        // Start OpenClaw gateway and get URL
        const result = await window.electronAPI.startOpenClaw()
        if (result.error) {
          setError(`AI 引擎启动失败: ${result.error}`)
        }
        const url = await window.electronAPI.getOpenClawUrl()
        setClawUrl(url)
      } catch (err: any) {
        console.error('Failed to init Home:', err)
        setError(err.message || '初始化失败')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Inject gateway auth token into webview localStorage once it loads
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv || !clawUrl) return
    const onDomReady = () => {
      const tokenMatch = clawUrl.match(/[?&]token=([^&]+)/)
      if (tokenMatch) {
        const token = tokenMatch[1]
        wv.executeJavaScript(`
          try {
            localStorage.setItem('gateway.auth.token', '${token}');
            localStorage.setItem('gatewayAuthToken', '${token}');
          } catch(e) {}
        `).catch(() => {})
      }
    }
    wv.addEventListener('dom-ready', onDomReady)
    return () => wv.removeEventListener('dom-ready', onDomReady)
  }, [clawUrl])

  // Periodically refresh user info (points)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const info = await clawApi.getUserInfo()
        if (info) setUser(info)
      } catch {}
    }, 2 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    await window.electronAPI.stopOpenClaw()
    await window.electronAPI.clearAuthToken()
    clearToken()
  }

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      await window.electronAPI.restartOpenClaw()
      const url = await window.electronAPI.getOpenClawUrl()
      setClawUrl(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const siteName = brandConfig?.siteName || 'AI 助手'
  const primaryColor = brandConfig?.primaryColor || '#4F46E5'

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Titlebar */}
      <div className="h-10 flex-shrink-0 titlebar-drag flex items-center justify-between px-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 titlebar-no-drag">
          {brandConfig?.logoUrl ? (
            <img src={brandConfig.logoUrl} alt="" className="w-5 h-5 rounded" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
          <span className="font-medium text-gray-700 dark:text-gray-300">{siteName}</span>
          {user && (
            <>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {user.points?.toLocaleString() ?? '--'}
              </span>
              {user.membershipName && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full font-medium" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                  {user.membershipName}
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-1 titlebar-no-drag">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="设置"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
            title="退出登录"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          {navigator.platform.includes('Win') && (
            <>
              <button onClick={() => window.electronAPI.minimizeWindow()} className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 text-xs ml-2">─</button>
              <button onClick={() => window.electronAPI.maximizeWindow()} className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 text-xs">□</button>
              <button onClick={() => window.electronAPI.closeWindow()} className="px-2 py-1 hover:bg-red-500 hover:text-white text-gray-500 text-xs">✕</button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {showSettings ? (
          <SettingsPage onBack={() => setShowSettings(false)} />
        ) : loading ? (
          <div className="flex-1 h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: primaryColor }} />
              <p className="text-sm text-gray-500">正在启动 AI 引擎...</p>
              <p className="text-xs text-gray-400 mt-1">首次启动可能需要几秒钟</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 h-full flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">引擎启动失败</h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <RefreshCw className="w-4 h-4" />
                重新启动
              </button>
            </div>
          </div>
        ) : clawUrl ? (
          <webview
            ref={webviewRef}
            src={clawUrl}
            className="w-full h-full"
            // @ts-ignore
            allowpopups="true"
            partition="persist:openclaw"
          />
        ) : (
          <div className="flex-1 h-full flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{siteName}</h2>
              <p className="text-gray-500 mb-4">AI 引擎未就绪</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                <RefreshCw className="w-4 h-4" />
                重新启动
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
