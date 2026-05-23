import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Cloud, DiscordLogo } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './LoginPage.css'

/* ─── Star types for variety ─── */
type Star = {
  x: number
  y: number
  size: number
  baseAlpha: number
  twinkleSpeed: number
  twinkleOffset: number
  type: 'dot' | 'cross' | 'burst'
  hue: 'blue' | 'pink' | 'white' | 'lavender'
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

    /* Generate stars */
    const density = Math.max(80, Math.floor((w * h) / 4000))
    const stars: Star[] = []
    const hues: Star['hue'][] = ['blue', 'pink', 'white', 'lavender']

    for (let i = 0; i < density; i++) {
      const rand = Math.random()
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.2 + 0.6,
        baseAlpha: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.015 + 0.003,
        twinkleOffset: Math.random() * Math.PI * 2,
        type: rand < 0.12 ? 'burst' : rand < 0.3 ? 'cross' : 'dot',
        hue: hues[Math.floor(Math.random() * hues.length)],
      })
    }

    /* Shooting stars */
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

    /* Color map */
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

    /* Draw a 4-point cross star */
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
      /* Center glow */
      ctx.beginPath()
      ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2)
      ctx.fill()
    }

    /* Draw a starburst (6 spikes) */
    function drawBurst(cx: number, cy: number, size: number, color: string, frame: number) {
      const spikes = 6
      const outerR = size * 2.5
      const innerR = size * 0.8
      const rotation = frame * 0.003

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

    function animate() {
      ctx.clearRect(0, 0, w, h)
      frame++
      shootTimer++

      /* Spawn shooting star occasionally */
      if (shootTimer > 180 + Math.random() * 300) {
        spawnShootingStar()
        shootTimer = 0
      }

      /* Draw stars */
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
          /* Simple glowing dot */
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
      }

      /* Draw shooting stars */
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

        /* Head glow */
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

/* ─── Floating Cloud SVGs ─── */
function CloudLayer() {
  return (
    <div className="cloud-layer" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`floating-cloud cloud-${i}`}>
          <Cloud size={i <= 2 ? 120 : i <= 4 ? 80 : 60} weight="fill" />
        </div>
      ))}
    </div>
  )
}

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'unauthorized') {
      toast.error('Access denied. Your Discord account is not whitelisted.', {
        duration: 5000,
      })
    } else if (error === 'discord_error') {
      toast.error('Discord authentication failed. Please try again.', {
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
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <StarField />
      <CloudLayer />

      {/* Horizon glow */}
      <div className="horizon-glow" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Cloud size={28} weight="fill" />
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
            <DiscordLogo size={20} weight="fill" />
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
