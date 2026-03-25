'use client'

import { useEffect, useRef } from 'react'

function Confetti({ canvas }: { canvas: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    c.width = window.innerWidth
    c.height = window.innerHeight

    const colors = ['#4ade80', '#22d3ee', '#fbbf24', '#a855f7', '#f87171', '#f0ede6']
    const pieces: { x: number; y: number; w: number; h: number; color: string; vy: number; vx: number; rot: number; rv: number }[] = []

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * c.width,
        y: Math.random() * -c.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: Math.random() * 3 + 2,
        vx: (Math.random() - 0.5) * 2,
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.1,
      })
    }

    let frame: number
    function draw() {
      if (!ctx || !c) return
      ctx.clearRect(0, 0, c.width, c.height)
      let alive = false
      for (const p of pieces) {
        if (p.y < c.height + 20) alive = true
        p.y += p.vy
        p.x += p.vx
        p.rot += p.rv
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.8
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (alive) frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [canvas])
  return null
}

export default function SubscribedPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <main style={{
      background: '#080808', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
      <Confetti canvas={canvasRef} />

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '2rem', maxWidth: 480 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 1.5rem',
          background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          ✓
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800, color: '#f0ede6', marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
        }}>
          Welcome to XAtlas Pro
        </h1>

        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '14px',
          color: '#888', lineHeight: 1.7, marginBottom: '2rem',
        }}>
          Your subscription is active. Download the app or use XAtlas in your browser.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/app" style={{
            padding: '12px 28px', borderRadius: '8px',
            background: '#4ade80', color: '#052e16',
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            fontWeight: 700, textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}>
            Open XAtlas
          </a>
          <a href="/" style={{
            padding: '12px 28px', borderRadius: '8px',
            background: '#1a1a1a', color: '#888',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            fontWeight: 600, textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}>
            Back to home
          </a>
        </div>
      </div>
    </main>
  )
}
