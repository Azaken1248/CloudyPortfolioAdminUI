import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DiscordLogoIcon } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { AUTH_TOKEN_KEY } from '../config/api'
import './LoginPage.css'

type Star = {
  x: number
  y: number
  size: number
  baseAlpha: number
  twinkleSpeed: number
  twinkleOffset: number
  type: 'dot' | 'cross' | 'burst'
  hue: 'blue' | 'pink' | 'white' | 'lavender'
  pulseTimer: number
}

type ShootingStar = {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  alpha: number
  life: number
  maxLife: number
}

type PulseRing = { x: number; y: number; r: number; maxR: number; alpha: number; color: string }
type NebulaWisp = { x: number; y: number; vx: number; vy: number; radius: number; alpha: number; hue: number; scaleX: number; scaleY: number; rotation: number }
type Streak = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; alpha: number }

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)

    type CLine = { x1: number; y1: number; x2: number; y2: number }
    const stars: Star[] = []
    const constellationLines: CLine[] = []

    const CONSTS: { hue: Star['hue']; pts: [number,number][]; lines: [number,number][] }[] = [
      { hue: 'blue',     pts: [[0.43,0.33],[0.38,0.44],[0.49,0.42],[0.40,0.55],[0.44,0.57],[0.47,0.59],[0.40,0.72],[0.51,0.71]], lines: [[0,1],[0,2],[1,3],[2,5],[3,4],[4,5],[3,6],[5,7]] },
      { hue: 'lavender', pts: [[0.65,0.18],[0.71,0.22],[0.77,0.18],[0.76,0.10],[0.83,0.07],[0.89,0.10],[0.96,0.17]],           lines: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]] },
      { hue: 'pink',     pts: [[0.05,0.13],[0.13,0.05],[0.21,0.14],[0.28,0.06],[0.35,0.13]],                                   lines: [[0,1],[1,2],[2,3],[3,4]] },
      { hue: 'white',    pts: [[0.53,0.39],[0.56,0.30],[0.59,0.21],[0.63,0.13],[0.67,0.16],[0.71,0.25],[0.79,0.32]],           lines: [[0,1],[1,2],[2,3],[3,4],[4,2],[2,5],[5,6]] },
      { hue: 'pink',     pts: [[0.76,0.47],[0.80,0.49],[0.77,0.55],[0.78,0.63],[0.76,0.70],[0.78,0.77],[0.83,0.82],[0.88,0.80]], lines: [[0,2],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]] },
      { hue: 'lavender', pts: [[0.25,0.09],[0.31,0.11],[0.22,0.28],[0.25,0.38],[0.33,0.30],[0.35,0.40]],                       lines: [[0,2],[2,3],[1,4],[4,5],[3,4]] },
    ]

    const vW = 1920
    const vH = 1080
    const scale = Math.max(w / vW, h / vH)
    const ox = (w - vW * scale) / 2
    const oy = (h - vH * scale) / 2

    for (const c of CONSTS) {
      const base = stars.length
      for (const [nx, ny] of c.pts) {
        const r = Math.random()
        stars.push({
          x: ox + nx * vW * scale, 
          y: oy + ny * vH * scale,
          size: 1.5 + Math.random() * 1.5,
          baseAlpha: 0.7 + Math.random() * 0.3,
          twinkleSpeed: Math.random() * 0.012 + 0.002,
          twinkleOffset: Math.random() * Math.PI * 2,
          type: r < 0.18 ? 'burst' : r < 0.42 ? 'cross' : 'dot',
          hue: c.hue,
          pulseTimer: Math.floor(Math.random() * 400),
        })
      }
      for (const [i, j] of c.lines) {
        constellationLines.push({ x1: stars[base+i].x, y1: stars[base+i].y, x2: stars[base+j].x, y2: stars[base+j].y })
      }
    }

    const bgCount = Math.max(60, Math.floor((w * h) / 7000))
    const hues: Star['hue'][] = ['blue', 'pink', 'white', 'lavender']
    for (let i = 0; i < bgCount; i++) {
      stars.push({
        x: Math.random() * w, y: Math.random() * h,
        size: 0.8 + Math.random() * 1.2,
        baseAlpha: 0.4 + Math.random() * 0.5,
        twinkleSpeed: Math.random() * 0.01 + 0.002,
        twinkleOffset: Math.random() * Math.PI * 2,
        type: 'dot',
        hue: hues[Math.floor(Math.random() * hues.length)],
        pulseTimer: 0,
      })
    }

    const pulseRings: PulseRing[] = []
    const streaks: Streak[] = []
    const cols = 4
    const rows = 3
    const cellW = w / cols
    const cellH = h / rows

    const nebulae: NebulaWisp[] = Array.from({ length: 12 }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = col * cellW + cellW / 2
      const cy = row * cellH + cellH / 2
      const jx = (Math.random() - 0.5) * cellW * 0.8
      const jy = (Math.random() - 0.5) * cellH * 0.8

      return {
        x: cx + jx,
        y: cy + jy,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      radius: 120 + Math.random() * 150,
      alpha: 0.015 + Math.random() * 0.02,
      hue: [260, 220, 280, 200, 310, 190][Math.floor(Math.random() * 6)],
      scaleX: 0.5 + Math.random() * 1.5,
      scaleY: 0.5 + Math.random() * 1.5,
      rotation: Math.random() * Math.PI * 2,
      }
    })

    function spawnStreak() {
      const angle = (Math.random() - 0.5) * 0.8
      const speed = 7 + Math.random() * 8
      streaks.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.75,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: Math.sin(angle) * speed * 0.3,
        life: 0,
        maxLife: 10 + Math.random() * 8,
        alpha: 0.65 + Math.random() * 0.3,
      })
    }

    const shootingStars: ShootingStar[] = []

    function spawnShootingStar() {
      const fromLeft = Math.random() > 0.5
      shootingStars.push({
        x: fromLeft ? Math.random() * w * 0.5 : w * 0.5 + Math.random() * w * 0.5,
        y: Math.random() * h * 0.4,
        vx: (fromLeft ? 1 : -1) * (3 + Math.random() * 4),
        vy: 2 + Math.random() * 3,
        length: 40 + Math.random() * 60,
        alpha: 1,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      })
    }

    function starColor(hue: Star['hue'], alpha: number): string {
      switch (hue) {
        case 'blue':
          return `rgba(138, 173, 244, ${alpha})`
        case 'pink':
          return `rgba(245, 194, 231, ${alpha})`
        case 'lavender':
          return `rgba(183, 189, 248, ${alpha})`
        default:
          return `rgba(202, 211, 245, ${alpha})`
      }
    }

    function drawCross(cx: number, cy: number, size: number, color: string) {
      ctx.fillStyle = color
      ctx.strokeStyle = color
      ctx.lineWidth = size * 0.35
      ctx.beginPath()
      ctx.moveTo(cx, cy - size * 1.8)
      ctx.lineTo(cx, cy + size * 1.8)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - size * 1.8, cy)
      ctx.lineTo(cx + size * 1.8, cy)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }

    function drawBurst(cx: number, cy: number, size: number, color: string, frm: number) {
      const spikes = 6
      const outerR = size * 2.5
      const innerR = size * 0.8
      const rotation = frm * 0.003
      ctx.fillStyle = color
      ctx.beginPath()
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes + rotation
        const r = i % 2 === 0 ? outerR : innerR
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
    }

    let frame = 0
    let shootTimer = 0
    let streakTimer = 0

    function animate() {
      ctx.clearRect(0, 0, w, h)
      frame++
      shootTimer++
      streakTimer++

      if (shootTimer > 120 + Math.random() * 120) {
        spawnShootingStar()
        shootTimer = 0
      }

      if (streakTimer > 20 + Math.random() * 30) {
        spawnStreak()
        streakTimer = 0
      }

      for (const neb of nebulae) {
        neb.x += neb.vx
        neb.y += neb.vy
        neb.rotation += 0.0005
        if (neb.x < -neb.radius * 2) neb.x = w + neb.radius * 2
        if (neb.x > w + neb.radius * 2) neb.x = -neb.radius * 2
        if (neb.y < -neb.radius * 2) neb.y = h + neb.radius * 2
        if (neb.y > h + neb.radius * 2) neb.y = -neb.radius * 2
        
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        ctx.translate(neb.x, neb.y)
        ctx.rotate(neb.rotation)
        ctx.scale(neb.scaleX, neb.scaleY)

        const ng = ctx.createRadialGradient(0, 0, 0, 0, 0, neb.radius)
        ng.addColorStop(0, `hsla(${neb.hue}, 100%, 85%, ${neb.alpha * 1.5})`)
        ng.addColorStop(0.4, `hsla(${neb.hue}, 80%, 60%, ${neb.alpha})`)
        ng.addColorStop(0.8, `hsla(${neb.hue + 15}, 60%, 40%, ${neb.alpha * 0.4})`)
        ng.addColorStop(1, `hsla(${neb.hue + 25}, 50%, 20%, 0)`)
        
        ctx.fillStyle = ng
        ctx.beginPath()
        ctx.arc(0, 0, neb.radius, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()
      }

      ctx.save()
      ctx.strokeStyle = 'rgba(183, 189, 248, 0.07)'
      ctx.lineWidth = 0.6
      for (const ln of constellationLines) {
        ctx.beginPath()
        ctx.moveTo(ln.x1, ln.y1)
        ctx.lineTo(ln.x2, ln.y2)
        ctx.stroke()
      }
      ctx.restore()

      for (const star of stars) {
        const twinkle = star.baseAlpha + (1 - star.baseAlpha) *
          (0.5 + 0.5 * Math.sin(frame * star.twinkleSpeed + star.twinkleOffset))
        const alpha = twinkle * 0.85
        const color = starColor(star.hue, alpha)

        if (star.type === 'cross') {
          drawCross(star.x, star.y, star.size, color)
        } else if (star.type === 'burst') {
          drawBurst(star.x, star.y, star.size, color, frame)
        } else {
          const gradient = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 2.5
          )
          gradient.addColorStop(0, starColor(star.hue, alpha))
          gradient.addColorStop(0.4, starColor(star.hue, alpha * 0.4))
          gradient.addColorStop(1, starColor(star.hue, 0))
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2)
          ctx.fill()
        }

        if (star.type !== 'dot') {
          star.pulseTimer++
          if (star.pulseTimer > 500 + Math.random() * 400 && pulseRings.length < 4) {
            pulseRings.push({ x: star.x, y: star.y, r: star.size * 2, maxR: star.size * 2 + 30, alpha: 0.15, color: starColor(star.hue, 1) })
            star.pulseTimer = 0
          }
        }
      }

      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const p = pulseRings[i]
        p.r += 0.35
        p.alpha -= 0.0025
        if (p.alpha <= 0) { pulseRings.splice(i, 1); continue }
        ctx.strokeStyle = p.color.replace(/[\.\d]+\)$/, `${p.alpha.toFixed(3)})`)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      for (let i = streaks.length - 1; i >= 0; i--) {
        const sk = streaks[i]
        sk.life++
        sk.alpha = (1 - sk.life / sk.maxLife) * 0.75
        if (sk.alpha <= 0) { streaks.splice(i, 1); continue }
        const tx = sk.x - sk.vx * 0.5
        const ty = sk.y - sk.vy * 0.5
        const sg = ctx.createLinearGradient(tx, ty, sk.x, sk.y)
        sg.addColorStop(0, `rgba(183, 189, 248, 0)`)
        sg.addColorStop(1, `rgba(255, 255, 255, ${sk.alpha})`)
        ctx.strokeStyle = sg
        ctx.lineWidth = 0.8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(sk.x, sk.y)
        ctx.stroke()
        sk.x += sk.vx
        sk.y += sk.vy
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i]
        s.x += s.vx
        s.y += s.vy
        s.life++
        s.alpha = Math.max(0, 1 - s.life / s.maxLife)

        if (s.alpha <= 0 || s.x < -100 || s.x > w + 100 || s.y > h + 100) {
          shootingStars.splice(i, 1)
          continue
        }

        const tailX = s.x - s.vx * (s.length / Math.sqrt(s.vx * s.vx + s.vy * s.vy))
        const tailY = s.y - s.vy * (s.length / Math.sqrt(s.vx * s.vx + s.vy * s.vy))

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
        grad.addColorStop(0, `rgba(202, 211, 245, 0)`)
        grad.addColorStop(0.6, `rgba(202, 211, 245, ${s.alpha * 0.3})`)
        grad.addColorStop(1, `rgba(255, 255, 255, ${s.alpha * 0.9})`)

        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(s.x, s.y)
        ctx.stroke()

        const headGlow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4)
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${s.alpha * 0.8})`)
        headGlow.addColorStop(1, `rgba(138, 173, 244, 0)`)
        ctx.fillStyle = headGlow
        ctx.beginPath()
        ctx.arc(s.x, s.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    cancelAnimationFrame(animRef.current)
    animate()
  }, [])

  useEffect(() => {
    init()
    const handleResize = () => init()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animRef.current)
    }
  }, [init])

  return <canvas ref={canvasRef} className="star-canvas" />
}


export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token)
      navigate('/admin', { replace: true })
    }
  }, [navigate, searchParams])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    if (code) {
      toast.error('Authentication failed', { duration: 4000 })
    } else if (error === 'unauthorized') {
      toast.error('Access denied. Your Discord account is not whitelisted.', {
        duration: 5000,
      })
    } else if (error === 'discord_error') {
      toast.error('Authentication failed', {
        duration: 4000,
      })
    } else if (error === 'missing_code') {
      toast.error('Authentication was cancelled.', { duration: 3000 })
    }
  }, [searchParams])

  const handleLogin = () => {
    window.location.href = '/api/auth/discord'
  }

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-loading">
          <div className="loading-brand">
            <img src="/favicon.svg" alt="Loading..." width={48} height={48} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <StarField />

      <div className="horizon-glow" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <img src="/favicon.svg" alt="Cloudy" width={28} height={28} />
          </div>
          <h1 className="login-title">Cloudy Admin</h1>
          <p className="login-subtitle">Artist Portfolio CMS</p>
        </div>

        <div className="login-divider" />

        <div className="login-body">
          <p className="login-description">
            Sign in with your Discord account to manage your portfolio content.
          </p>

          <button
            className="login-discord-btn"
            onClick={handleLogin}
            type="button"
          >
            <DiscordLogoIcon size={20} weight="fill" />
            <span>Continue with Discord</span>
          </button>
        </div>

        <p className="login-footer">
          Access restricted to whitelisted accounts only.
        </p>
      </div>
    </div>
  )
}
