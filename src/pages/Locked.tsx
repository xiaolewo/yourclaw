import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { AlertTriangle, Loader2, Bot } from 'lucide-react'

export default function Locked() {
  const { brandConfig, lockMessage, setLicenseLocked, clearToken } = useAuthStore()
  const [retrying, setRetrying] = useState(false)
  const siteName = brandConfig?.siteName || 'AI 助手'

  const handleRetry = async () => {
    setRetrying(true)
    try {
      const result = await window.electronAPI.checkLicense()
      if (result.valid) {
        setLicenseLocked(false)
      }
    } finally {
      setRetrying(false)
    }
  }

  const handleLogout = async () => {
    await window.electronAPI.clearAuthToken()
    clearToken()
    setLicenseLocked(false)
  }

  const hasSupportInfo = brandConfig?.supportWechat || brandConfig?.supportEmail

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm mx-4 text-center">
        {brandConfig?.logoUrl ? (
          <img src={brandConfig.logoUrl} alt="" className="w-16 h-16 mx-auto mb-3 rounded-2xl object-cover opacity-50" />
        ) : (
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center opacity-50">
            <Bot className="w-8 h-8 text-gray-500" />
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{siteName}</h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">服务已到期</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{lockMessage || '请联系管理员续费后重新使用'}</p>

          {hasSupportInfo && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">管理员联系方式</p>
              {brandConfig?.supportWechat && (
                <p className="text-sm text-gray-700 dark:text-gray-300">微信：{brandConfig.supportWechat}</p>
              )}
              {brandConfig?.supportEmail && (
                <p className="text-sm text-gray-700 dark:text-gray-300">邮箱：{brandConfig.supportEmail}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRetry} disabled={retrying}
              className="w-full py-2.5 text-sm font-medium text-white bg-brand rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {retrying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '重试连接'}
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              切换账号
            </button>
            <button
              onClick={() => window.electronAPI.closeWindow()}
              className="w-full py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              退出程序
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
