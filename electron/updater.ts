import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'

let mainWin: BrowserWindow | null = null

export function initUpdater(win: BrowserWindow) {
  mainWin = win
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version)
    mainWin?.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    })
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] No update available')
    mainWin?.webContents.send('update-not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWin?.webContents.send('update-progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', () => {
    console.log('[Updater] Update downloaded, prompting install')
    mainWin?.webContents.send('update-downloaded')
    dialog.showMessageBox(mainWin!, {
      type: 'info',
      title: '更新就绪',
      message: '新版本已下载完成，重启后自动安装。',
      buttons: ['立即重启', '稍后'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true)
      }
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err.message)
    mainWin?.webContents.send('update-error', err.message)
  })
}

export function checkForUpdates() {
  try {
    autoUpdater.checkForUpdates()
  } catch (err: any) {
    console.error('[Updater] Check failed:', err.message)
  }
}

export function downloadUpdate() {
  try {
    autoUpdater.downloadUpdate()
  } catch (err: any) {
    console.error('[Updater] Download failed:', err.message)
  }
}
