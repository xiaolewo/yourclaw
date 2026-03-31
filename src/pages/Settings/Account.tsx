import { useAuthStore } from '@/stores/authStore'
import { clawApi } from '@/services/api'
import { Coins, Calendar, Crown, Wifi, Shield, LogOut, User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Account() {
  const { user, setUser, clearToken, brandConfig } = useAuthStore()
  const primaryColor = brandConfig?.primaryColor || '#4F46E5'
  const [serverVersion, setServerVersion] = useState('')
  const [clientVersion, setClientVersion] = useState('')

  useEffect(() => {
    clawApi.getUserInfo().then(info => setUser(info)).catch(() => {})
    window.electronAPI?.getAppVersion().then(v => setClientVersion(v)).catch(() => {})
  }, [])

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return
    await window.electronAPI.stopOpenClaw()
    await window.electronAPI.clearAuthToken()
    clearToken()
  }

  const formatDate = (d: string | null) => {
    if (!d) return '无'
    return new Date(d).toLocaleDateString('zh-CN')
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">我的账户</h3>

        {/* User card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.nickname || '用户'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email || user?.phone || ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Coins className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">积分余额</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{user?.points?.toLocaleString() ?? '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <Crown className="w-5 h-5" style={{ color: primaryColor }} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">会员等级</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.membershipName || '普通用户'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl col-span-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">会员到期</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(user?.membershipExpireAt ?? null)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">服务状态</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">连接状态</span>
            </div>
            <span className="text-sm text-green-500 font-medium">正常</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">授权状态</span>
            </div>
            <span className="text-sm text-green-500 font-medium">有效</span>
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </div>
  )
}
