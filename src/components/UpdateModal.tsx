import { useState, useEffect } from 'react'
import { X, Download, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface UpdateModalProps {
  onClose: () => void
  primaryColor?: string
}

export default function UpdateModal({ onClose, primaryColor = '#4F46E5' }: UpdateModalProps) {
  const [status, setStatus] = useState<'checking' | 'available' | 'latest' | 'downloading' | 'ready' | 'error'>('checking')
  const [version, setVersion] = useState('')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    window.electronAPI?.onUpdateAvailable((info) => {
      setStatus('available')
      setVersion(info.version)
    })
    window.electronAPI?.onUpdateNotAvailable(() => setStatus('latest'))
    window.electronAPI?.onUpdateProgress((p) => {
      setStatus('downloading')
      setProgress(p.percent)
    })
    window.electronAPI?.onUpdateDownloaded(() => setStatus('ready'))
    window.electronAPI?.onUpdateError((msg) => {
      setStatus('error')
      setErrorMsg(msg)
    })

    window.electronAPI?.checkForUpdates()
  }, [])

  const handleDownload = () => {
    setStatus('downloading')
    setProgress(0)
    window.electronAPI?.downloadUpdate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm mx-4 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">检查更新</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-8 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: primaryColor }} />
              <p className="text-sm text-gray-600 dark:text-gray-300">正在检查更新...</p>
            </>
          )}
          {status === 'latest' && (
            <>
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">已是最新版本</p>
              <p className="text-xs text-gray-400 mt-1">当前版本已是最新，无需更新</p>
            </>
          )}
          {status === 'available' && (
            <>
              <Download className="w-10 h-10 mx-auto mb-3" style={{ color: primaryColor }} />
              <p className="text-sm font-medium text-gray-900 dark:text-white">发现新版本 v{version}</p>
              <button
                onClick={handleDownload}
                className="mt-4 px-6 py-2 text-sm font-medium text-white rounded-xl"
                style={{ backgroundColor: primaryColor }}
              >
                下载更新
              </button>
            </>
          )}
          {status === 'downloading' && (
            <>
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: primaryColor }} />
              <p className="text-sm font-medium text-gray-900 dark:text-white">正在下载 {progress}%</p>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
              </div>
            </>
          )}
          {status === 'ready' && (
            <>
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">更新就绪</p>
              <p className="text-xs text-gray-400 mt-1">重启应用后自动安装</p>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">检查更新失败</p>
              <p className="text-xs text-gray-400 mt-1">{errorMsg || '请稍后重试'}</p>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
