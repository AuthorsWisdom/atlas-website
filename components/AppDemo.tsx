'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────

interface QuoteData {
  symbol: string
  price: number | null
  change_percent: number | null
  conviction: number
  tier: string
  factors: string[]
  squeeze_score: number
  options_flow_score: number
  macro_score: number
  regime: string
  vix: number | null
}

interface MacroData {
  fed_rate: number
  yield_10y: number
  yield_2y: number
  vix: number
  dxy: number
  unemployment: number
  risk_on_score: number
  regime: string
  credit_spread: number
  cpi: number
}

// ─── Helpers ─────────────────────────────────────────────────────

function tierColor(c: number): string {
  if (c >= 80) return '#4ade80'
  if (c >= 60) return '#22d3ee'
  if (c >= 40) return '#fbbf24'
  if (c >= 20) return '#fb923c'
  return '#6b7280'
}

// ─── Mini Conviction Ring ────────────────────────────────────────

function MiniRing({ score, size = 44 }: { score: number; size?: number }) {
  const stroke = 3
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const color = tierColor(score)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ - (score/100)*circ}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: size < 50 ? '11px' : '14px', fontWeight: 700, color,
      }}>{score}</span>
    </div>
  )
}

// ─── Large Ring (Macro) ──────────────────────────────────────────

function LargeRing({ score, label }: { score: number; label: string }) {
  const size = 120, stroke = 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const color = tierColor(score)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={circ - (score/100)*circ}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#555', marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#666', letterSpacing: '0.1em', marginTop: 8 }}>{label}</span>
    </div>
  )
}

// ─── Tab Icons (inline SVG) ──────────────────────────────────────

const icons = {
  scanner: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4ade80' : '#555'} strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  macro: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4ade80' : '#555'} strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 20h18"/><path d="M6 16V10"/><path d="M10 16V6"/><path d="M14 16V12"/><path d="M18 16V8"/>
    </svg>
  ),
  watchlist: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4ade80' : '#555'} strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  settings: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4ade80' : '#555'} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.3-6.7-1.4 1.4M5.7 18.3l-1.4 1.4m0-13.4 1.4 1.4m12.6 12.6 1.4 1.4"/>
    </svg>
  ),
}

type Tab = 'scanner' | 'macro' | 'watchlist' | 'settings'

const SCANNER_TICKERS = ['GME', 'NVDA', 'SPY']
const WATCHLIST_TICKERS = ['NVDA', 'AMD', 'META', 'SPY']

// ─── Scanner Tab ─────────────────────────────────────────────────

function ScannerTab({ data }: { data: Record<string, QuoteData> }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div style={{ padding: '16px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>SCANNER</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', padding: '3px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>LIVE</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SCANNER_TICKERS.map(sym => {
          const d = data[sym]
          const isExpanded = expanded === sym
          return (
            <div key={sym} onClick={() => setExpanded(isExpanded ? null : sym)}
              style={{
                background: '#111', borderRadius: 10, padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                transition: 'border-color 0.15s',
                borderColor: isExpanded ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <MiniRing score={d?.conviction ?? 0} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#f0ede6', letterSpacing: '0.06em' }}>{sym}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#f0ede6' }}>
                      {d?.price != null ? `$${d.price.toFixed(2)}` : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {d?.squeeze_score != null && d.squeeze_score > 0.5 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', padding: '2px 5px', borderRadius: 3, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>SQUEEZE</span>
                      )}
                    </div>
                    {d?.change_percent != null && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: d.change_percent >= 0 ? '#4ade80' : '#f87171' }}>
                        {d.change_percent >= 0 ? '+' : ''}{d.change_percent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded && d && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { l: 'Squeeze', v: d.squeeze_score * 100 },
                    { l: 'Options Flow', v: d.options_flow_score * 100 },
                    { l: 'Macro', v: d.macro_score },
                  ].map(b => (
                    <div key={b.l} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#666' }}>{b.l.toUpperCase()}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#aaa' }}>{b.v.toFixed(0)}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: '#4ade80', width: `${Math.min(b.v, 100)}%`, transition: 'width 0.6s ease-out' }} />
                      </div>
                    </div>
                  ))}
                  {d.factors.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {d.factors.map((f, i) => (
                        <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', padding: '2px 5px', borderRadius: 3, background: '#1a1a1a', color: '#888', border: '1px solid rgba(255,255,255,0.06)' }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Macro Tab ───────────────────────────────────────────────────

function MacroTab({ macro }: { macro: MacroData | null }) {
  if (!macro) return <div style={{ padding: 40, textAlign: 'center', color: '#555', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Loading macro data...</div>
  const indicators = [
    { label: 'Fed Funds', value: `${macro.fed_rate.toFixed(2)}%` },
    { label: 'VIX', value: macro.vix.toFixed(1) },
    { label: '10Y Yield', value: `${macro.yield_10y.toFixed(2)}%` },
    { label: 'DXY', value: macro.dxy.toFixed(2) },
    { label: 'Unemployment', value: `${macro.unemployment.toFixed(1)}%` },
    { label: 'Credit Spread', value: `${macro.credit_spread.toFixed(2)}%` },
  ]
  return (
    <div style={{ padding: '16px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>MACRO</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', padding: '3px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>LIVE</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <LargeRing score={macro.risk_on_score} label="RISK SCORE" />
        <span style={{
          marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
          padding: '4px 12px', borderRadius: 6, letterSpacing: '0.08em',
          background: macro.regime === 'Risk-On' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          color: macro.regime === 'Risk-On' ? '#4ade80' : '#f87171',
          border: `1px solid ${macro.regime === 'Risk-On' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
        }}>{macro.regime.toUpperCase()}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {indicators.map(ind => (
          <div key={ind.label} style={{ background: '#111', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#555', letterSpacing: '0.1em', marginBottom: 4 }}>{ind.label.toUpperCase()}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: '#f0ede6' }}>{ind.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Watchlist Tab ───────────────────────────────────────────────

function WatchlistTab({ data }: { data: Record<string, QuoteData> }) {
  const [showAI, setShowAI] = useState(false)
  return (
    <div style={{ padding: '16px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>WATCHLIST</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#555' }}>4 / 50</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {WATCHLIST_TICKERS.map(sym => {
          const d = data[sym]
          return (
            <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <MiniRing score={d?.conviction ?? 0} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#f0ede6', letterSpacing: '0.06em' }}>{sym}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#f0ede6' }}>
                    {d?.price != null ? `$${d.price.toFixed(2)}` : '—'}
                  </span>
                </div>
                {d?.change_percent != null && (
                  <div style={{ textAlign: 'right', marginTop: 1 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: d.change_percent >= 0 ? '#4ade80' : '#f87171' }}>
                      {d.change_percent >= 0 ? '+' : ''}{d.change_percent.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <div style={{ width: 32, height: 18, borderRadius: 9, background: 'rgba(74,222,128,0.15)', position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4ade80', position: 'absolute', top: 2, right: 2 }} />
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={() => setShowAI(true)} style={{
        width: '100%', marginTop: 14, padding: '10px', borderRadius: 8,
        background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
        color: '#a855f7', fontFamily: 'var(--font-mono)', fontSize: '11px',
        fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em',
      }}>
        AI Portfolio Analysis
      </button>

      {showAI && (
        <div style={{
          marginTop: 10, background: '#111', borderRadius: 10, padding: 14,
          border: '1px solid rgba(168,85,247,0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#a855f7', letterSpacing: '0.1em' }}>AI ANALYSIS</span>
            <button onClick={() => setShowAI(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 }}>x</button>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#aaa', lineHeight: 1.7 }}>
            Portfolio is tech-heavy with moderate conviction. NVDA showing strongest setup with elevated options flow. SPY macro context is risk-off — consider defensive positioning. GME squeeze indicators are inactive. Recommend reducing concentration risk.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#444', marginTop: 8 }}>Demo analysis — upgrade to Pro for live AI insights</p>
        </div>
      )}
    </div>
  )
}

// ─── Settings Tab ────────────────────────────────────────────────

function SettingsTab({ profile, onManage }: { profile?: { is_pro: boolean; subscription_source: string; stripe_customer_id: string | null } | null; onManage?: () => void }) {
  const isPro = profile?.is_pro ?? false
  const source = profile?.subscription_source ?? 'none'

  return (
    <div style={{ padding: '16px 14px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em', display: 'block', marginBottom: 16 }}>SETTINGS</span>

      {/* Subscription */}
      <div style={{ background: '#111', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>SUBSCRIPTION</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#f0ede6' }}>Status</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: isPro ? '#4ade80' : '#888' }}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>
        {isPro && source === 'stripe' && onManage && (
          <button onClick={onManage} style={{
            width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#aaa', fontFamily: 'var(--font-mono)',
            fontSize: '10px', cursor: 'pointer', marginTop: 4,
          }}>
            Manage subscription
          </button>
        )}
        {isPro && source === 'apple' && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#666', marginTop: 4 }}>
            Manage in iPhone Settings → Subscriptions
          </p>
        )}
        {!isPro && (
          <a href="/#pricing" style={{
            display: 'block', textAlign: 'center', padding: 8, borderRadius: 6,
            background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)',
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
            textDecoration: 'none', marginTop: 4,
          }}>
            Upgrade to Pro
          </a>
        )}
      </div>

      {/* API Keys */}
      <div style={{ background: '#111', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>API KEYS</div>
        {['Anthropic (Claude)', 'OpenAI', 'Polygon.io'].map(k => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#aaa' }}>{k}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#333' }}>sk-•••••••</span>
          </div>
        ))}
      </div>

      {/* Legal */}
      <div style={{ background: '#111', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>LEGAL</div>
        {['Privacy Policy', 'Terms of Service'].map(l => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#aaa' }}>{l}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#333' }}>›</span>
          </div>
        ))}
      </div>

      {!profile && (
        <a href="#waitlist" style={{
          display: 'block', textAlign: 'center', padding: '10px',
          borderRadius: 8, background: '#4ade80', color: '#052e16',
          fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700,
          textDecoration: 'none', letterSpacing: '0.04em',
        }}>
          Sign up to save your settings
        </a>
      )}
    </div>
  )
}

// ─── Shared App Content (used by both marketing demo and PWA /app) ──

export function AppContent({ fullscreen = false }: { fullscreen?: boolean }) {
  const [tab, setTab] = useState<Tab>('scanner')
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [macro, setMacro] = useState<MacroData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const allSymbols = [...new Set([...SCANNER_TICKERS, ...WATCHLIST_TICKERS])]

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      allSymbols.map(s =>
        fetch(`/api/demo/${s}`).then(r => r.ok ? r.json() : null)
      )
    )
    const map: Record<string, QuoteData> = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) map[allSymbols[i]] = r.value
    })
    setQuotes(map)
    setLastUpdated(new Date())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchAll()
    fetch('/api/demo/macro').then(r => r.ok ? r.json() : null).then(d => { if (d) setMacro(d) }).catch(() => {})
  }, [fetchAll])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'scanner', label: 'Scanner' },
    { id: 'macro', label: 'Macro' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{
      background: '#080808',
      width: '100%',
      height: fullscreen ? '100dvh' : '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: fullscreen ? 0 : 'inherit',
    }}>
      {/* Status bar — only in phone frame mode */}
      {!fullscreen && (
        <div style={{
          padding: '8px 20px 6px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#888' }}>9:41</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 14, height: 10, border: '1px solid #555', borderRadius: 2, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 1, background: '#4ade80', borderRadius: 1 }} />
            </div>
          </div>
        </div>
      )}

      {/* Offline / last updated indicator */}
      {fullscreen && lastUpdated && (
        <div style={{
          padding: '4px 16px', background: '#0a0a0a',
          display: 'flex', justifyContent: 'center', flexShrink: 0,
          paddingTop: 'env(safe-area-inset-top, 12px)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#444' }}>
            Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'scanner' && <ScannerTab data={quotes} />}
        {tab === 'macro' && <MacroTab macro={macro} />}
        {tab === 'watchlist' && <WatchlistTab data={quotes} />}
        {tab === 'settings' && <SettingsTab profile={null} />}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0 12px',
        paddingBottom: fullscreen ? 'max(12px, env(safe-area-inset-bottom))' : '12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#0a0a0a',
        flexShrink: 0,
      }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
            }}>
              {icons[t.id](active)}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px',
                color: active ? '#4ade80' : '#555',
                letterSpacing: '0.04em',
              }}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Home indicator — only in phone frame mode */}
      {!fullscreen && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6, flexShrink: 0 }}>
          <div style={{ width: 100, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>
      )}
    </div>
  )
}

// ─── Main AppDemo Component (marketing site with phone frame) ────

export default function AppDemo() {

  return (
    <section style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '5rem 2rem',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ marginBottom: '3rem' }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          textTransform: 'uppercase', letterSpacing: '0.14em',
          color: 'var(--green)', marginBottom: '1rem',
        }}>
          Interactive demo
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          fontWeight: 700, letterSpacing: '-0.02em',
          color: 'var(--text)', marginBottom: '1rem', lineHeight: 1.15,
        }}>
          The full experience.<br />Right in your browser.
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.7 }}>
          Explore every tab with live data. This is exactly what XAtlas looks like on your iPhone.
        </p>
      </div>

      {/* Phone frame — desktop */}
      <div className="app-demo-phone" style={{
        margin: '0 auto',
        maxWidth: '390px',
        position: 'relative',
      }}>
        {/* Outer frame */}
        <div className="app-demo-frame" style={{
          borderRadius: '48px',
          border: '6px solid #2a2a2a',
          background: '#1a1a1a',
          padding: '4px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 30px 60px rgba(0,0,0,0.5), 0 0 0 12px #111',
        }}>
          {/* Dynamic island */}
          <div style={{
            position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
            width: '100px', height: '28px', background: '#000', borderRadius: '20px', zIndex: 10,
          }} />
          {/* Screen */}
          <div style={{
            borderRadius: '42px',
            overflow: 'hidden',
            height: '780px',
          }}>
            <AppContent />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .app-demo-frame {
            border-radius: 0 !important;
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .app-demo-phone {
            max-width: 100% !important;
            margin: 0 -2rem !important;
          }
          .app-demo-frame > div:last-child {
            border-radius: 0 !important;
            height: 600px !important;
          }
          .app-demo-frame > div:first-child {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
