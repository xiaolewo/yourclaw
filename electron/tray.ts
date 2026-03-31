import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron'
import * as path from 'path'
import { getBrandConfig } from './brand-config'
import { isOpenClawRunning } from './openclaw-manager'
import { checkForUpdates } from './updater'

let tray: Tray | null = null

function getIcon(): Electron.NativeImage {
  const iconPath = path.join(__dirname, '..', 'resources', 'icon.png')
  try {
    return nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  } catch {
    return nativeImage.createEmpty()
  }
}

export function createTray(mainWindow: BrowserWindow) {
  const brand = getBrandConfig()
  tray = new Tray(getIcon())
  tray.setToolTip(brand.siteName)

  updateTrayMenu(mainWindow)

  tray.on('click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
}

export function updateTrayMenu(mainWindow: BrowserWindow) {
  if (!tray) return
  const brand = getBrandConfig()
  const running = isOpenClawRunning()

  const contextMenu = Menu.buildFromTemplate([
    { label: brand.siteName, enabled: false },
    { type: 'separator' },
    { label: running ? 'AI 引擎运行中' : 'AI 引擎未启动', enabled: false },
    { type: 'separator' },
    {
      label: '打开主窗口',
      click: () => { mainWindow.show(); mainWindow.focus() },
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        mainWindow.show()
        mainWindow.webContents.send('navigate', '/settings')
      },
    },
    {
      label: '检查更新',
      click: () => checkForUpdates(),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit(),
    },
  ])

  tray.setContextMenu(contextMenu)
}

export function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
