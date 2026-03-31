import { BrowserWindow } from 'electron'
import { getBrandConfig } from './brand-config'
import https from 'https'
import http from 'http'

let heartbeatTimer: NodeJS.Timeout | null = null
let isLocked = false

function request(url: string, options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.request(url, options, (res) => {
      let body = ''
      res.on('data', (chunk: Buffer) => { body += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch { resolve({ error: body }) }
      })
    })
    req.on('error', reject)
    if (options.body) req.write(options.body)
    req.end()
  })
}

export async function checkLicense(jwt?: string): Promise<{ valid: boolean; message?: string }> {
  const brand = getBrandConfig()
  if (!brand.siteUrl || !brand.licenseKey) {
    return { valid: false, message: '客户端配置异常' }
  }

  try {
    const url = `${brand.siteUrl}/claw/heartbeat`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-License-Key': brand.licenseKey,
    }
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`

    const result = await request(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ licenseKey: brand.licenseKey }),
    })

    if (result.valid === false || result.statusCode === 403) {
      return { valid: false, message: result.message || '授权已过期' }
    }
    return { valid: true }
  } catch (err: any) {
    return { valid: true, message: '无法连接服务器，离线模式' }
  }
}

export function startHeartbeat(mainWindow: BrowserWindow, jwt?: string) {
  if (heartbeatTimer) clearInterval(heartbeatTimer)

  heartbeatTimer = setInterval(async () => {
    const result = await checkLicense(jwt)
    if (!result.valid && !isLocked) {
      isLocked = true
      mainWindow.webContents.send('license-expired', result.message)
    }
  }, 30 * 60 * 1000)
}

export function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

export function getIsLocked(): boolean {
  return isLocked
}

export function resetLock() {
  isLocked = false
}
