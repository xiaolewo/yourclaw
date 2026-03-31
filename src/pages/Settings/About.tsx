import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Bot, Loader2, CheckCircle } from 'lucide-react'

export default function About() {
  const { brandConfig } = useAuthStore()
  const [appVersion, setAppVersion] = useState('...')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'latest' | 'downloading' | 'ready'>('idle')
  const siteName = brandConfig?.siteName || 'AI 助手'
  const primaryColor = brandConfig?.primaryColor || '#4F46E5'

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(v => setAppVersion(v)).catch(() => setAppVersion('1.0.0'))
    window.electronAPI?.onUpdateAvailable(() => setUpdateStatus('available'))
    window.electronAPI?.onUpdateNotAvailable(() => { setUpdateStatus('latest'); setTimeout(() => setUpdateStatus('idle'), 3000) })
    window.electronAPI?.onUpdateDownloaded(() => setUpdateStatus('ready'))
    window.electronAPI?.onUpdateError(() => { setUpdateStatus('idle') })
  }, [])

  const handleCheckUpdate = () => {
    setUpdateStatus('checking')
    window.electronAPI?.checkForUpdates()
  }

  const handleDownloadUpdate = () => {
    setUpdateStatus('downloading')
    window.electronAPI?.downloadUpdate()
  }

  return (
    <div className="max-w-lg space-y-8">
      <div className="text-center py-8">
        {brandConfig?.logoUrl ? (
          <img src={brandConfig.logoUrl} alt="" className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover" />
        ) : (
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
            <Bot className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{siteName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">v{appVersion}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">客户端版本</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">v{appVersion}</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">引擎</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">OpenClaw</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">运行平台</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Electron</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        {updateStatus === 'available' ? (
          <button
            onClick={handleDownloadUpdate}
            className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            发现新版本，点击下载
          </button>
        ) : updateStatus === 'downloading' ? (
          <button disabled className="w-full py-2.5 text-sm font-medium text-white rounded-xl opacity-70 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
            <Loader2 className="w-4 h-4 animate-spin" /> 正在下载...
          </button>
        ) : updateStatus === 'ready' ? (
          <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2 py-2">
            <CheckCircle className="w-4 h-4" /> 更新就绪，重启后生效
          </div>
        ) : updateStatus === 'latest' ? (
          <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2 py-2">
            <CheckCircle className="w-4 h-4" /> 已是最新版本
          </div>
        ) : (
          <button
            onClick={handleCheckUpdate}
            disabled={updateStatus === 'checking'}
            className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {updateStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
            {updateStatus === 'checking' ? '检查中...' : '检查更新'}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        Powered by OpenClaw
      </p>
    </div>
  )
}
