import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Brand
  getBrandConfig: () => ipcRenderer.invoke('get-brand-config'),

  // Auth
  getAuthToken: () => ipcRenderer.invoke('get-auth-token'),
  setAuthToken: (token: string) => ipcRenderer.invoke('set-auth-token', token),
  clearAuthToken: () => ipcRenderer.invoke('clear-auth-token'),
  checkLicense: () => ipcRenderer.invoke('check-license'),

  // OpenClaw
  startOpenClaw: () => ipcRenderer.invoke('start-openclaw'),
  stopOpenClaw: () => ipcRenderer.invoke('stop-openclaw'),
  restartOpenClaw: () => ipcRenderer.invoke('restart-openclaw'),
  isOpenClawRunning: () => ipcRenderer.invoke('is-openclaw-running'),
  getOpenClawUrl: () => ipcRenderer.invoke('get-openclaw-url'),

  // App
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Auto-launch
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),

  // Updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // Events from main process
  onLicenseExpired: (callback: (message: string) => void) => {
    ipcRenderer.on('license-expired', (_event, message) => callback(message))
  },
  onOpenClawReady: (callback: () => void) => {
    ipcRenderer.on('openclaw-ready', () => callback())
  },
  onUpdateAvailable: (callback: (info: { version: string }) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info))
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update-not-available', () => callback())
  },
  onUpdateProgress: (callback: (progress: { percent: number }) => void) => {
    ipcRenderer.on('update-progress', (_event, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', () => callback())
  },
  onUpdateError: (callback: (message: string) => void) => {
    ipcRenderer.on('update-error', (_event, message) => callback(message))
  },
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate', (_event, path) => callback(path))
  },
})
