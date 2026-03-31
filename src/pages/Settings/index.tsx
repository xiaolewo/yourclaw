import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Settings as SettingsIcon, Cpu, Link2, User, Info, ChevronLeft } from 'lucide-react'
import General from './General'
import Models from './Models'
import Channels from './Channels'
import Account from './Account'
import About from './About'

const TABS = [
  { key: 'general', label: '通用', icon: SettingsIcon },
  { key: 'models', label: '模型', icon: Cpu },
  { key: 'channels', label: '通道', icon: Link2 },
  { key: 'account', label: '账户', icon: User },
  { key: 'about', label: '关于', icon: Info },
]

export default function Settings({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('general')
  const { brandConfig } = useAuthStore()
  const primaryColor = brandConfig?.primaryColor || '#4F46E5'

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Left tabs */}
      <div className="w-48 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> 返回
          </button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">设置</h2>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                activeTab === key
                  ? 'text-white font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
              style={activeTab === key ? { backgroundColor: primaryColor } : undefined}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && <General />}
        {activeTab === 'models' && <Models />}
        {activeTab === 'channels' && <Channels />}
        {activeTab === 'account' && <Account />}
        {activeTab === 'about' && <About />}
      </div>
    </div>
  )
}
