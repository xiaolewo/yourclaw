import { app, BrowserWindow, ipcMain, safeStorage, shell } from 'electron'
import * as path from 'path'
import { getBrandConfig } from './brand-config'
import { startOpenClaw, stopOpenClaw, restartOpenClaw, isOpenClawRunning, updateOpenClawToken, getOpenClawPort, ensureOpenClawConfig } from './openclaw-manager'
import { checkLicense, startHeartbeat, stopHeartbeat } from './license-guard'
import { createTray, destroyTray } from './tray'
import { initUpdater, checkForUpdates, downloadUpdate } from './updater'

let mainWindow: BrowserWindow | null = null
let authToken: Buffer | null = null
let isQuitting = false

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const isDev = !!VITE_DEV_SERVER_URL

function createWindow() {
  const brand = getBrandConfig()

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: brand.siteName,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'win32',
    icon: path.join(__dirname, '..', 'resources', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false,
    },
  })

  if (process.platform === 'win32') {
    mainWindow.setMenuBarVisibility(false)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL!)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  createTray(mainWindow)
  initUpdater(mainWindow)

  // Check for updates 10s after launch (non-dev only)
  if (!isDev) {
    setTimeout(() => checkForUpdates(), 10000)
  }
}

function getDecryptedToken(): string | undefined {
  if (!authToken) return undefined
  try {
    return safeStorage.decryptString(authToken)
  } catch {
    return undefined
  }
}

function setupIPC() {
  ipcMain.handle('get-brand-config', () => getBrandConfig())

  ipcMain.handle('get-auth-token', () => getDecryptedToken() || null)

  ipcMain.handle('set-auth-token', (_event, token: string) => {
    try {
      authToken = safeStorage.encryptString(token)
      // Start heartbeat with new token
      if (mainWindow) startHeartbeat(mainWindow, token)
      // Sync token to OpenClaw config
      updateOpenClawToken(token)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('clear-auth-token', () => {
    authToken = null
    stopHeartbeat()
    return true
  })

  ipcMain.handle('check-license', async () => {
    return checkLicense(getDecryptedToken())
  })

  // OpenClaw management
  ipcMain.handle('start-openclaw', async () => {
    try {
      // Ensure latest JWT is in OpenClaw config before starting
      const token = getDecryptedToken()
      if (token) ensureOpenClawConfig(token)
      await startOpenClaw()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('stop-openclaw', () => {
    stopOpenClaw()
    return { success: true }
  })

  ipcMain.handle('restart-openclaw', async () => {
    try {
      await restartOpenClaw()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('is-openclaw-running', () => isOpenClawRunning())

  ipcMain.handle('get-openclaw-url', () => `http://localhost:${getOpenClawPort()}`)

  ipcMain.handle('get-app-version', () => app.getVersion())

  // Auto-launch (login item)
  ipcMain.handle('set-auto-launch', (_event, enabled: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true,
    })
    return true
  })

  ipcMain.handle('get-auto-launch', () => {
    return app.getLoginItemSettings().openAtLogin
  })

  // Updater
  ipcMain.handle('check-for-updates', () => {
    checkForUpdates()
    return true
  })

  ipcMain.handle('download-update', () => {
    downloadUpdate()
    return true
  })

  // Window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window-close', () => mainWindow?.hide())
}

// Single instance lock
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    // Pre-write OpenClaw config with brand info
    ensureOpenClawConfig()
    setupIPC()
    createWindow()
  })
}

app.on('window-all-closed', () => {
  // Keep running in tray
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  stopOpenClaw()
  stopHeartbeat()
  destroyTray()
})
