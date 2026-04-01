import { ChildProcess, spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { getBrandConfig } from './brand-config'

let openClawProcess: ChildProcess | null = null
const OPENCLAW_PORT = 3007

function getOpenClawDir(): string {
  // Dev: openclaw/ next to electron/
  const devPath = path.join(__dirname, '..', 'openclaw')
  if (fs.existsSync(path.join(devPath, 'node_modules', '.bin'))) return devPath
  // Production: extraResources/openclaw
  const prodPath = path.join(process.resourcesPath || '', 'openclaw')
  if (fs.existsSync(prodPath)) return prodPath
  return devPath
}

function getNodePath(): string {
  const platform = process.platform
  const nodeBin = platform === 'win32' ? 'node.exe' : 'bin/node'
  const bundledPaths = [
    path.join(process.resourcesPath || '', 'node', nodeBin),
    path.join(process.resourcesPath || '', 'node', platform === 'win32' ? 'node.exe' : 'node'),
  ]
  for (const p of bundledPaths) {
    if (fs.existsSync(p)) return p
  }
  return 'node'
}

function getOpenClawBin(): string {
  const clawDir = getOpenClawDir()
  const platform = process.platform
  // Try node_modules/.bin/openclaw
  const binName = platform === 'win32' ? 'openclaw.cmd' : 'openclaw'
  const binPath = path.join(clawDir, 'node_modules', '.bin', binName)
  if (fs.existsSync(binPath)) return binPath
  // Fallback: find the main entry in the openclaw package
  const pkgJsonPath = path.join(clawDir, 'node_modules', 'openclaw', 'package.json')
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
      if (pkg.bin) {
        const binEntry = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.openclaw || pkg.bin[Object.keys(pkg.bin)[0]]
        if (binEntry) return path.join(clawDir, 'node_modules', 'openclaw', binEntry)
      }
      if (pkg.main) return path.join(clawDir, 'node_modules', 'openclaw', pkg.main)
    } catch {}
  }
  return binPath
}

function getDataDir(): string {
  const dir = path.join(app.getPath('userData'), 'openclaw-data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function getConfigDir(): string {
  const dir = path.join(app.getPath('home'), '.openclaw')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Write ~/.openclaw/openclaw.json so OpenClaw uses YourPro backend as model provider.
 * Provider name "yourpro" avoids collision with built-in "openai" provider.
 * baseUrl points to site root (no /v1 suffix -- OpenClaw appends /v1/chat/completions itself,
 * and YourPro's ClawV1Controller is already mounted at /v1).
 */
export function ensureOpenClawConfig(jwt?: string) {
  const configDir = getConfigDir()
  const configPath = path.join(configDir, 'openclaw.json')
  const brand = getBrandConfig()
  const apiBase = brand.siteUrl.replace(/\/$/, '')

  const provider: Record<string, any> = {
    baseUrl: apiBase,
    apiKey: jwt || 'yourclaw-pending',
    api: 'openai-completions',
    models: [],
  }

  const config: Record<string, any> = {
    gateway: {
      port: OPENCLAW_PORT,
    },
    models: {
      mode: 'merge',
      providers: {
        yourpro: provider,
      },
    },
    channels: {},
    ui: {
      title: brand.siteName,
    },
  }

  // Read existing config and merge (preserve user customizations)
  try {
    if (fs.existsSync(configPath)) {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      existing.gateway = { ...(existing.gateway || {}), port: OPENCLAW_PORT }
      existing.models = existing.models || {}
      existing.models.mode = 'merge'
      existing.models.providers = existing.models.providers || {}
      const prev = existing.models.providers.yourpro || {}
      existing.models.providers.yourpro = {
        ...prev,
        baseUrl: apiBase,
        apiKey: jwt || prev.apiKey || 'yourclaw-pending',
        api: 'openai-completions',
        models: prev.models || [],
      }
      // Clean up legacy "openai" provider if we wrote it before
      if (existing.models.providers.openai?.endpoint?.includes(apiBase)) {
        delete existing.models.providers.openai
      }
      existing.ui = { ...(existing.ui || {}), title: brand.siteName }
      fs.writeFileSync(configPath, JSON.stringify(existing, null, 2))
      console.log('[OpenClaw] Config merged:', configPath)
      return
    }
  } catch {}

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  console.log('[OpenClaw] Config written:', configPath)
}

/**
 * Update the JWT token in openclaw.json for API auth
 */
export function updateOpenClawToken(jwt: string) {
  const configPath = path.join(getConfigDir(), 'openclaw.json')
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      if (config.models?.providers?.yourpro) {
        config.models.providers.yourpro.apiKey = jwt
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      console.log('[OpenClaw] Token updated in config')
    } else {
      ensureOpenClawConfig(jwt)
    }
  } catch (err) {
    console.error('[OpenClaw] Failed to update token:', err)
    ensureOpenClawConfig(jwt)
  }
}

/**
 * Sync model list from YourPro /claw/models into openclaw.json providers.yourpro.models[]
 * Called after login when we have the JWT and model list from the server.
 */
export function updateOpenClawModels(models: Array<{ id: string; displayName: string; modelId: string; maxContextTokens?: number }>) {
  const configPath = path.join(getConfigDir(), 'openclaw.json')
  try {
    if (!fs.existsSync(configPath)) {
      ensureOpenClawConfig()
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    if (!config.models?.providers?.yourpro) {
      config.models = config.models || {}
      config.models.providers = config.models.providers || {}
      config.models.providers.yourpro = { baseUrl: '', apiKey: 'yourclaw-pending', api: 'openai-completions', models: [] }
    }
    config.models.providers.yourpro.models = models.map(m => ({
      id: m.modelId,
      name: m.displayName || m.modelId,
      reasoning: false,
      input: ['text'],
      contextWindow: m.maxContextTokens || 128000,
      maxTokens: 8192,
    }))
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log(`[OpenClaw] Models updated: ${models.length} models`)
  } catch (err) {
    console.error('[OpenClaw] Failed to update models:', err)
  }
}

export function startOpenClaw(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (openClawProcess) {
      resolve()
      return
    }

    const clawDir = getOpenClawDir()
    const nodePath = getNodePath()
    const clawBin = getOpenClawBin()

    if (!fs.existsSync(clawBin)) {
      // Fallback: try old index.js placeholder
      const fallbackEntry = path.join(clawDir, 'index.js')
      if (fs.existsSync(fallbackEntry)) {
        console.warn('[OpenClaw] openclaw package not found, using fallback index.js')
        ensureOpenClawConfig()
        openClawProcess = spawn(nodePath, [fallbackEntry], {
          cwd: clawDir,
          env: { ...process.env, PORT: String(OPENCLAW_PORT) },
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        attachProcessHandlers(resolve, reject)
        return
      }
      console.warn('[OpenClaw] No entry script found at:', clawBin)
      resolve()
      return
    }

    ensureOpenClawConfig()

    // Start openclaw gateway
    const isScript = clawBin.endsWith('.js') || clawBin.endsWith('.mjs') || clawBin.endsWith('.cjs')
    const command = isScript ? nodePath : clawBin
    const args = isScript
      ? [clawBin, 'gateway', 'start', '--port', String(OPENCLAW_PORT)]
      : ['gateway', 'start', '--port', String(OPENCLAW_PORT)]

    console.log('[OpenClaw] Starting:', command, args.join(' '))

    openClawProcess = spawn(command, args, {
      cwd: clawDir,
      env: {
        ...process.env,
        OPENCLAW_DATA_DIR: getDataDir(),
        OPENCLAW_CONFIG_DIR: getConfigDir(),
        NODE_ENV: 'production',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    attachProcessHandlers(resolve, reject)
  })
}

function attachProcessHandlers(resolve: () => void, reject: (err: Error) => void) {
  if (!openClawProcess) return

  let started = false

  openClawProcess.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    console.log('[OpenClaw]', msg)
    // Detect gateway ready
    if (!started && (msg.includes('listening') || msg.includes('started') || msg.includes('ready') || msg.includes(String(OPENCLAW_PORT)))) {
      started = true
      resolve()
    }
  })

  openClawProcess.stderr?.on('data', (data: Buffer) => {
    console.error('[OpenClaw Error]', data.toString().trim())
  })

  openClawProcess.on('error', (err) => {
    console.error('[OpenClaw] Failed to start:', err.message)
    openClawProcess = null
    reject(err)
  })

  openClawProcess.on('exit', (code) => {
    console.log('[OpenClaw] Exited with code:', code)
    openClawProcess = null
  })

  // Timeout: resolve after 5s even if no "ready" message
  setTimeout(() => {
    if (!started) {
      started = true
      resolve()
    }
  }, 5000)
}

export function stopOpenClaw(): void {
  if (openClawProcess) {
    openClawProcess.kill('SIGTERM')
    openClawProcess = null
    console.log('[OpenClaw] Stopped')
  }
}

export function restartOpenClaw(): Promise<void> {
  stopOpenClaw()
  return startOpenClaw()
}

export function isOpenClawRunning(): boolean {
  return openClawProcess !== null && !openClawProcess.killed
}

export function getOpenClawPort(): number {
  return OPENCLAW_PORT
}
