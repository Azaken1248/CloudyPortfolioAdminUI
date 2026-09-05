import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'node:http'
// @ts-expect-error - plain JS module shared with the Vercel function
import { injectPreviewBridge } from './preview-bridge-script.js'

/**
 * Development targets. These default to LOCAL services so `npm run dev` cannot
 * quietly read and write production data; pointing at production is possible,
 * but has to be asked for explicitly via the environment.
 *
 *   VITE_API_TARGET        origin the /api proxy forwards to
 *   VITE_PORTFOLIO_ORIGIN  site loaded into the preview iframe
 */
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:5055'
const PORTFOLIO_ORIGIN = process.env.VITE_PORTFOLIO_ORIGIN || 'http://localhost:5202'
const PORTFOLIO_API = `${API_TARGET}/api/portfolio`
const PREVIEW_PORT = 5176

const IS_PRODUCTION_TARGET = /azaken\.com/.test(API_TARGET)

function ogAbsoluteUrlPlugin(): Plugin {
  return {
    name: 'og-absolute-url',
    transformIndexHtml(html) {
      const siteUrl = (
        process.env.VITE_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : '')
      ).replace(/\/$/, '')

      if (!siteUrl) return html

      return html.replace(
        /(<meta\s[^>]*(?:property="og:image"|name="twitter:image")[^>]*content=")\/([^"]*")/g,
        `$1${siteUrl}/$2`
      )
    },
  }
}

function portfolioPreviewPlugin(): Plugin {
  return {
    name: 'portfolio-preview-proxy',
    configureServer() {
      const proxy = http.createServer(async (req, res) => {
        // req.url is the raw request target and can be anything a client sends,
        // including forms that would re-point the host when concatenated onto an
        // origin (a leading '@', an absolute URL). Resolve it against the target
        // origin and then confirm the result did not escape it.
        let target: URL
        try {
          target = new URL(req.url || '/', PORTFOLIO_ORIGIN)
        } catch {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Bad request target')
          return
        }

        if (target.origin !== new URL(PORTFOLIO_ORIGIN).origin) {
          res.writeHead(403, { 'Content-Type': 'text/plain' })
          res.end('Refusing to proxy outside the configured portfolio origin')
          return
        }

        try {
          const resp = await fetch(target)
          const ct = resp.headers.get('content-type') || 'application/octet-stream'
          if (ct.includes('text/html')) {
            // Same injector the deployed function uses, so the two cannot drift.
            const html = injectPreviewBridge(await resp.text(), PORTFOLIO_ORIGIN, PORTFOLIO_API)
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
            res.end(html)
          } else {
            const buf = Buffer.from(await resp.arrayBuffer())
            res.writeHead(resp.status, { 'Content-Type': ct })
            res.end(buf)
          }
        } catch {
          res.writeHead(502, { 'Content-Type': 'text/plain' })
          res.end('Portfolio dev server not reachable at ' + PORTFOLIO_ORIGIN)
        }
      })
      proxy.on('error', (e: NodeJS.ErrnoException) => {
        if (e.code === 'EADDRINUSE') {
          console.warn(`[preview] Port ${PREVIEW_PORT} in use, trying ${PREVIEW_PORT + 1}`)
          proxy.listen(PREVIEW_PORT + 1, '127.0.0.1')
        }
      })
      // Bound to loopback explicitly: Node listens on all interfaces by
      // default, which put an unauthenticated proxy on the local network.
      proxy.listen(PREVIEW_PORT, '127.0.0.1', () => {
        console.log(`  ➜  Preview:  http://127.0.0.1:${PREVIEW_PORT}/`)
      })
    },
  }
}

if (IS_PRODUCTION_TARGET) {
  console.warn(
    `\n  \x1b[41m\x1b[97m  WARNING  \x1b[0m dev server is proxying /api to PRODUCTION: ${API_TARGET}` +
    `\n            Edits made here change the live site. Unset VITE_API_TARGET to use the local stack.\n`,
  )
} else {
  console.log(`  \x1b[36m➜  API target:\x1b[0m ${API_TARGET}  \x1b[90m(local)\x1b[0m`)
}

export default defineConfig({
  plugins: [react(), ogAbsoluteUrlPlugin(), portfolioPreviewPlugin()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          if (IS_PRODUCTION_TARGET) {
            // Stripping Origin defeats the API's CORS check. Only needed when
            // deliberately pointed at production; a local API should be
            // configured to allow this dev origin instead.
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          }
        },
      },
    },
  },
})
