'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Hero() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist')
      .then(r => r.json())
      .then(d => { if (d.count > 0) setCount(d.count) })
      .catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!email || !email.includes('@')) return
    setLoading(true)
    setError('')
    try {
      // Send waitlist emails via existing API
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // Also create a Supabase account with magic link
      // This converts waitlist signups directly into app users
      await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://xatlas.io/app',
        },
      })

      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
        setEmail('')
        if (data.count > 0) setCount(data.count)
      } else {
        setError(data.error || 'Something went wrong — try again')
      }
    } catch {
      setError('Something went wrong — try again')
    }
    setLoading(false)
  }

  return (
    <section style={{
      position: 'relative',
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '7rem 2rem 6rem',
    }}>

      {/* Grid background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: '40%',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>

        {/* Badge */}
        <div className="animate-fade-up delay-1" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          border: '1px solid var(--border-2)',
          borderRadius: '99px',
          padding: '5px 14px',
          color: 'var(--text-2)',
          letterSpacing: '0.08em',
          marginBottom: '2rem',
          background: 'var(--bg-1)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--green)',
            display: 'inline-block',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          EARLY ACCESS — LIMITED SPOTS
        </div>

        {/* Headline */}
        <div className="animate-fade-up delay-2" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.6rem, 6vw, 5rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: '1.5rem',
          maxWidth: '760px',
        }}>
          <div style={{ color: 'var(--text)', lineHeight: 1.3, paddingBottom: '0.1em' }}>
            Institutional
          </div>
          <div style={{ color: 'var(--green)', lineHeight: 1.3, paddingBottom: '0.25em' }}>
            intelligence.
          </div>
          <div style={{ color: 'var(--text)', lineHeight: 1.3, paddingBottom: '0.1em' }}>
            Your iPhone.
          </div>
        </div>

        {/* Subheadline */}
        <p className="animate-fade-up delay-3" style={{
          fontSize: '1.1rem',
          color: 'var(--text-2)',
          maxWidth: '500px',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
          fontWeight: 400,
        }}>
          Real-time market scanning, macro regime detection, and AI-powered conviction scoring —
          the edge previously reserved for the pros.
        </p>

        {/* Waitlist form */}
        <div id="waitlist" className="animate-fade-up delay-4" style={{ marginBottom: '1rem' }}>
          {submitted ? (
            <div style={{
              maxWidth: '440px',
              padding: '16px 20px',
              borderRadius: '8px',
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                color: 'var(--green)',
                fontWeight: 600,
                marginBottom: '4px',
              }}>
                You&apos;re on the list.
              </p>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-2)',
              }}>
                We&apos;ll notify you at launch.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', maxWidth: '440px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="your@email.com"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid var(--border-2)',
                    borderRadius: '8px',
                    background: 'var(--bg-1)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-display)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    opacity: loading ? 0.6 : 1,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: '12px 22px',
                    background: 'var(--green)',
                    color: '#052e16',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-display)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Joining...' : 'Get early access'}
                </button>
              </div>
              {error && (
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#ef4444',
                  marginTop: '8px',
                }}>
                  {error}
                </p>
              )}
            </>
          )}
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-3)',
            marginTop: '10px',
          }}>
            {count && count > 0
              ? `Join ${count} trader${count === 1 ? '' : 's'} already waiting`
              : 'Be first to know when we launch'
            }
            {' · No spam · App Store launch notification only'}
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          marginTop: '4rem',
          borderTop: '1px solid var(--border)',
          paddingTop: '2rem',
          flexWrap: 'wrap',
        }}>
          {[
            { val: 'Real-time', label: 'Market data' },
            { val: '0–100',    label: 'Conviction score' },
            { val: 'FRED',     label: 'Macro engine' },
            { val: 'BYOK',     label: 'AI architecture' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: '1 1 140px',
              paddingRight: '2rem',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              marginRight: i < 3 ? '2rem' : 0,
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: '4px',
              }}>
                {s.val}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
