import { useState } from 'react'
import { X, Copy, CheckCircle, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react'

interface ChannelWizardProps {
  channel: { key: string; name: string }
  onClose: () => void
  primaryColor?: string
}

interface StepConfig {
  title: string
  instructions: string[]
  fields: { key: string; label: string; placeholder: string }[]
  docsUrl?: string
}

const CHANNEL_STEPS: Record<string, StepConfig[]> = {
  feishu: [
    {
      title: '创建飞书机器人',
      instructions: [
        '打开飞书开放平台 open.feishu.cn',
        '创建自建应用 → 添加"机器人"能力',
        '在"凭证与基础信息"页面复制 App ID 和 App Secret',
      ],
      fields: [
        { key: 'appId', label: 'App ID', placeholder: 'cli_xxxxxxxx' },
        { key: 'appSecret', label: 'App Secret', placeholder: '填入飞书应用密钥' },
      ],
      docsUrl: 'https://open.feishu.cn/app',
    },
  ],
  dingtalk: [
    {
      title: '创建钉钉机器人',
      instructions: [
        '打开钉钉开放平台 open-dev.dingtalk.com',
        '创建企业内部应用 → 添加"机器人"能力',
        '复制 Client ID、Client Secret 和 Robot Code',
      ],
      fields: [
        { key: 'clientId', label: 'Client ID', placeholder: 'dingxxxxxxxx' },
        { key: 'clientSecret', label: 'Client Secret', placeholder: '填入钉钉应用密钥' },
        { key: 'robotCode', label: 'Robot Code', placeholder: 'dingxxxxxxxx' },
      ],
      docsUrl: 'https://open-dev.dingtalk.com',
    },
  ],
  telegram: [
    {
      title: '获取 Telegram Bot Token',
      instructions: [
        '在 Telegram 中搜索 @BotFather',
        '发送 /newbot 创建机器人',
        '复制返回的 Bot Token',
      ],
      fields: [
        { key: 'botToken', label: 'Bot Token', placeholder: '123456789:ABCdefGHIjklMNO...' },
      ],
    },
  ],
  discord: [
    {
      title: '创建 Discord Bot',
      instructions: [
        '打开 Discord Developer Portal',
        '创建 Application → 添加 Bot',
        '复制 Bot Token，开启 Message Content Intent',
      ],
      fields: [
        { key: 'botToken', label: 'Bot Token', placeholder: '填入 Discord Bot Token' },
      ],
      docsUrl: 'https://discord.com/developers/applications',
    },
  ],
}

export default function ChannelWizard({ channel, onClose, primaryColor = '#4F46E5' }: ChannelWizardProps) {
  const steps = CHANNEL_STEPS[channel.key] || [{
    title: `接入${channel.name}`,
    instructions: [`${channel.name}通道接入向导即将支持，敬请期待。`],
    fields: [],
  }]
  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">接入{channel.name}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        {steps.length > 1 && (
          <div className="flex items-center gap-2 px-6 pt-4">
            {steps.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i <= stepIndex ? 'text-white' : 'text-gray-400 bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={i <= stepIndex ? { backgroundColor: primaryColor } : undefined}
                >
                  {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < stepIndex ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'}`} style={i < stepIndex ? { backgroundColor: primaryColor } : undefined} />}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{step.title}</h4>

          <ol className="space-y-2">
            {step.instructions.map((inst, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="text-gray-400 flex-shrink-0">{i + 1}.</span>
                <span>{inst}</span>
              </li>
            ))}
          </ol>

          {step.docsUrl && (
            <a
              href={step.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs hover:underline"
              style={{ color: primaryColor }}
              onClick={(e) => { e.preventDefault(); window.open(step.docsUrl, '_blank') }}
            >
              <ExternalLink className="w-3 h-3" /> 打开{channel.name}开放平台
              <button className="ml-2 text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); handleCopy(step.docsUrl!) }}>
                {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </a>
          )}

          {step.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
              <input
                value={values[field.key] || ''}
                onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as string]: primaryColor }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => stepIndex > 0 ? setStepIndex(stepIndex - 1) : onClose()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4" /> {stepIndex > 0 ? '上一步' : '取消'}
          </button>
          <button
            onClick={() => {
              if (isLast) {
                // TODO: save channel config to OpenClaw and close
                onClose()
              } else {
                setStepIndex(stepIndex + 1)
              }
            }}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-xl"
            style={{ backgroundColor: primaryColor }}
          >
            {isLast ? '完成' : '下一步'} {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
