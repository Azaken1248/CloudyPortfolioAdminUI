import { injectPreviewBridge } from '../preview-bridge-script.js'

const PORTFOLIO_ORIGIN = 'https://cloudy.azaken.com'
const PORTFOLIO_API = 'https://cloudyadminapi.azaken.com/api/portfolio'

export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/preview/, '') || '/'

  // Resolve rather than concatenate, then confirm the result stayed on the
  // portfolio origin — string concatenation onto an origin can be re-pointed by
  // certain request targets.
  let target
  try {
    target = new URL(path, PORTFOLIO_ORIGIN)
  } catch {
    res.status(400).send('Bad request target')
    return
  }

  if (target.origin !== new URL(PORTFOLIO_ORIGIN).origin) {
    res.status(403).send('Refusing to proxy outside the configured portfolio origin')
    return
  }

  try {
    const resp = await fetch(target)
    const ct = resp.headers.get('content-type') || 'application/octet-stream'

    if (ct.includes('text/html')) {
      const html = injectPreviewBridge(await resp.text(), PORTFOLIO_ORIGIN, PORTFOLIO_API)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      // This response puts the portfolio's own HTML on the ADMIN origin, so any
      // XSS in the portfolio would otherwise run with access to the admin API
      // through the same-origin /api proxy. The CSP below cannot make that
      // impossible while the frame stays same-origin (the injected bridge needs
      // it), but it removes the useful exfiltration paths: script may only come
      // from the portfolio origin, network access is limited to the portfolio
      // and this origin, and form submission and plugins are blocked outright.
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self' " + PORTFOLIO_ORIGIN,
          "script-src 'unsafe-inline' " + PORTFOLIO_ORIGIN,
          "style-src 'unsafe-inline' 'self' " + PORTFOLIO_ORIGIN + ' https://fonts.googleapis.com',
          "font-src 'self' data: " + PORTFOLIO_ORIGIN + ' https://fonts.gstatic.com',
          "img-src 'self' data: blob: https:",
          "connect-src 'self' " + PORTFOLIO_ORIGIN,
          "form-action 'none'",
          "object-src 'none'",
          "base-uri " + PORTFOLIO_ORIGIN,
          "frame-ancestors 'self'",
        ].join('; '),
      )
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.status(200).send(html)
    } else {
      const buf = Buffer.from(await resp.arrayBuffer())
      res.setHeader('Content-Type', ct)
      res.status(resp.status).send(buf)
    }
  } catch {
    res.status(502).send('Portfolio site not reachable at ' + PORTFOLIO_ORIGIN)
  }
}
