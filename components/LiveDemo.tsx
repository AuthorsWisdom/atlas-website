'use client'

import { useState, useEffect, useCallback } from 'react'

const QUICK_TICKERS = ['SPY', 'NVDA', 'GME', 'AAPL', 'TSLA']

interface DemoData {
  symbol: string
  price: number | null
  change_percent: number | null
  conviction: number
  tier: string
  factors: string[]
  squeeze_score: number
  options_flow_score: number
  macro_score: number
  gex_score: number
  regime: string
  vix: number | null
  gex_regime: string
  short_interest: number | null
}

function tierLabel(conviction: number): string {
  if (conviction >= 80) return 'HIGH CONVICTION'
  if (conviction >= 60) return 'MODERATE'
  if (conviction >= 40) return 'DEVELOPING'
  if (conviction >= 20) return 'WEAK'
  return 'NOISE'
}

function tierColor(conviction: number): string {
  if (conviction >= 80) return '#4ade80'
  if (conviction >= 60) return '#22d3ee'
  if (conviction >= 40) return '#fbbf24'
  if (conviction >= 20) return '#fb923c'
  return '#6b7280'
}

function ConvictionRing({ score, animated }: { score: number; animated: boolean }) {
  const size = 160
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = animated ? (score / 100) * circumference : 0
  const color = tierColor(score)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '2.5rem',
          fontWeight: 700, color, lineHeight: 1,
        }}>
          {score}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px',
          color: 'var(--text-3)', letterSpacing: '0.12em',
          marginTop: '4px',
        }}>
          / 100
        </span>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: '4px',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: 'var(--text-2)', letterSpacing: '0.06em',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: 'var(--text)',
        }}>
          {typeof value === 'number' ? value.toFixed(1) : '—'}
        </span>
      </div>
      <div style={{
        height: '4px', borderRadius: '2px',
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: '2px',
          background: 'var(--green)',
          width: `${pct}%`,
          transition: 'width 0.8s ease-out',
        }} />
      </div>
    </div>
  )
}

function Skeleton() {
  const size = 160, stroke = 8, radius = (size - stroke) / 2
  return (
    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', flexWrap: 'wrap', padding: '0' }}>
      {/* Ring outline skeleton */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 48, height: 32, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
          <div style={{ width: 24, height: 10, borderRadius: 3, background: 'rgba(255,255,255,0.03)', marginTop: 6 }} />
        </div>
      </div>
      {/* Bar skeletons */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        {['SQUEEZE', 'OPTIONS FLOW', 'GEX', 'MACRO'].map((label, i) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em' }}>{label}</span>
              <div style={{ width: 28, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.04)', animation: 'pulse-dot 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LiveDemo() {
  const [ticker, setTicker] = useState('SPY')
  const [input, setInput] = useState('SPY')
  const [data, setData] = useState<DemoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [animated, setAnimated] = useState(false)
  const cacheRef = useState(() => new Map<string, DemoData>())[0]

  const fetchDemo = useCallback(async (sym: string) => {
    const s = sym.toUpperCase().trim()
    if (!s) return
    setTicker(s)
    setInput(s)
    setError('')

    // Show cached data instantly if available
    const cached = cacheRef.get(s)
    if (cached) {
      setData(cached)
      setAnimated(false)
      requestAnimationFrame(() => setTimeout(() => setAnimated(true), 50))
    }

    setLoading(!cached)
    setAnimated(false)
    try {
      const res = await fetch(`/api/demo/${s}`)
      if (!res.ok) {
        if (!cached) {
          const body = await res.json().catch(() => ({}))
          setError(body.error || 'Failed to fetch data')
          setData(null)
        }
      } else {
        const d = await res.json()
        cacheRef.set(s, d)
        setData(d)
        requestAnimationFrame(() => setTimeout(() => setAnimated(true), 50))
      }
    } catch {
      if (!cached) {
        setError('Network error — try again')
        setData(null)
      }
    }
    setLoading(false)
  }, [cacheRef])

  // Prefetch all default tickers on mount, show SPY first
  useEffect(() => {
    fetchDemo('SPY')
    // Prefetch others in background
    QUICK_TICKERS.filter(t => t !== 'SPY').forEach(t => {
      fetch(`/api/demo/${t}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) cacheRef.set(t, d) })
        .catch(() => {})
    })
  }, [fetchDemo, cacheRef])

  return (
    <section id="demo" style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '5rem 2rem',
      borderTop: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          textTransform: 'uppercase', letterSpacing: '0.14em',
          color: 'var(--green)', marginBottom: '1rem',
        }}>
          See it live
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          fontWeight: 700, letterSpacing: '-0.02em',
          color: 'var(--text)', marginBottom: '1rem', lineHeight: 1.15,
        }}>
          Live conviction scores.<br />Right now.
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.7 }}>
          Try XAtlas on any ticker — no account required.
        </p>
      </div>

      {/* Ticker input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '360px', marginBottom: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && fetchDemo(input)}
            placeholder="Enter ticker..."
            maxLength={10}
            style={{
              flex: 1, padding: '10px 14px',
              border: '1px solid var(--border-2)', borderRadius: '8px',
              background: 'var(--bg-1)', color: 'var(--text)',
              fontSize: '14px', fontFamily: 'var(--font-mono)',
              fontWeight: 500, letterSpacing: '0.08em',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
          />
          <button
            onClick={() => fetchDemo(input)}
            disabled={loading}
            style={{
              padding: '10px 20px', background: 'var(--green)',
              color: '#052e16', border: 'none', borderRadius: '8px',
              fontSize: '13px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-mono)', transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '...' : 'Score'}
          </button>
        </div>

        {/* Quick select */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {QUICK_TICKERS.map(t => (
            <button
              key={t}
              onClick={() => fetchDemo(t)}
              disabled={loading}
              style={{
                padding: '5px 12px', borderRadius: '6px',
                fontSize: '12px', fontFamily: 'var(--font-mono)',
                fontWeight: 500, letterSpacing: '0.06em',
                background: ticker === t ? 'rgba(74,222,128,0.12)' : 'var(--bg-2)',
                color: ticker === t ? 'var(--green)' : 'var(--text-2)',
                border: ticker === t ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--border)',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Demo card */}
      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 3vw, 2.5rem)',
        maxWidth: '640px',
      }}>
        {loading && !data ? (
          <Skeleton />
        ) : error && !data ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem',
            color: 'var(--text-2)', fontFamily: 'var(--font-mono)',
            fontSize: '13px',
          }}>
            {error}
          </div>
        ) : data ? (
          <>
            {/* Symbol + price header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: '1.5rem',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '1.5rem',
                  fontWeight: 700, color: 'var(--text)',
                  letterSpacing: '0.1em',
                }}>
                  {data.symbol}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: 'var(--text-3)', letterSpacing: '0.1em',
                  marginTop: '2px',
                }}>
                  {tierLabel(data.conviction)}
                </div>
              </div>
              {data.price != null && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '1.25rem',
                    fontWeight: 500, color: 'var(--text)',
                  }}>
                    ${data.price.toFixed(2)}
                  </div>
                  {data.change_percent != null && (
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '12px',
                      color: data.change_percent >= 0 ? 'var(--green)' : 'var(--red)',
                    }}>
                      {data.change_percent >= 0 ? '+' : ''}{data.change_percent.toFixed(2)}%
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-block', padding: '4px 10px',
                borderRadius: '6px', fontSize: '10px',
                fontFamily: 'var(--font-mono)', fontWeight: 600,
                letterSpacing: '0.08em',
                background: data.regime === 'Risk-On'
                  ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                color: data.regime === 'Risk-On'
                  ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${data.regime === 'Risk-On'
                  ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
              }}>
                {data.regime?.toUpperCase() || 'UNKNOWN'}
              </span>
              {data.squeeze_score > 50 && (
                <span style={{
                  display: 'inline-block', padding: '4px 10px',
                  borderRadius: '6px', fontSize: '10px',
                  fontFamily: 'var(--font-mono)', fontWeight: 600,
                  letterSpacing: '0.08em',
                  background: 'rgba(251,191,36,0.1)',
                  color: '#fbbf24',
                  border: '1px solid rgba(251,191,36,0.25)',
                }}>
                  SQUEEZE DETECTED
                </span>
              )}
              {data.vix != null && (
                <span style={{
                  display: 'inline-block', padding: '4px 10px',
                  borderRadius: '6px', fontSize: '10px',
                  fontFamily: 'var(--font-mono)', fontWeight: 500,
                  letterSpacing: '0.08em',
                  background: 'var(--bg-2)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                }}>
                  VIX {data.vix.toFixed(1)}
                </span>
              )}
            </div>

            {/* Conviction ring + breakdown */}
            <div style={{
              display: 'flex', gap: '2.5rem', alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <div style={{ flexShrink: 0 }}>
                <ConvictionRing score={data.conviction} animated={animated} />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <ScoreBar label="SQUEEZE" value={data.squeeze_score * 100} max={100} />
                <ScoreBar label="OPTIONS FLOW" value={data.options_flow_score * 100} max={100} />
                <ScoreBar label="GEX" value={Math.abs(data.gex_score)} max={1000000000} />
                <ScoreBar label="MACRO" value={data.macro_score} max={100} />
              </div>
            </div>

            {/* Factors */}
            {data.factors.length > 0 && (
              <div style={{
                marginTop: '1.5rem', paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
              }}>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: 'var(--text-3)', letterSpacing: '0.1em',
                  marginBottom: '8px',
                }}>
                  SIGNAL FACTORS
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {data.factors.map((f, i) => (
                    <span key={i} style={{
                      padding: '3px 8px', borderRadius: '4px',
                      fontSize: '11px', fontFamily: 'var(--font-mono)',
                      background: 'var(--bg-2)', color: 'var(--text-2)',
                      border: '1px solid var(--border)',
                    }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Disclaimer */}
      <p style={{
        marginTop: '1.5rem', fontSize: '11px',
        color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
        maxWidth: '640px',
      }}>
        For demonstration purposes only. Not financial advice. Free tier data shown — Pro unlocks real-time quotes, full options flow, and GEX analysis.
      </p>
    </section>
  )
}
