import { useState, useEffect } from 'react'
import { clawApi } from '@/services/api'
import { useConfigStore } from '@/stores/configStore'
import { useAuthStore } from '@/stores/authStore'
import { RefreshCw, Loader2, Check, Coins, Bot } from 'lucide-react'

interface ModelInfo {
  id: string
  displayName: string
  modelId: string
  icon: string
  description: string
  pointsCost: number
  billingType: string
  isDefault: boolean
}

export default function Models() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const { defaultModelId, setDefaultModelId } = useConfigStore()
  const { brandConfig } = useAuthStore()
  const primaryColor = brandConfig?.primaryColor || '#4F46E5'

  const fetchModels = async () => {
    setLoading(true)
    try {
      const list = await clawApi.getModels()
      setModels(list)
      if (!defaultModelId && list.length > 0) {
        const def = list.find(m => m.isDefault) || list[0]
        setDefaultModelId(def.id)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchModels() }, [])

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">模型配置</h3>
          <button
            onClick={fetchModels}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            刷新模型列表
          </button>
        </div>

        {/* Default model selector */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">默认对话模型</label>
          <select
            value={defaultModelId}
            onChange={(e) => setDefaultModelId(e.target.value)}
            className="w-full text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.displayName} - {m.pointsCost}积分/次</option>
            ))}
          </select>
        </div>

        {/* Available models list */}
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          可用模型（来自服务器）
        </h4>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">暂无可用模型</div>
        ) : (
          <div className="space-y-2">
            {models.map(m => {
              const isSelected = defaultModelId === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setDefaultModelId(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    isSelected
                      ? 'border-brand bg-brand/5'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm flex-shrink-0">
                    {m.icon ? <span>{m.icon}</span> : <Bot className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.displayName}</span>
                      {m.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">默认</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 truncate">{m.modelId}</span>
                      <span className="flex items-center gap-0.5 text-xs text-amber-500">
                        <Coins className="w-3 h-3" />
                        {m.billingType === 'token' ? '按量计费' : `${m.pointsCost}积分/次`}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
