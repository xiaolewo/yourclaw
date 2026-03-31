import * as path from 'path'
import * as fs from 'fs'

export interface BrandConfig {
  siteUrl: string
  siteName: string
  logoUrl: string
  primaryColor: string
  licenseKey: string
  supportWechat: string
  supportEmail: string
}

let cachedConfig: BrandConfig | null = null

export function getBrandConfig(): BrandConfig {
  if (cachedConfig) return cachedConfig

  const possiblePaths = [
    path.join(__dirname, '..', 'brand', 'config.json'),
    path.join(process.resourcesPath || '', 'brand', 'config.json'),
    path.join(__dirname, 'brand', 'config.json'),
  ]

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8')
        cachedConfig = JSON.parse(raw) as BrandConfig
        return cachedConfig
      }
    } catch {}
  }

  cachedConfig = {
    siteUrl: 'https://ai.example.com',
    siteName: 'YourClaw',
    logoUrl: '',
    primaryColor: '#4F46E5',
    licenseKey: '',
    supportWechat: '',
    supportEmail: '',
  }
  return cachedConfig
}
