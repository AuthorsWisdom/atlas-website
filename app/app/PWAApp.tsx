'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthContext'
import AuthModal from '@/components/AuthModal'

// Re-export types and helpers from AppDemo that we need
// We'll build a standalone PWA version that uses auth

const SCANNER_TICKERS = ['GME', 'NVDA', 'SPY']
const WATCHLIST_TICKERS = ['NVDA', 'AMD', 'META', 'SPY']

interface QuoteData {
  symbol: string
  price: number | null
  change_percent: number | null
  conviction: number
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
}

export default function PWAApp() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [tab, setTab] = useState<'scanner' | 'macro' | 'watchlist' | 'settings'>('scanner')
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [macro, setMacro] = useState<MacroData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const allSymbols = [...new Set([...SCANNER_TICKERS, ...WATCHLIST_TICKERS])]

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      allSymbols.map(s => fetch(`/api/demo/${s}`).then(r => r.ok ? r.json() : null))
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

  const isPro = profile?.is_pro ?? false

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id) return
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: profile.stripe_customer_id }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      console.error('Portal error:', err)
    }
  }

  // Show login prompt if checking subscribed param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true' && !user) {
      setShowAuth(true)
    }
  }, [user])

  const mono = "'JetBrains Mono', monospace"

  if (authLoading) {
    return (
      <div style={{ background: '#080808', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: mono, fontSize: 12, color: '#555' }}>Loading...</span>
      </div>
    )
  }

  return (
    <div style={{ background: '#080808', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}

      {/* Top bar */}
      <div style={{
        padding: '4px 16px', background: '#0a0a0a', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        paddingTop: 'env(safe-area-inset-top, 12px)',
      }}>
        <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.15em' }}>XATLAS</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {lastUpdated && (
            <span style={{ fontFamily: mono, fontSize: 8, color: '#444' }}>
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {user ? (
            <button onClick={signOut} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4, padding: '3px 8px', color: '#666',
              fontFamily: mono, fontSize: 9, cursor: 'pointer',
            }}>Sign out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 4, padding: '3px 8px', color: '#4ade80',
              fontFamily: mono, fontSize: 9, cursor: 'pointer',
            }}>Sign in</button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'scanner' && (
          <div style={{ padding: '16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>SCANNER</span>
              <span style={{ fontFamily: mono, fontSize: 9, padding: '3px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>LIVE</span>
            </div>
            {SCANNER_TICKERS.map(sym => {
              const d = quotes[sym]
              return (
                <div key={sym} style={{ background: '#111', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: tierColor(d?.conviction ?? 0) }}>{d?.conviction ?? '—'}</span>
                      <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#f0ede6', letterSpacing: '0.06em' }}>{sym}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: mono, fontSize: 12, color: '#f0ede6' }}>{d?.price != null ? `$${d.price.toFixed(2)}` : '—'}</div>
                      {d?.change_percent != null && (
                        <div style={{ fontFamily: mono, fontSize: 9, color: d.change_percent >= 0 ? '#4ade80' : '#f87171' }}>
                          {d.change_percent >= 0 ? '+' : ''}{d.change_percent.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Blur breakdown for free users */}
                  {!isPro && (
                    <div style={{ marginTop: 8, position: 'relative' }}>
                      <div style={{ filter: 'blur(4px)', opacity: 0.4 }}>
                        {['Squeeze', 'Options Flow', 'Macro'].map(l => (
                          <div key={l} style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
                        ))}
                      </div>
                      <a href="/#pricing" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 9, color: '#4ade80', textDecoration: 'none' }}>
                        Upgrade to Pro
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'macro' && (
          <div style={{ padding: '16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>MACRO</span>
              <span style={{ fontFamily: mono, fontSize: 9, padding: '3px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>LIVE</span>
            </div>
            {macro ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span style={{ fontFamily: mono, fontSize: 48, fontWeight: 700, color: tierColor(macro.risk_on_score) }}>{macro.risk_on_score}</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: '#555', display: 'block' }}>RISK SCORE / 100</span>
                  <span style={{
                    display: 'inline-block', marginTop: 8, fontFamily: mono, fontSize: 11, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 6, letterSpacing: '0.08em',
                    background: macro.regime === 'Risk-On' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                    color: macro.regime === 'Risk-On' ? '#4ade80' : '#f87171',
                    border: `1px solid ${macro.regime === 'Risk-On' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                  }}>{macro.regime.toUpperCase()}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {[
                    { label: 'Fed Funds', value: `${macro.fed_rate.toFixed(2)}%` },
                    { label: 'VIX', value: macro.vix.toFixed(1) },
                    { label: '10Y Yield', value: `${macro.yield_10y.toFixed(2)}%` },
                    { label: 'DXY', value: macro.dxy.toFixed(2) },
                    { label: 'Unemployment', value: `${macro.unemployment.toFixed(1)}%` },
                    { label: 'Credit Spread', value: `${macro.credit_spread.toFixed(2)}%` },
                  ].map(ind => (
                    <div key={ind.label} style={{ background: '#111', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily: mono, fontSize: 8, color: '#555', letterSpacing: '0.1em', marginBottom: 4 }}>{ind.label.toUpperCase()}</div>
                      <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, color: '#f0ede6' }}>{ind.value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#555', fontFamily: mono, fontSize: 12 }}>Loading...</div>
            )}
          </div>
        )}

        {tab === 'watchlist' && (
          <div style={{ padding: '16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>WATCHLIST</span>
              <span style={{ fontFamily: mono, fontSize: 9, color: '#555' }}>{isPro ? '4 / 50' : '3 / 3'}</span>
            </div>
            {WATCHLIST_TICKERS.slice(0, isPro ? 4 : 3).map(sym => {
              const d = quotes[sym]
              return (
                <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
                  <span style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: tierColor(d?.conviction ?? 0), width: 28 }}>{d?.conviction ?? '—'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: '#f0ede6' }}>{sym}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, color: '#f0ede6' }}>{d?.price != null ? `$${d.price.toFixed(2)}` : '—'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {!isPro && (
              <a href="/#pricing" style={{
                display: 'block', textAlign: 'center', padding: 10, borderRadius: 8, marginTop: 8,
                background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)',
                color: '#4ade80', fontFamily: mono, fontSize: 10, fontWeight: 600, textDecoration: 'none',
              }}>
                Upgrade to Pro for unlimited symbols
              </a>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ padding: '16px 14px' }}>
            <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em', display: 'block', marginBottom: 16 }}>SETTINGS</span>

            {user ? (
              <>
                <div style={{ background: '#111', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>ACCOUNT</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: '#aaa' }}>{user.email}</div>
                </div>

                <div style={{ background: '#111', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>SUBSCRIPTION</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: mono, fontSize: 12, color: '#f0ede6' }}>Status</span>
                    <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: isPro ? '#4ade80' : '#888' }}>{isPro ? 'PRO' : 'FREE'}</span>
                  </div>
                  {isPro && profile?.subscription_source === 'stripe' && (
                    <button onClick={handleManageSubscription} style={{
                      width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: '#aaa', fontFamily: mono, fontSize: 10, cursor: 'pointer', marginTop: 4,
                    }}>Manage subscription</button>
                  )}
                  {isPro && profile?.subscription_source === 'apple' && (
                    <p style={{ fontFamily: mono, fontSize: 10, color: '#666', marginTop: 4 }}>Manage in iPhone Settings → Subscriptions</p>
                  )}
                  {!isPro && (
                    <a href="/#pricing" style={{
                      display: 'block', textAlign: 'center', padding: 8, borderRadius: 6, marginTop: 4,
                      background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)',
                      fontFamily: mono, fontSize: 10, fontWeight: 600, textDecoration: 'none',
                    }}>Upgrade to Pro</a>
                  )}
                </div>
              </>
            ) : (
              <div style={{ background: '#111', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }}>
                <p style={{ fontFamily: mono, fontSize: 11, color: '#888', marginBottom: 10 }}>Sign in to access your subscription and settings.</p>
                <button onClick={() => setShowAuth(true)} style={{
                  width: '100%', padding: 10, borderRadius: 8, border: 'none',
                  background: '#4ade80', color: '#052e16', fontFamily: mono,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>Sign in</button>
              </div>
            )}

            <div style={{ background: '#111', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>LEGAL</div>
              {[
                { label: 'Privacy Policy', href: 'https://www.iubenda.com/privacy-policy/19345970' },
                { label: 'Terms of Service', href: 'https://www.iubenda.com/terms-and-conditions/19345970' },
              ].map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, textDecoration: 'none' }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: '#aaa' }}>{l.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: '#333' }}>›</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', flexShrink: 0,
      }}>
        {([
          { id: 'scanner' as const, label: 'Scanner', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
          { id: 'macro' as const, label: 'Macro', icon: 'M3 20h18M6 16V10M10 16V6M14 16V12M18 16V8' },
          { id: 'watchlist' as const, label: 'Watchlist', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
          { id: 'settings' as const, label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
        ]).map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px',
            }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={active ? '#4ade80' : '#555'} strokeWidth={1.8} strokeLinecap="round">
                <path d={t.icon} />
              </svg>
              <span style={{ fontFamily: mono, fontSize: 9, color: active ? '#4ade80' : '#555', letterSpacing: '0.04em' }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function tierColor(c: number): string {
  if (c >= 80) return '#4ade80'
  if (c >= 60) return '#22d3ee'
  if (c >= 40) return '#fbbf24'
  if (c >= 20) return '#fb923c'
  return '#6b7280'
}
