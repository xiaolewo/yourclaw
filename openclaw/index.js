// Placeholder for OpenClaw core
// In production, this will be replaced with the actual OpenClaw fork
console.log('[OpenClaw] Starting OpenClaw core...')
console.log('[OpenClaw] Data dir:', process.env.OPENCLAW_DATA_DIR || 'default')

// Simulate a simple HTTP server for the dashboard
const http = require('http')
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #374151; }
        .container { text-align: center; }
        h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        p { color: #6b7280; }
        .emoji { font-size: 4rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">🦞</div>
        <h1>OpenClaw 核心</h1>
        <p>OpenClaw 已启动运行</p>
        <p style="margin-top: 2rem; font-size: 0.875rem; color: #9ca3af;">
          此为占位页面，集成真实 OpenClaw 后将显示完整 Dashboard
        </p>
      </div>
    </body>
    </html>
  `)
})

server.listen(3007, () => {
  console.log('[OpenClaw] Dashboard running on http://localhost:3007')
})
