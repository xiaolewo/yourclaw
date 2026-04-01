import { useState } from 'react'
import { MessageSquare, Plus, MessageCircle, Bird, Bell, Phone, Send, Gamepad2, Briefcase, Smartphone, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import ChannelWizard from '@/components/ChannelWizard'

const CHANNEL_TYPES: { key: string; name: string; icon: LucideIcon }[] = [
  { key: 'wechat', name: '微信', icon: MessageCircle },
  { key: 'feishu', name: '飞书', icon: Bird },
  { key: 'dingtalk', name: '钉钉', icon: Bell },
  { key: 'qq', name: 'QQ', icon: Phone },
  { key: 'telegram', name: 'Telegram', icon: Send },
  { key: 'discord', name: 'Discord', icon: Gamepad2 },
  { key: 'slack', name: 'Slack', icon: Briefcase },
  { key: 'whatsapp', name: 'WhatsApp', icon: Smartphone },
]

export default function Channels() {
  const { brandConfig } = useAuthStore()
  const [wizardChannel, setWizardChannel] = useState<{ key: string; name: string } | null>(null)
  const primaryColor = brandConfig?.primaryColor || '#4F46E5'

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">通道配置</h3>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col items-center text-center py-4">
            <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">暂无已连接通道</p>
            <p className="text-xs text-gray-400">连接通道后，AI 助手可自动回复各平台消息</p>
          </div>
        </div>

        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">添加通道</h4>
        <div className="grid grid-cols-4 gap-3">
          {CHANNEL_TYPES.map(ch => {
            const Icon = ch.icon
            return (
              <button
                key={ch.key}
                onClick={() => setWizardChannel(ch)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand/50 hover:bg-brand/5 transition-colors group"
              >
                <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-brand" />
                <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-brand">{ch.name}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                  <Plus className="w-3 h-3" /> 添加
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          通道接入需要在对应平台创建机器人/应用，具体步骤将在向导中引导完成。
        </p>
      </div>

      {wizardChannel && (
        <ChannelWizard channel={wizardChannel} onClose={() => setWizardChannel(null)} primaryColor={primaryColor} />
      )}
    </div>
  )
}
