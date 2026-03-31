interface ElectronAPI {
  // Brand
  getBrandConfig: () => Promise<{
    siteUrl: string
    siteName: string
    logoUrl: string
    primaryColor: string
    licenseKey: string
    supportWechat: string
    supportEmail: string
  }>

  // Auth
  getAuthToken: () => Promise<string | null>
  setAuthToken: (token: string) => Promise<boolean>
  clearAuthToken: () => Promise<boolean>
  checkLicense: () => Promise<{ valid: boolean; message?: string }>

  // OpenClaw
  startOpenClaw: () => Promise<{ success: boolean; error?: string }>
  stopOpenClaw: () => Promise<{ success: boolean }>
  restartOpenClaw: () => Promise<{ success: boolean; error?: string }>
  isOpenClawRunning: () => Promise<boolean>
  getOpenClawUrl: () => Promise<string>

  // App
  getAppVersion: () => Promise<string>

  // Auto-launch
  setAutoLaunch: (enabled: boolean) => Promise<boolean>
  getAutoLaunch: () => Promise<boolean>

  // Updater
  checkForUpdates: () => Promise<boolean>
  downloadUpdate: () => Promise<boolean>

  // Window controls
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void

  // Events
  onLicenseExpired: (callback: (message: string) => void) => void
  onOpenClawReady: (callback: () => void) => void
  onUpdateAvailable: (callback: (info: { version: string }) => void) => void
  onUpdateNotAvailable: (callback: () => void) => void
  onUpdateProgress: (callback: (progress: { percent: number }) => void) => void
  onUpdateDownloaded: (callback: () => void) => void
  onUpdateError: (callback: (message: string) => void) => void
  onNavigate: (callback: (path: string) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
