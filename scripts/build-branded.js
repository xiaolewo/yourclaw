#!/usr/bin/env node
/**
 * Brand injection build script
 * Usage: node scripts/build-branded.js --siteUrl=https://ai.example.com --siteName=智脑AI --logo=logo.png --color=#4F46E5 --licenseKey=YPRO-XXXX
 */

const fs = require('fs')
const path = require('path')

const args = {}
process.argv.slice(2).forEach(arg => {
  const [key, ...val] = arg.replace(/^--/, '').split('=')
  args[key] = val.join('=')
})

const brandConfig = {
  siteUrl: args.siteUrl || 'https://ai.example.com',
  siteName: args.siteName || 'AI 助手',
  logoUrl: args.logoUrl || '',
  primaryColor: args.color || '#4F46E5',
  licenseKey: args.licenseKey || '',
  supportWechat: args.supportWechat || '',
  supportEmail: args.supportEmail || '',
}

// 1. Write brand/config.json
const brandDir = path.join(__dirname, '..', 'brand')
if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true })
fs.writeFileSync(path.join(brandDir, 'config.json'), JSON.stringify(brandConfig, null, 2))
console.log('[Brand] config.json written')

// 2. Update electron-builder.yml productName
const builderYml = path.join(__dirname, '..', 'electron-builder.yml')
let yml = fs.readFileSync(builderYml, 'utf-8')
yml = yml.replace(/productName:\s*.+/, `productName: ${brandConfig.siteName}`)
fs.writeFileSync(builderYml, yml)
console.log('[Brand] electron-builder.yml productName updated to:', brandConfig.siteName)

// 3. Update package.json name
const pkgPath = path.join(__dirname, '..', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
pkg.productName = brandConfig.siteName
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
console.log('[Brand] package.json productName updated')

// 4. Copy logo to resources if provided
if (args.logo && fs.existsSync(args.logo)) {
  const ext = path.extname(args.logo).toLowerCase()
  const resDir = path.join(__dirname, '..', 'resources')
  if (ext === '.ico') fs.copyFileSync(args.logo, path.join(resDir, 'icon.ico'))
  if (ext === '.icns') fs.copyFileSync(args.logo, path.join(resDir, 'icon.icns'))
  if (ext === '.png') {
    fs.copyFileSync(args.logo, path.join(resDir, 'icon.png'))
  }
  console.log('[Brand] Logo copied to resources/')
}

console.log('[Brand] Brand injection complete. Run: npm run build:all')
