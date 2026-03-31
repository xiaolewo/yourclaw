import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { clawApi } from '@/services/api'
import { MessageSquare, Clock, Users, Zap, BarChart3, Settings, Loader2, LogOut, Coins, Bot, User } from 'lucide-react'
import SettingsPage from '@/pages/Settings'

const MENU_ITEMS = [
  { key: 'chat', label: '聊天', icon: MessageSquare, group: '聊天' },
  { key: 'schedule', label: '定时任务', icon: Clock, group: '聊天' },
  { key: 'team', label: 'AI团队', icon: Users, group: '控制' },
  { key: 'skills', label: '技能库', icon: Zap, group: '控制' },
  { key: 'stats', label: '统计', icon: BarChart3, group: '控制' },
  { key: 'settings', label: '设置', icon: Settings, group: '控制' },
]

export default function Home() {
  const { brandConfig, user, setUser, clearToken } = useAuthStore()
  const [activeMenu, setActiveMenu] = useState('chat')
  const [clawUrl, setClawUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch user info and models in parallel
        const [userInfo, modelList] = await Promise.all([
          clawApi.getUserInfo().catch(() => null),
          clawApi.getModels().catch(() => []),
        ])
        if (userInfo) setUser(userInfo)
        setModels(modelList)

        // Start OpenClaw and get URL
        await window.electronAPI.startOpenClaw()
        const url = await window.electronAPI.getOpenClawUrl()
        setClawUrl(url)
      } catch (err) {
        console.error('Failed to init Home:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Periodically refresh user info (points) every 2 minutes
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

  const siteName = brandConfig?.siteName || 'AI 助手'
  const primaryColor = brandConfig?.primaryColor || '#4F46E5'
  let lastGroup = ''

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Titlebar (Windows) */}
      {navigator.platform.includes('Win') && (
        <div className="fixed top-0 left-0 right-0 h-8 titlebar-drag z-50 flex items-center justify-between px-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {brandConfig?.logoUrl ? (
              <img src={brandConfig.logoUrl} alt="" className="w-4 h-4 rounded" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            <span>{siteName}</span>
          </div>
          <div className="flex titlebar-no-drag">
            <button onClick={() => window.electronAPI.minimizeWindow()} className="px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 text-xs">─</button>
            <button onClick={() => window.electronAPI.maximizeWindow()} className="px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 text-xs">□</button>
            <button onClick={() => window.electronAPI.closeWindow()} className="px-3 py-1 hover:bg-red-500 hover:text-white text-gray-500 text-xs">✕</button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`w-48 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 flex flex-col ${navigator.platform.includes('Win') ? 'pt-8' : ''}`}>
        <div className="p-4 flex-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const showGroup = item.group !== lastGroup
            lastGroup = item.group
            const Icon = item.icon
            return (
              <div key={item.key}>
                {showGroup && (
                  <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-4 mb-2 first:mt-0">
                    {item.group}
                  </div>
                )}
                <button
                  onClick={() => setActiveMenu(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                    activeMenu === item.key
                      ? 'text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
                  style={activeMenu === item.key ? { backgroundColor: primaryColor } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </div>
            )
          })}
        </div>

        {/* User info */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {user?.nickname || '用户'}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {user?.points?.toLocaleString() ?? '--'}
                {user?.membershipName && (
                  <span className="ml-1 px-1 py-0.5 text-[10px] rounded" style={{ backgroundColor: primaryColor + '20', color: primaryColor }}>
                    {user.membershipName}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${navigator.platform.includes('Win') ? 'pt-8' : ''}`}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">正在启动 AI 引擎...</p>
            </div>
          </div>
        ) : activeMenu === 'settings' ? (
          <SettingsPage onBack={() => setActiveMenu('chat')} />
        ) : clawUrl ? (
          <webview
            src={clawUrl}
            className="flex-1"
            // @ts-ignore
            allowpopups="true"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{siteName}</h2>
              <p className="text-gray-500">AI 引擎未就绪，请检查配置</p>
              {models.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">已加载 {models.length} 个可用模型</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
