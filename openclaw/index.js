// Fallback: only used if openclaw npm package is not installed
// In production builds, CI installs openclaw@latest and this file is removed
console.log('[OpenClaw] Fallback mode - openclaw package not installed')
console.log('[OpenClaw] This is a development placeholder')

const http = require('http')
const PORT = process.env.PORT || 3007

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0e0c0d; color: #e5e5e5; }
  .c { text-align: center; max-width: 400px; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #ff5a36; }
  p { color: #888; font-size: 0.875rem; line-height: 1.6; }
  .badge { display: inline-block; margin-top: 1rem; padding: 0.25rem 0.75rem; background: #ff5a3620; color: #ff5a36; border-radius: 999px; font-size: 0.75rem; }
</style></head><body>
<div class="c">
  <h1>OpenClaw Development Mode</h1>
  <p>The OpenClaw engine is not installed in this development build.</p>
  <p style="margin-top:0.5rem;">Run <code style="background:#222;padding:2px 6px;border-radius:4px;">cd openclaw && npm install openclaw@latest</code> to install.</p>
  <span class="badge">Fallback Mode</span>
</div>
</body></html>`)
})

server.listen(PORT, () => {
  console.log(`[OpenClaw] Fallback server on http://localhost:${PORT}`)
})
