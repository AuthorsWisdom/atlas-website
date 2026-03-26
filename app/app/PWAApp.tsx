'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useAuth } from '@/components/AuthContext'
import { getSupabase } from '@/lib/supabase-browser'
import AuthModal from '@/components/AuthModal'
import StockChart from '@/components/StockChart'
import OptionsFlowPanel from '@/components/OptionsFlowPanel'
import OptionsIntelligence from '@/components/OptionsIntelligence'
import { useLivePrices } from '@/hooks/useLivePrices'

const BACKEND = 'https://web-production-e9e4b.up.railway.app'
const FREE_WATCHLIST_LIMIT = 3

const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT',
  'MATIC', 'BNB', 'LTC', 'SHIB', 'UNI', 'ATOM', 'APT', 'ARB', 'OP', 'NEAR', 'FIL',
])

// ── Types ──
interface QuoteData {
  symbol: string; price: number | null; change_percent: number | null
  conviction: number; factors: string[]
  squeeze_score: number; options_flow_score: number; macro_score: number
  regime: string; vix: number | null
}
interface MacroData {
  fed_rate: number; yield_10y: number; yield_2y: number; vix: number
  dxy: number; unemployment: number; risk_on_score: number; regime: string; credit_spread: number
}
interface SearchResult { symbol: string; name: string; type: string }
interface PortfolioData {
  top_pick: { symbol: string; conviction: number; reasoning: string } | null
  high_conviction: string[]; moderate_conviction: string[]; low_conviction: string[]
  risk_factors: string[]; regime_alignment: string; regime: string
  scores: Record<string, number>; total_symbols: number
}
type Tab = 'scanner' | 'macro' | 'watchlist' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'scanner', label: 'Scanner', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'macro', label: 'Macro', icon: 'M3 20h18M6 16V10M10 16V6M14 16V12M18 16V8' },
  { id: 'watchlist', label: 'Watchlist', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
]

const MACRO_INFO: Record<string, { title: string; desc: string; getStatus: (v: number) => string }> = {
  fed_rate: { title: 'Fed Funds Rate', desc: "The Federal Reserve's benchmark interest rate. Higher rates increase borrowing costs and typically pressure equity valuations.", getStatus: v => v > 5 ? 'Restrictive' : v > 3 ? 'Neutral' : 'Accommodative' },
  yield_10y: { title: '10Y Yield', desc: 'Rising yields increase the discount rate for equities and compete with stocks for capital.', getStatus: v => v > 4.5 ? 'Elevated' : v > 3 ? 'Moderate' : 'Low' },
  vix: { title: 'VIX', desc: 'CBOE Volatility Index measures expected 30-day market volatility. Above 20 = elevated fear, above 30 = extreme fear.', getStatus: v => v > 30 ? 'Extreme fear' : v > 20 ? 'Elevated' : 'Calm' },
  dxy: { title: 'DXY', desc: 'US Dollar Index. Strong dollar pressures multinational earnings and commodities priced in USD.', getStatus: v => v > 105 ? 'Strong dollar' : v > 95 ? 'Neutral' : 'Weak dollar' },
  unemployment: { title: 'Unemployment', desc: 'US unemployment rate. Rising unemployment signals economic weakness and often precedes Fed rate cuts.', getStatus: v => v > 5 ? 'Elevated' : v > 4 ? 'Moderate' : 'Low' },
  credit_spread: { title: 'Credit Spread', desc: 'Difference between corporate and Treasury yields. Widening spreads signal rising credit risk and potential economic stress.', getStatus: v => v > 2 ? 'Stressed' : v > 1 ? 'Moderate' : 'Tight' },
}

const mono = "'JetBrains Mono', monospace"
const GREEN = '#1D9E75'
const RED = '#E24B4A'

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const color = data[data.length - 1] >= data[0] ? GREEN : RED
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 200},${55 - ((v - min) / range) * 50}`).join(' ')
  return (
    <svg viewBox="0 0 200 60" style={{ width: '100%', height: 50, display: 'block' }} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function useIsDesktop() {
  const [d, setD] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setD(mq.matches)
    const h = (e: MediaQueryListEvent) => setD(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return d
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
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [sugIdx, setSugIdx] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [expandedMacro, setExpandedMacro] = useState<string | null>(null)
  const [expandedAI, setExpandedAI] = useState<string | null>(null)
  const [aiData, setAIData] = useState<Record<string, { loading: boolean; text: string; factors: string[] }>>({})
  const [detailTicker, setDetailTicker] = useState<string | null>(null)
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<{ loading: boolean; data: PortfolioData | null }>({ loading: false, data: null })
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [aiUsage, setAIUsage] = useState<{ daily_used: number; monthly_used: number; daily_limit: number; monthly_limit: number } | null>(null)
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({})
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDesktop = useIsDesktop()
  const { quotes: liveQuotes, isLive, isConnected, stockMarketOpen, flashes } = useLivePrices(watchlist)

  const isPro = profile?.is_pro ?? false

  // ── Data fetching ──
  const fetchQuotes = useCallback(async (symbols: string[]) => {
    if (!symbols.length) return
    const results = await Promise.allSettled(
      symbols.map(s => fetch(`/api/quote/${s}`).then(r => r.ok ? r.json() : null))
    )
    const map: Record<string, QuoteData> = {}
    results.forEach((r, i) => { if (r.status === 'fulfilled' && r.value) map[symbols[i]] = r.value })
    setQuotes(prev => ({ ...prev, ...map }))
    setLastUpdated(new Date())
  }, [])

  useEffect(() => {
    if (!user) { setWatchlist([]); return }
    getSupabase().from('watchlist').select('symbol').eq('user_id', user.id).order('created_at')
      .then(({ data }) => { if (data) setWatchlist(data.map((r: { symbol: string }) => r.symbol)) }, () => {})
  }, [user])

  // Initial fetch + macro
  useEffect(() => {
    if (watchlist.length) fetchQuotes(watchlist)
    fetch('/api/demo/macro').then(r => r.ok ? r.json() : null).then(d => { if (d) setMacro(d) }).catch(() => {})
    // Fetch sparkline data for all symbols
    const syms = [...new Set([...watchlist])]
    syms.forEach(s => {
      if (sparklines[s]) return
      fetch(`/api/chart/${s}?timeframe=1M`).then(r => r.ok ? r.json() : null).then(d => {
        if (d?.bars?.length) setSparklines(prev => ({ ...prev, [s]: d.bars.map((b: { close: number }) => b.close) }))
      }).catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchQuotes, watchlist])

  // Live price polling — writes directly to quotes state every 5s
  useEffect(() => {
    if (watchlist.length === 0) return
    const poll = async () => {
      const results = await Promise.allSettled(
        watchlist.map(s =>
          fetch(`/api/quote/${s}?t=${Date.now()}`, { cache: 'no-store' })
            .then(r => r.ok ? r.json() : null)
        )
      )
      const updates: Record<string, QuoteData> = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value && r.value.price != null) {
          updates[watchlist[i]] = r.value
        }
      })
      if (Object.keys(updates).length > 0) {
        setQuotes(prev => ({ ...prev, ...updates }))
        setLastUpdated(new Date())
      }
    }
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist.join(',')])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('subscribed') === 'true' && !user) setShowAuth(true)
  }, [user])

  // Fetch AI usage stats
  useEffect(() => {
    if (!user) return
    fetch(`${BACKEND}/usage/ai`, { headers: { 'X-User-ID': user.id } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAIUsage(d) })
      .catch(() => {})
  }, [user])

  // ── Search autocomplete ──
  const handleSearchInput = useCallback((val: string) => {
    setSearchInput(val)
    setSearchError('')
    setSugIdx(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 1) { setSuggestions([]); setShowSuggestions(false); return }
    setShowSuggestions(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`)
        const { results } = await res.json()
        setSuggestions(results ?? [])
      } catch { setSuggestions([]) }
    }, 300)
  }, [])

  function selectSuggestion(sym: string) {
    setSearchInput(sym)
    setShowSuggestions(false)
    setSuggestions([])
    // Auto-submit
    addTickerDirect(sym)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setShowSuggestions(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSugIdx(i => Math.min(i + 1, suggestions.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSugIdx(i => Math.max(i - 1, -1)); return }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (sugIdx >= 0 && suggestions[sugIdx]) { selectSuggestion(suggestions[sugIdx].symbol); return }
      addTicker()
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Watchlist CRUD ──
  async function addTickerDirect(sym: string) {
    const s = sym.trim().toUpperCase()
    if (!s) return
    setSearchError('')
    if (watchlist.includes(s)) { setSearchError('Already in watchlist'); return }
    if (!isPro && watchlist.length >= FREE_WATCHLIST_LIMIT) { setSearchError(`Free plan limited to ${FREE_WATCHLIST_LIMIT} symbols`); return }
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/validate/${s}`)
      const data = await res.json()
      if (!data.valid) {
        setSearchError(data.error || 'Ticker not found')
        setSearchLoading(false)
        return
      }
      if (user) await getSupabase().from('watchlist').insert({ user_id: user.id, symbol: s })
      // Subscribe to live stream on Railway
      fetch(`${BACKEND}/stream/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: s }),
      }).catch(() => {})
      setWatchlist(prev => [...prev, s])
      setSearchInput('')
      fetchQuotes([s])
    } catch {
      setSearchError('Service unavailable, try again')
    }
    setSearchLoading(false)
  }
  async function addTicker() { await addTickerDirect(searchInput) }

  async function removeTicker(sym: string) {
    setWatchlist(prev => prev.filter(s => s !== sym))
    if (user) await getSupabase().from('watchlist').delete().eq('user_id', user.id).eq('symbol', sym)
  }

  // ── AI Analysis ──
  async function fetchAI(sym: string) {
    if (aiData[sym]?.loading) return
    setAIData(prev => ({ ...prev, [sym]: { loading: true, text: '', factors: [] } }))
    try {
      const res = await fetch(`${BACKEND}/score/${sym}`, {
        headers: {
          'X-User-ID': user?.id ?? '',
          'X-Is-Pro': isPro ? 'true' : 'false',
          'X-Has-BYOK': 'false',
        },
      })
      if (res.status === 429) {
        const err = await res.json()
        const msg = err.detail?.error === 'daily_limit_reached'
          ? 'Daily AI limit reached. Resets tomorrow. Add your own API key for unlimited access.'
          : 'Monthly AI limit reached. Add your own API key for unlimited access.'
        setAIData(prev => ({ ...prev, [sym]: { loading: false, text: msg, factors: ['LIMIT_REACHED'] } }))
        return
      }
      const data = await res.json()
      const factors = data.factors ?? data.components ? Object.entries(data.components ?? {})
        .filter(([, v]) => v != null)
        .map(([k]) => k.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
        : []
      setAIData(prev => ({
        ...prev,
        [sym]: { loading: false, text: data.summary ?? `Conviction: ${data.conviction}/100. ${data.regime ?? ''}`, factors: factors.slice(0, 6) },
      }))
    } catch {
      setAIData(prev => ({ ...prev, [sym]: { loading: false, text: 'Analysis unavailable', factors: [] } }))
    }
  }

  function toggleAI(sym: string) {
    if (expandedAI === sym) { setExpandedAI(null); return }
    setExpandedAI(sym)
    if (!aiData[sym]) fetchAI(sym)
  }

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id) return
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: profile.stripe_customer_id }) })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) { console.error('Portal error:', err) }
  }

  // ── Styles ──
  const card: React.CSSProperties = {
    background: '#111', borderRadius: 10, padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8,
    transition: 'border-color 0.15s',
  }
  const hoverProps = isDesktop ? {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' },
  } : {}
  const pad = isDesktop ? '24px 32px' : '16px 14px'

  // ── Ticker card (shared between scanner & watchlist mobile) ──
  // quotes state is polled every 5s with fresh data — this is the primary source
  // liveQuotes from SSE hook is a bonus overlay for even faster updates
  function getQuote(sym: string): QuoteData | undefined {
    const fetched = quotes[sym]
    if (!fetched) return undefined
    const live = liveQuotes[sym]
    if (live?.price != null && live.timestamp && (!fetched || live.timestamp > (Date.now() / 1000 - 10))) {
      return { ...fetched, price: live.price, change_percent: live.change_percent }
    }
    return fetched
  }

  function TickerCard({ sym, showRemove }: { sym: string; showRemove?: boolean }) {
    const d = getQuote(sym)
    const flash = flashes[sym]
    const aiExpanded = expandedAI === sym
    const ai = aiData[sym]
    return (
      <div className={flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''} style={card} {...hoverProps}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setDetailTicker(detailTicker === sym ? null : sym)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: tierColor(d?.conviction ?? 0) }}>{d?.conviction ?? '—'}</span>
            <span style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.06em' }}>{sym}</span>
            {CRYPTO_SYMBOLS.has(sym) && <span style={{ fontFamily: mono, fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>CRYPTO</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: mono, fontSize: 20, fontWeight: 600,
                color: flash === 'up' ? GREEN : flash === 'down' ? RED : '#f0ede6',
                transition: 'color 0.3s',
              }}>{d?.price != null ? `$${d.price.toFixed(2)}` : '—'}</div>
              {d?.change_percent != null && (
                <div style={{ fontFamily: mono, fontSize: 15, color: d.change_percent >= 0 ? '#4ade80' : '#f87171' }}>
                  {d.change_percent >= 0 ? '+' : ''}{d.change_percent.toFixed(2)}%
                </div>
              )}
            </div>
            {showRemove && (
              <button onClick={e => { e.stopPropagation(); removeTicker(sym) }} style={{
                background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontFamily: mono, fontSize: 16, padding: '4px',
              }}>x</button>
            )}
          </div>
        </div>

        {/* Sparkline */}
        {sparklines[sym] && <div style={{ marginTop: 6 }}><Sparkline data={sparklines[sym]} /></div>}

        {/* Pro breakdown bars / free blur */}
        {isPro && d && (
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {[{ l: 'SQZ', v: d.squeeze_score }, { l: 'FLOW', v: d.options_flow_score }, { l: 'MACRO', v: d.macro_score }].map(b => (
              <div key={b.l} style={{ flex: 1 }}>
                <div style={{ fontFamily: mono, fontSize: 8, color: '#555', marginBottom: 3 }}>{b.l}</div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${(b.v ?? 50)}%`, height: '100%', borderRadius: 2, background: tierColor(b.v ?? 50) }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isPro && (
          <div style={{ marginTop: 8, position: 'relative' }}>
            <div style={{ filter: 'blur(4px)', opacity: 0.4 }}>
              {['SQZ', 'FLOW', 'MACRO'].map(l => (<div key={l} style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />))}
            </div>
            <a href="/#pricing" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 9, color: '#4ade80', textDecoration: 'none' }}>Upgrade to Pro</a>
          </div>
        )}

        {/* AI Analysis toggle */}
        <button onClick={e => { e.stopPropagation(); toggleAI(sym) }} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: mono, fontSize: 9, color: aiExpanded ? '#4ade80' : '#555',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: aiExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
            <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          AI Analysis
        </button>

        {aiExpanded && (
          <div style={{ marginTop: 4, padding: '8px 0' }}>
            {!isPro ? (
              <div style={{ position: 'relative' }}>
                <p style={{ fontFamily: mono, fontSize: 11, color: '#888', filter: 'blur(4px)', lineHeight: 1.6 }}>
                  Based on current squeeze conditions and macro regime, this ticker shows moderate conviction...
                </p>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <a href="/#pricing" style={{ fontFamily: mono, fontSize: 10, color: '#4ade80', textDecoration: 'none', background: 'rgba(74,222,128,0.1)', padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(74,222,128,0.2)' }}>
                    Upgrade to Pro
                  </a>
                </div>
              </div>
            ) : ai?.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[1, 2].map(i => (<div key={i} style={{ height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.04)', width: i === 1 ? '100%' : '70%' }} />))}
              </div>
            ) : ai ? (
              <>
                <p style={{ fontFamily: mono, fontSize: 11, color: '#aaa', lineHeight: 1.6, marginBottom: 6 }}>{ai.text}</p>
                {ai.factors.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {ai.factors.map(f => (
                      <span key={f} style={{ fontFamily: mono, fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>{f}</span>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  // ── Search input with autocomplete ──
  function SearchInput() {
    return (
      <div ref={searchRef} style={{ position: 'relative', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            ref={searchInputRef}
            type="text" value={searchInput}
            onChange={e => handleSearchInput(e.target.value.toUpperCase())}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
            placeholder="Search ticker or company..."
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
            opacity: searchLoading || !searchInput.trim() ? 0.5 : 1, whiteSpace: 'nowrap',
          }}>
            {searchLoading ? '...' : 'Add'}
          </button>
        </div>
        {searchError && (
          <p style={{ fontFamily: mono, fontSize: 10, color: searchError.includes('limited') ? '#fbbf24' : '#f87171', marginTop: 6 }}>{searchError}</p>
        )}
        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {suggestions.map((s, i) => (
              <button key={s.symbol}
                onClick={() => selectSuggestion(s.symbol)}
                onMouseEnter={() => setSugIdx(i)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: i === sugIdx ? 'rgba(255,255,255,0.05)' : 'transparent',
                  transition: 'background 0.1s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: '#f0ede6' }}>{s.symbol}</span>
                  {s.type === 'ETF' && <span style={{ fontFamily: mono, fontSize: 8, padding: '1px 4px', borderRadius: 2, background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>ETF</span>}
                  {s.type === 'CRYPTO' && <span style={{ fontFamily: mono, fontSize: 8, padding: '1px 4px', borderRadius: 2, background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>CRYPTO</span>}
                </div>
                <span style={{ fontFamily: mono, fontSize: 10, color: '#555', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Ticker detail view ──
  function renderDetail(sym: string) {
    const d = getQuote(sym)
    const isCrypto = CRYPTO_SYMBOLS.has(sym)
    const ai = aiData[sym]
    if (!ai && isPro) fetchAI(sym)

    return (
      <div style={{ padding: pad }}>
        {/* Back button */}
        <button onClick={() => setDetailTicker(null)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: mono, fontSize: 11, color: '#888', marginBottom: 16, padding: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Back
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: '#f0ede6' }}>{sym}</span>
            {isCrypto && <span style={{ fontFamily: mono, fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>CRYPTO</span>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, color: '#f0ede6' }}>
              {d?.price != null ? `$${d.price.toFixed(isCrypto && d.price < 1 ? 6 : 2)}` : '—'}
            </div>
            {d?.change_percent != null && (
              <div style={{ fontFamily: mono, fontSize: 12, color: d.change_percent >= 0 ? '#4ade80' : '#f87171' }}>
                {d.change_percent >= 0 ? '+' : ''}{d.change_percent.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Chart — shown first */}
        <div style={{ marginBottom: 16 }}>
          <StockChart symbol={sym} isCrypto={isCrypto} />
        </div>

        {/* Conviction score ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '12px 16px', ...card }}>
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke={tierColor(d?.conviction ?? 0)} strokeWidth="4"
                strokeDasharray={`${(d?.conviction ?? 0) * 1.508} 999`}
                strokeLinecap="round" transform="rotate(-90 28 28)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontSize: 16, fontWeight: 700, color: tierColor(d?.conviction ?? 0) }}>
              {d?.conviction ?? '—'}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: '#f0ede6' }}>
              {(d?.conviction ?? 0) >= 75 ? 'STRONG' : (d?.conviction ?? 0) >= 50 ? 'MODERATE' : 'NOISE'}
            </div>
            <div style={{ fontFamily: mono, fontSize: 9, color: '#555', marginTop: 2 }}>CONVICTION SCORE</div>
          </div>
        </div>

        {/* Breakdown bars — Pro only */}
        {isPro && d ? (
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>SCORE BREAKDOWN</div>
            {[
              { l: 'Squeeze', v: d.squeeze_score },
              { l: 'Options Flow', v: d.options_flow_score },
              { l: 'Macro', v: d.macro_score },
            ].map(b => (
              <div key={b.l} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: mono, fontSize: 10, color: '#888' }}>{b.l}</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: tierColor(b.v ?? 50) }}>{b.v ?? '—'}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${b.v ?? 50}%`, height: '100%', borderRadius: 2, background: tierColor(b.v ?? 50) }} />
                </div>
              </div>
            ))}
          </div>
        ) : !isPro ? (
          <div style={{ ...card, position: 'relative', marginBottom: 16 }}>
            <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>SCORE BREAKDOWN</div>
              {['Squeeze', 'Options Flow', 'Macro'].map(l => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: mono, fontSize: 10, color: '#888', marginBottom: 3 }}>{l}</div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              <a href="/#pricing" style={{ fontFamily: mono, fontSize: 9, color: '#4ade80', textDecoration: 'none', background: 'rgba(74,222,128,0.1)', padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(74,222,128,0.2)' }}>Upgrade to Pro</a>
            </div>
          </div>
        ) : null}

        {/* Options Flow (stocks only) */}
        {!isCrypto && (
          <>
            <div style={{ marginBottom: 16 }}>
              <OptionsFlowPanel symbol={sym} isPro={isPro} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <OptionsIntelligence symbol={sym} isPro={isPro} />
            </div>
          </>
        )}

        {/* AI Analysis */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>AI ANALYSIS</div>
          {isPro ? (
            ai?.loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.04)', width: `${100 - i * 15}%` }} />)}
              </div>
            ) : ai ? (
              <>
                <p style={{ fontFamily: mono, fontSize: 11, color: '#aaa', lineHeight: 1.7, marginBottom: 8 }}>{ai.text}</p>
                {ai.factors.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {ai.factors.map(f => (
                      <span key={f} style={{ fontFamily: mono, fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.15)' }}>{f}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontFamily: mono, fontSize: 11, color: '#555' }}>Loading analysis...</p>
            )
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ filter: 'blur(4px)', userSelect: 'none' }}>
                <p style={{ fontFamily: mono, fontSize: 11, color: '#888', lineHeight: 1.7 }}>
                  Based on current squeeze conditions and macro regime alignment, this ticker shows moderate-to-strong conviction with favorable positioning across multiple factors...
                </p>
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(0,0,0,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                <p style={{ fontFamily: mono, fontSize: 10, color: '#888' }}>Upgrade to Pro to see full AI analysis</p>
                <a href="/#pricing" style={{ fontFamily: mono, fontSize: 9, color: '#4ade80', textDecoration: 'none', background: 'rgba(74,222,128,0.1)', padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(74,222,128,0.2)' }}>Start free trial</a>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render tab content ──
  function renderContent() {
    if (authLoading) {
      return (
        <div style={{ padding: pad }}>
          {[1, 2, 3].map(i => (<div key={i} style={{ ...card }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ display: 'flex', gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} /><div style={{ width: 48, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} /></div><div style={{ width: 60, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} /></div></div>))}
        </div>
      )
    }

    if (!user && tab !== 'settings' && tab !== 'macro') {
      return (
        <div style={{ padding: '80px 14px', textAlign: 'center' }}>
          <div style={{ fontFamily: mono, fontSize: 28, color: '#4ade80', marginBottom: 16 }}>XATLAS</div>
          <p style={{ fontFamily: mono, fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>Sign in to access conviction scores,<br />macro data, and your watchlist.</p>
          <button onClick={() => setShowAuth(true)} style={{ padding: '12px 32px', borderRadius: 8, border: 'none', background: '#4ade80', color: '#052e16', fontFamily: mono, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Sign in</button>
        </div>
      )
    }

    // ── Scanner ── (uses watchlist symbols)
    if (tab === 'scanner') {
      const symbols = watchlist.length ? watchlist : []
      return (
        <div style={{ padding: pad }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>SCANNER</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: mono, fontSize: 9, padding: '3px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>LIVE</span>
              <button onClick={() => setTab('watchlist')} style={{
                fontFamily: mono, fontSize: 9, padding: '3px 8px', borderRadius: 4,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#888', cursor: 'pointer',
              }}>Edit</button>
            </div>
          </div>
          {symbols.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ fontFamily: mono, fontSize: 12, color: '#555', marginBottom: 12 }}>No tickers in your watchlist</p>
              <button onClick={() => setTab('watchlist')} style={{
                fontFamily: mono, fontSize: 11, padding: '8px 20px', borderRadius: 6,
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
                color: '#4ade80', cursor: 'pointer', fontWeight: 600,
              }}>Add tickers</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 8 }}>
            {symbols.map(sym => <TickerCard key={sym} sym={sym} />)}
          </div>
        </div>
      )
    }

    // ── Macro ──
    if (tab === 'macro') {
      const indicators = macro ? [
        { key: 'fed_rate', value: macro.fed_rate, fmt: `${macro.fed_rate.toFixed(2)}%` },
        { key: 'vix', value: macro.vix, fmt: macro.vix.toFixed(1) },
        { key: 'yield_10y', value: macro.yield_10y, fmt: `${macro.yield_10y.toFixed(2)}%` },
        { key: 'dxy', value: macro.dxy, fmt: macro.dxy.toFixed(2) },
        { key: 'unemployment', value: macro.unemployment, fmt: `${macro.unemployment.toFixed(1)}%` },
        { key: 'credit_spread', value: macro.credit_spread, fmt: `${macro.credit_spread.toFixed(2)}%` },
      ] : []

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
                {indicators.map(ind => {
                  const info = MACRO_INFO[ind.key]
                  const expanded = expandedMacro === ind.key
                  const status = info.getStatus(ind.value)
                  return (
                    <div key={ind.key}
                      onClick={() => setExpandedMacro(expanded ? null : ind.key)}
                      style={{
                        ...card, padding: '10px 12px', cursor: 'pointer',
                        ...(expanded ? { gridColumn: isDesktop ? 'span 1' : 'span 2' } : {}),
                      }} {...hoverProps}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: mono, fontSize: 13, color: '#555', letterSpacing: '0.1em' }}>{info.title.toUpperCase()}</div>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: status.includes('Extreme') || status.includes('Stressed') || status.includes('Elevated') ? '#f87171'
                            : status.includes('Moderate') || status.includes('Neutral') ? '#fbbf24' : '#4ade80',
                        }} />
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 600, color: '#f0ede6', marginTop: 4 }}>{ind.fmt}</div>
                      {expanded && (
                        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                          <p style={{ fontFamily: mono, fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 6 }}>{info.desc}</p>
                          <div style={{ fontFamily: mono, fontSize: 13, padding: '4px 10px', borderRadius: 4, display: 'inline-block', background: (status.includes('Extreme') || status.includes('Stressed') || status.includes('Elevated') ? `${RED}15` : status.includes('Moderate') || status.includes('Neutral') ? 'rgba(251,191,36,0.1)' : `${GREEN}15`), color: status.includes('Extreme') || status.includes('Stressed') || status.includes('Elevated') ? '#f87171' : status.includes('Moderate') || status.includes('Neutral') ? '#fbbf24' : '#4ade80' }}>
                            {status}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
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
      const atLimit = !isPro && watchlist.length >= FREE_WATCHLIST_LIMIT
      return (
        <div style={{ padding: pad }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.08em' }}>WATCHLIST</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: '#555' }}>{watchlist.length}{isPro ? '' : ` / ${FREE_WATCHLIST_LIMIT}`}</span>
          </div>
          {user && <SearchInput />}
          {isDesktop && watchlist.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Symbol', 'Price', 'Change', 'Conviction', '', ''].map(h => (
                  <th key={h} style={{ fontFamily: mono, fontSize: 9, color: '#555', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.1em' }}>{h.toUpperCase()}</th>
                ))}</tr>
              </thead>
              <tbody>
                {watchlist.map(sym => {
                  const d = getQuote(sym)
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
                        <button onClick={() => setDetailTicker(sym)} style={{ background: 'none', border: `1px solid ${GREEN}44`, borderRadius: 4, color: GREEN, cursor: 'pointer', fontFamily: mono, fontSize: 9, padding: '3px 8px' }}>Chart</button>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button onClick={() => removeTicker(sym)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: mono, fontSize: 14, padding: '2px 6px', transition: 'color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }} onMouseLeave={e => { e.currentTarget.style.color = '#555' }}>x</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            watchlist.map(sym => <TickerCard key={sym} sym={sym} showRemove />)
          )}
          {watchlist.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#555', fontFamily: mono, fontSize: 12 }}>
              {user ? 'Search and add tickers above' : 'Sign in to build your watchlist'}
            </div>
          )}
          {atLimit && (
            <a href="/#pricing" style={{ display: 'block', textAlign: 'center', padding: 10, borderRadius: 8, marginTop: 8, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', color: '#4ade80', fontFamily: mono, fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>
              Upgrade to Pro for unlimited watchlist
            </a>
          )}

          {/* AI Portfolio Analysis */}
          {watchlist.length >= 2 && (
            <div style={{ marginTop: 16 }}>
              {isPro ? (
                <>
                  <button onClick={async () => {
                    if (portfolioAnalysis.loading) return
                    setShowPortfolio(true)
                    setPortfolioAnalysis({ loading: true, data: null })
                    try {
                      const res = await fetch(`${BACKEND}/portfolio/analyze`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-User-ID': user?.id ?? '',
                          'X-Is-Pro': isPro ? 'true' : 'false',
                          'X-Has-BYOK': 'false',
                        },
                        body: JSON.stringify({ symbols: watchlist, regime: macro?.regime ?? 'unknown' }),
                      })
                      const data = await res.json()
                      setPortfolioAnalysis({ loading: false, data })
                    } catch {
                      setPortfolioAnalysis({ loading: false, data: null })
                    }
                  }} disabled={portfolioAnalysis.loading} style={{
                    width: '100%', padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: `${GREEN}1a`, fontFamily: mono, fontSize: 11, fontWeight: 600,
                    color: GREEN, transition: 'opacity 0.15s',
                    opacity: portfolioAnalysis.loading ? 0.6 : 1,
                  }}>
                    {portfolioAnalysis.loading ? 'Analyzing portfolio...' : 'AI Portfolio Analysis'}
                  </button>

                  {showPortfolio && portfolioAnalysis.data && (
                    <div style={{ ...card, marginTop: 8 }}>
                      <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>PORTFOLIO ANALYSIS</div>

                      {portfolioAnalysis.data.top_pick && (
                        <div style={{ marginBottom: 12, padding: '10px 12px', background: `${GREEN}0d`, borderRadius: 6, border: `1px solid ${GREEN}33` }}>
                          <div style={{ fontFamily: mono, fontSize: 9, color: GREEN, marginBottom: 4 }}>TOP PICK</div>
                          <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: '#f0ede6' }}>
                            {portfolioAnalysis.data.top_pick.symbol}
                            <span style={{ fontSize: 11, color: GREEN, marginLeft: 8 }}>{portfolioAnalysis.data.top_pick.conviction}/100</span>
                          </div>
                          <div style={{ fontFamily: mono, fontSize: 10, color: '#888', marginTop: 4 }}>{portfolioAnalysis.data.top_pick.reasoning}</div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontFamily: mono, fontSize: 10, color: '#888' }}>Regime alignment</span>
                        <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color:
                          portfolioAnalysis.data.regime_alignment === 'aligned' ? GREEN :
                          portfolioAnalysis.data.regime_alignment === 'misaligned' ? RED : '#fbbf24' }}>
                          {portfolioAnalysis.data.regime_alignment.toUpperCase()}
                        </span>
                      </div>

                      {portfolioAnalysis.data.risk_factors.length > 0 && (
                        <div>
                          <div style={{ fontFamily: mono, fontSize: 9, color: '#555', marginBottom: 6 }}>RISK FACTORS</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {portfolioAnalysis.data.risk_factors.map((f, i) => (
                              <span key={i} style={{ fontFamily: mono, fontSize: 9, padding: '3px 6px', borderRadius: 3, background: `${RED}12`, color: RED, border: `1px solid ${RED}22` }}>{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <button disabled style={{
                    width: '100%', padding: 12, borderRadius: 8, border: 'none',
                    background: 'rgba(255,255,255,0.03)', fontFamily: mono, fontSize: 11,
                    color: '#444', cursor: 'default',
                  }}>
                    AI Portfolio Analysis
                  </button>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    <a href="/#pricing" style={{ fontFamily: mono, fontSize: 9, color: GREEN, textDecoration: 'none' }}>Upgrade to Pro</a>
                  </div>
                </div>
              )}
            </div>
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
              <a href="/account" style={{ display: 'block', textAlign: 'center', padding: 10, borderRadius: 8, marginBottom: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#aaa', fontFamily: mono, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>Manage account &amp; billing</a>
              <div style={card}>
                <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>SUBSCRIPTION</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: mono, fontSize: 12, color: '#f0ede6' }}>Status</span>
                  <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: isPro ? '#4ade80' : '#888' }}>{isPro ? 'PRO' : 'FREE'}</span>
                </div>
                {isPro && profile?.subscription_source === 'stripe' && (
                  <button onClick={handleManageSubscription} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#aaa', fontFamily: mono, fontSize: 10, cursor: 'pointer', marginTop: 4 }}>Manage subscription</button>
                )}
                {isPro && profile?.subscription_source === 'apple' && (
                  <p style={{ fontFamily: mono, fontSize: 10, color: '#666', marginTop: 4 }}>Manage in iPhone Settings &gt; Subscriptions</p>
                )}
                {!isPro && (
                  <a href="/#pricing" style={{ display: 'block', textAlign: 'center', padding: 8, borderRadius: 6, marginTop: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', fontFamily: mono, fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>Upgrade to Pro</a>
                )}
              </div>
              {/* AI Usage */}
              {aiUsage && (
                <div style={card}>
                  <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>AI USAGE (SERVER KEY)</div>
                  {[
                    { label: 'Today', used: aiUsage.daily_used, limit: aiUsage.daily_limit },
                    { label: 'Month', used: aiUsage.monthly_used, limit: aiUsage.monthly_limit },
                  ].map(u => (
                    <div key={u.label} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontFamily: mono, fontSize: 10, color: '#888' }}>{u.label}</span>
                        <span style={{ fontFamily: mono, fontSize: 10, color: u.used >= u.limit ? RED : '#aaa' }}>{u.used} / {u.limit}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((u.used / u.limit) * 100, 100)}%`, height: '100%', borderRadius: 2, background: u.used >= u.limit ? RED : GREEN, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  ))}
                  <p style={{ fontFamily: mono, fontSize: 9, color: '#444', marginTop: 6 }}>
                    Using your own API key? No limits apply. <a href="/account" style={{ color: GREEN, textDecoration: 'none' }}>Add key</a>
                  </p>
                </div>
              )}

              {/* API Keys — Pro gated */}
              <div style={card}>
                <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>API KEYS (BYOK)</div>
                {isPro ? (
                  <a href="/account" style={{ display: 'block', textAlign: 'center', padding: 8, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#aaa', fontFamily: mono, fontSize: 10, fontWeight: 600, textDecoration: 'none' }}>Manage API keys</a>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    <p style={{ fontFamily: mono, fontSize: 10, color: '#666', textAlign: 'center' }}>API Keys require Pro or free trial</p>
                    <a href="/#pricing" style={{ padding: '6px 16px', borderRadius: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', fontFamily: mono, fontSize: 9, fontWeight: 600, textDecoration: 'none' }}>Start free trial</a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={card}>
              <p style={{ fontFamily: mono, fontSize: 11, color: '#888', marginBottom: 10 }}>Sign in to access your subscription and settings.</p>
              <button onClick={() => setShowAuth(true)} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#4ade80', color: '#052e16', fontFamily: mono, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Sign in</button>
            </div>
          )}
          <div style={card}>
            <div style={{ fontFamily: mono, fontSize: 9, color: '#555', letterSpacing: '0.1em', marginBottom: 10 }}>LEGAL</div>
            {[{ label: 'Privacy Policy', href: 'https://www.iubenda.com/privacy-policy/19345970' }, { label: 'Terms of Service', href: 'https://www.iubenda.com/terms-and-conditions/19345970' }].map(l => (
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
        <div style={{ width: 220, flexShrink: 0, background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40 }}>
          <div style={{ padding: '20px 20px 24px' }}>
            <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.2em' }}>XATLAS</span>
            <div style={{ fontFamily: mono, fontSize: 8, color: '#4ade80', letterSpacing: '0.2em', marginTop: 2 }}>INTELLIGENCE</div>
          </div>
          <div style={{ flex: 1, padding: '0 8px' }}>
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => { setDetailTicker(null); setTab(t.id) }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: active ? 'rgba(74,222,128,0.08)' : 'transparent', marginBottom: 2, transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#4ade80' : '#666'} strokeWidth={1.8} strokeLinecap="round"><path d={t.icon} /></svg>
                  <span style={{ fontFamily: mono, fontSize: 15, color: active ? '#4ade80' : '#888', fontWeight: active ? 600 : 400 }}>{t.label}</span>
                </button>
              )
            })}
          </div>
          <div style={{ padding: '16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {lastUpdated && <div style={{ fontFamily: mono, fontSize: 8, color: '#333', marginBottom: 8 }}>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
            {!authLoading && (user ? (
              <button onClick={signOut} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#666', fontFamily: mono, fontSize: 10, cursor: 'pointer' }}>Sign out</button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontFamily: mono, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Sign in</button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: isDesktop ? 220 : 0, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        {!isDesktop && (
          <div style={{ padding: '4px 16px', background: '#0a0a0a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, paddingTop: 'env(safe-area-inset-top, 12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: '#f0ede6', letterSpacing: '0.15em' }}>XATLAS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: mono, fontSize: 9, color: isLive ? GREEN : isConnected ? '#fbbf24' : '#888' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? GREEN : isConnected ? '#fbbf24' : '#888', animation: isLive ? 'pulse-dot 2s infinite' : 'none' }} />
                {isLive ? 'LIVE' : isConnected && !stockMarketOpen ? 'MKT CLOSED' : 'DELAYED'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!authLoading && (user ? (
                <button onClick={signOut} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '3px 8px', color: '#666', fontFamily: mono, fontSize: 9, cursor: 'pointer' }}>Sign out</button>
              ) : (
                <button onClick={() => setShowAuth(true)} style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4, padding: '3px 8px', color: '#4ade80', fontFamily: mono, fontSize: 9, cursor: 'pointer' }}>Sign in</button>
              ))}
            </div>
          </div>
        )}
        {isDesktop && (
          <div style={{ padding: '12px 32px', background: '#0a0a0a', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {lastUpdated && <span style={{ fontFamily: mono, fontSize: 9, color: '#444' }}>Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: isDesktop ? 32 : 70, maxWidth: isDesktop ? 1200 : undefined, width: '100%' }}>
          {detailTicker ? renderDetail(detailTicker) : renderContent()}
        </div>
      </div>

      {/* Mobile tab bar */}
      {!isDesktop && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', zIndex: 1000, pointerEvents: 'all' }}>
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => { setDetailTicker(null); setTab(t.id) }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 12px' }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? '#4ade80' : '#555'} strokeWidth={1.8} strokeLinecap="round"><path d={t.icon} /></svg>
                <span style={{ fontFamily: mono, fontSize: 13, color: active ? '#4ade80' : '#555', letterSpacing: '0.04em', fontWeight: active ? 600 : 400 }}>{t.label}</span>
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
