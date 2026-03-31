import { useEffect } from 'react'
import { useConfigStore, ThemeMode } from '@/stores/configStore'
import { Sun, Moon, Monitor, Trash2 } from 'lucide-react'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function General() {
  const {
    theme, setTheme,
    autoStart, setAutoStart,
    minimizeToTray, setMinimizeToTray,
    sendKey, setSendKey,
    notifyMessage, setNotifyMessage,
    notifyTask, setNotifyTask,
  } = useConfigStore()

  // Sync auto-launch state from OS on mount
  useEffect(() => {
    window.electronAPI?.getAutoLaunch().then(v => {
      if (v !== autoStart) setAutoStart(v)
    }).catch(() => {})
  }, [])

  // When autoStart changes, update OS login item
  const handleAutoStartChange = (v: boolean) => {
    setAutoStart(v)
    window.electronAPI?.setAutoLaunch(v).catch(() => {})
  }

  const themes: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
    { key: 'system', label: '跟随系统', icon: Monitor },
    { key: 'light', label: '亮色', icon: Sun },
    { key: 'dark', label: '暗色', icon: Moon },
  ]

  const handleClearCache = () => {
    if (confirm('确定要清除本地缓存吗？')) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">外观</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">主题</label>
            <div className="flex gap-2">
              {themes.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border transition-colors ${
                    theme === key
                      ? 'border-brand bg-brand/10 text-brand font-medium'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">行为</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">开机自动启动</span>
            <Toggle value={autoStart} onChange={handleAutoStartChange} />
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">关闭时最小化到托盘</span>
            <Toggle value={minimizeToTray} onChange={setMinimizeToTray} />
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">发送快捷键</span>
            <select
              value={sendKey}
              onChange={(e) => setSendKey(e.target.value as any)}
              className="text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300"
            >
              <option value="Enter">Enter</option>
              <option value="Ctrl+Enter">Ctrl+Enter</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">通知</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">消息通知</span>
            <Toggle value={notifyMessage} onChange={setNotifyMessage} />
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">任务完成通知</span>
            <Toggle value={notifyTask} onChange={setNotifyTask} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">数据</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清除本地缓存
          </button>
        </div>
      </div>
    </div>
  )
}
