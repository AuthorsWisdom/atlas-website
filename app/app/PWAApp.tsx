'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthContext'
import { getSupabase } from '@/lib/supabase-browser'
import AuthModal from '@/components/AuthModal'

const SCANNER_TICKERS = ['GME', 'NVDA', 'SPY', 'AAPL', 'TSLA', 'AMD']
const BACKEND = 'https://web-production-e9e4b.up.railway.app'
const FREE_WATCHLIST_LIMIT = 3

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

type Tab = 'scanner' | 'macro' | 'watchlist' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'scanner', label: 'Scanner', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'macro', label: 'Macro', icon: 'M3 20h18M6 16V10M10 16V6M14 16V12M18 16V8' },
  { id: 'watchlist', label: 'Watchlist', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
]

const mono = "'JetBrains Mono', monospace"

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return desktop
}

export default function PWAApp() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [tab, setTab] = useState<Tab>('scanner')
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [macro, setMacro] = useState<MacroData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [searchError, setSearchError] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const isDesktop = useIsDesktop()

  const isPro = profile?.is_pro ?? false
  const allSymbols = [...new Set([...SCANNER_TICKERS, ...watchlist])]

  // Fetch quotes for all known symbols
  const fetchQuotes = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return
    const results = await Promise.allSettled(
      symbols.map(s => fetch(`/api/demo/${s}`).then(r => r.ok ? r.json() : null))
    )
    const map: Record<string, QuoteData> = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) map[symbols[i]] = r.value
    })
    setQuotes(prev => ({ ...prev, ...map }))
    setLastUpdated(new Date())
  }, [])

  // Load watchlist from Supabase
  useEffect(() => {
    if (!user) { setWatchlist([]); return }
    getSupabase()
      .from('watchlist')
      .select('symbol')
      .eq('user_id', user.id)
      .order('created_at')
      .then(({ data }) => {
        if (data) setWatchlist(data.map((r: { symbol: string }) => r.symbol))
      }, () => {})
  }, [user])

  // Fetch quotes on mount + when watchlist changes
  useEffect(() => {
    const syms = [...new Set([...SCANNER_TICKERS, ...watchlist])]
    fetchQuotes(syms)
    fetch('/api/demo/macro').then(r => r.ok ? r.json() : null).then(d => { if (d) setMacro(d) }).catch(() => {})
  }, [fetchQuotes, watchlist])

  // Subscribed param check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscribed') === 'true' && !user) setShowAuth(true)
  }, [user])

  // Add ticker to watchlist
  async function addTicker() {
    const sym = searchInput.trim().toUpperCase()
    if (!sym) return
    setSearchError('')

    if (watchlist.includes(sym)) {
      setSearchError('Already in watchlist')
      return
    }
    if (!isPro && watchlist.length >= FREE_WATCHLIST_LIMIT) {
      setSearchError(`Free plan limited to ${FREE_WATCHLIST_LIMIT} symbols`)
      return
    }

    setSearchLoading(true)
    try {
      const res = await fetch(`${BACKEND}/quote/${sym}`)
      const data = await res.json()
      if (!res.ok || data.price == null) {
        setSearchError('Ticker not found')
        setSearchLoading(false)
        return
      }
      // Save to Supabase
      if (user) {
        await getSupabase().from('watchlist').insert({ user_id: user.id, symbol: sym })
      }
      setWatchlist(prev => [...prev, sym])
      setSearchInput('')
      // Fetch quote for new ticker
      fetchQuotes([sym])
    } catch {
      setSearchError('Failed to validate ticker')
    }
    setSearchLoading(false)
  }

  // Remove ticker from watchlist
  async function removeTicker(sym: string) {
    setWatchlist(prev => prev.filter(s => s !== sym))
    if (user) {
      await getSupabase().from('watchlist').delete().eq('user_id', user.id).eq('symbol', sym)
    }
  }

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

  // ── Shared styles ──
  const card: React.CSSProperties = {
    background: '#111', borderRadius: 10, padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8,
    transition: 'border-color 0.15s',
    cursor: isDesktop ? 'default' : undefined,
  }
  const cardHover = isDesktop ? {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' },
  } : {}

  const pad = isDesktop ? '24px 32px' : '16px 14px'

  // ── Render tab content ──
  function renderContent() {
    if (authLoading) {
      return (
        <div style={{ padding: pad }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ width: 80, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ width: 40, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                  <div style={{ width: 48, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
                </div>
                <div style={{ width: 60, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (!user && tab !== 'settings') {
      return (
        <div style={{ padding: '80px 14px', textAlign: 'center' }}>
          <div style={{ fontFamily: mono, fontSize: 28, color: '#4ade80', marginBottom: 16 }}>XATLAS</div>
          <p style={{ fontFamily: mono, fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
            Sign in to access real-time conviction scores,<br />macro data, and your watchlist.
          </p>
          <button onClick={() => setShowAuth(true)} style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            background: '#4ade80', color: '#052e16', fontFamily: mono,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Sign in</button>
        </div>
      )
    }

    // ── Scanner ──
    if (tab === 'scanner') {
      return (
        <div style={{ padding: pad }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>SCANNER</span>
            <span style={{ fontFamily: mono, fontSize: 9, padding: '3px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>LIVE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 8 }}>
            {SCANNER_TICKERS.map(sym => {
              const d = quotes[sym]
              return (
                <div key={sym} style={card} {...cardHover}>
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
        </div>
      )
    }

    // ── Macro ──
    if (tab === 'macro') {
      return (
        <div style={{ padding: pad }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Fed Funds', value: `${macro.fed_rate.toFixed(2)}%` },
                  { label: 'VIX', value: macro.vix.toFixed(1) },
                  { label: '10Y Yield', value: `${macro.yield_10y.toFixed(2)}%` },
                  { label: 'DXY', value: macro.dxy.toFixed(2) },
                  { label: 'Unemployment', value: `${macro.unemployment.toFixed(1)}%` },
                  { label: 'Credit Spread', value: `${macro.credit_spread.toFixed(2)}%` },
                ].map(ind => (
                  <div key={ind.label} style={{ ...card, padding: '10px 12px' }} {...cardHover}>
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
      )
    }

    // ── Watchlist ──
    if (tab === 'watchlist') {
      const limit = isPro ? Infinity : FREE_WATCHLIST_LIMIT
      const atLimit = watchlist.length >= limit
      return (
        <div style={{ padding: pad }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>WATCHLIST</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: '#555' }}>{watchlist.length}{isPro ? '' : ` / ${FREE_WATCHLIST_LIMIT}`}</span>
          </div>

          {/* Add ticker input */}
          {user && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value.toUpperCase()); setSearchError('') }}
                  onKeyDown={e => e.key === 'Enter' && addTicker()}
                  placeholder="Search ticker... (e.g. NVDA)"
                  disabled={searchLoading}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a',
                    color: '#f0ede6', fontFamily: mono, fontSize: 12, outline: 'none',
                  }}
                />
                <button onClick={addTicker} disabled={searchLoading || !searchInput.trim()} style={{
                  padding: '9px 16px', borderRadius: 8, border: 'none',
                  background: '#4ade80', color: '#052e16', fontFamily: mono,
                  fontSize: 11, fontWeight: 700, cursor: searchLoading ? 'wait' : 'pointer',
                  opacity: searchLoading || !searchInput.trim() ? 0.5 : 1,
                  whiteSpace: 'nowrap',
                }}>
                  {searchLoading ? '...' : 'Add'}
                </button>
              </div>
              {searchError && (
                <p style={{ fontFamily: mono, fontSize: 10, color: searchError.includes('limited') ? '#fbbf24' : '#f87171', marginTop: 6 }}>{searchError}</p>
              )}
            </div>
          )}

          {/* Desktop table layout */}
          {isDesktop && watchlist.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Symbol', 'Price', 'Change', 'Conviction', ''].map(h => (
                    <th key={h} style={{ fontFamily: mono, fontSize: 9, color: '#555', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.1em' }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watchlist.map(sym => {
                  const d = quotes[sym]
                  return (
                    <tr key={sym} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                      <td style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: '#f0ede6', padding: '10px 12px' }}>{sym}</td>
                      <td style={{ fontFamily: mono, fontSize: 12, color: '#f0ede6', padding: '10px 12px' }}>{d?.price != null ? `$${d.price.toFixed(2)}` : '—'}</td>
                      <td style={{ fontFamily: mono, fontSize: 12, color: (d?.change_percent ?? 0) >= 0 ? '#4ade80' : '#f87171', padding: '10px 12px' }}>
                        {d?.change_percent != null ? `${d.change_percent >= 0 ? '+' : ''}${d.change_percent.toFixed(2)}%` : '—'}
                      </td>
                      <td style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: tierColor(d?.conviction ?? 0), padding: '10px 12px' }}>{d?.conviction ?? '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button onClick={() => removeTicker(sym)} style={{
                          background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                          fontFamily: mono, fontSize: 14, padding: '2px 6px',
                          transition: 'color 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#555' }}
                        >x</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            /* Mobile card layout */
            watchlist.map(sym => {
              const d = quotes[sym]
              return (
                <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 10, ...card }} {...cardHover}>
                  <span style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: tierColor(d?.conviction ?? 0), width: 28 }}>{d?.conviction ?? '—'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: '#f0ede6' }}>{sym}</span>
                      <span style={{ fontFamily: mono, fontSize: 11, color: '#f0ede6' }}>{d?.price != null ? `$${d.price.toFixed(2)}` : '—'}</span>
                    </div>
                    {d?.change_percent != null && (
                      <div style={{ fontFamily: mono, fontSize: 9, color: d.change_percent >= 0 ? '#4ade80' : '#f87171', marginTop: 2 }}>
                        {d.change_percent >= 0 ? '+' : ''}{d.change_percent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeTicker(sym)} style={{
                    background: 'none', border: 'none', color: '#444', cursor: 'pointer',
                    fontFamily: mono, fontSize: 16, padding: '4px 8px', flexShrink: 0,
                  }}>x</button>
                </div>
              )
            })
          )}

          {watchlist.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#555', fontFamily: mono, fontSize: 12 }}>
              {user ? 'Add tickers to your watchlist above' : 'Sign in to build your watchlist'}
            </div>
          )}

          {!isPro && atLimit && (
            <a href="/#pricing" style={{
              display: 'block', textAlign: 'center', padding: 10, borderRadius: 8, marginTop: 8,
              background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)',
              color: '#4ade80', fontFamily: mono, fontSize: 10, fontWeight: 600, textDecoration: 'none',
            }}>
              Upgrade to Pro for unlimited watchlist
            </a>
          )}
        </div>
      )
    }

    // ── Settings ──
    if (tab === 'settings') {
      return (
        <div style={{ padding: pad, maxWidth: isDesktop ? 600 : undefined, margin: isDesktop ? '0 auto' : undefined }}>
          <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em', display: 'block', marginBottom: 16 }}>SETTINGS</span>

          {user ? (
            <>
              <div style={card}>
                <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>ACCOUNT</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: '#aaa' }}>{user.email}</div>
              </div>

              <a href="/account" style={{
                display: 'block', textAlign: 'center', padding: 10, borderRadius: 8, marginBottom: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                color: '#aaa', fontFamily: mono, fontSize: 11, fontWeight: 600, textDecoration: 'none',
              }}>Manage account &amp; billing</a>

              <div style={card}>
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
                  <p style={{ fontFamily: mono, fontSize: 10, color: '#666', marginTop: 4 }}>Manage in iPhone Settings &gt; Subscriptions</p>
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
            <div style={card}>
              <p style={{ fontFamily: mono, fontSize: 11, color: '#888', marginBottom: 10 }}>Sign in to access your subscription and settings.</p>
              <button onClick={() => setShowAuth(true)} style={{
                width: '100%', padding: 10, borderRadius: 8, border: 'none',
                background: '#4ade80', color: '#052e16', fontFamily: mono,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>Sign in</button>
            </div>
          )}

          <div style={card}>
            <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>LEGAL</div>
            {[
              { label: 'Privacy Policy', href: 'https://www.iubenda.com/privacy-policy/19345970' },
              { label: 'Terms of Service', href: 'https://www.iubenda.com/terms-and-conditions/19345970' },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, textDecoration: 'none' }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#aaa' }}>{l.label}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#333' }}>&rsaquo;</span>
              </a>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  // ── Layout ──
  return (
    <div style={{ background: '#080808', minHeight: '100dvh', display: 'flex', flexDirection: isDesktop ? 'row' : 'column' }}>
      {showAuth && <AuthModal open={true} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}

      {/* Desktop sidebar */}
      {isDesktop && (
        <div style={{
          width: 220, flexShrink: 0, background: '#0a0a0a',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 24px' }}>
            <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.2em' }}>XATLAS</span>
            <div style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', letterSpacing: '0.2em', marginTop: 2 }}>INTELLIGENCE</div>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, padding: '0 8px' }}>
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(74,222,128,0.08)' : 'transparent',
                  marginBottom: 2, transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#4ade80' : '#666'} strokeWidth={1.8} strokeLinecap="round">
                    <path d={t.icon} />
                  </svg>
                  <span style={{ fontFamily: mono, fontSize: 12, color: active ? '#4ade80' : '#888', fontWeight: active ? 600 : 400 }}>{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* User section at bottom */}
          <div style={{ padding: '16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {lastUpdated && (
              <div style={{ fontFamily: mono, fontSize: 8, color: '#333', marginBottom: 8 }}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            {!authLoading && (user ? (
              <button onClick={signOut} style={{
                width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', color: '#666', fontFamily: mono, fontSize: 10, cursor: 'pointer',
              }}>Sign out</button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{
                width: '100%', padding: 8, borderRadius: 6, border: 'none',
                background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontFamily: mono, fontSize: 10,
                fontWeight: 600, cursor: 'pointer',
              }}>Sign in</button>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{
        flex: 1,
        marginLeft: isDesktop ? 220 : 0,
        display: 'flex', flexDirection: 'column', minHeight: '100dvh',
      }}>
        {/* Mobile top bar */}
        {!isDesktop && (
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
              {!authLoading && (user ? (
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
              ))}
            </div>
          </div>
        )}

        {/* Desktop top bar */}
        {isDesktop && (
          <div style={{
            padding: '12px 32px', background: '#0a0a0a', display: 'flex',
            justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {lastUpdated && (
              <span style={{ fontFamily: mono, fontSize: 9, color: '#444' }}>
                Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          paddingBottom: isDesktop ? 32 : 70,
          maxWidth: isDesktop ? 1200 : undefined,
          width: '100%',
        }}>
          {renderContent()}
        </div>
      </div>

      {/* Mobile tab bar — fixed at bottom */}
      {!isDesktop && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          padding: '8px 0', paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a',
          zIndex: 50,
        }}>
          {TABS.map(t => {
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
      )}
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
