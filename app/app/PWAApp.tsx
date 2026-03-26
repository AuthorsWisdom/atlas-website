'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import Link from 'next/link'
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

// ── Design System ──
const D = {
  bg: '#060810',
  surface: '#0B0E1A',
  card: '#0F1220',
  border: '#1A2038',
  accent: '#00C896',
  accentBlue: '#4F8EF7',
  accentAmber: '#F5A623',
  red: '#E24B4A',
  text: '#E8EDFF',
  muted: '#4A5575',
  mono: "'JetBrains Mono', monospace",
  sans: "'DM Sans', sans-serif",
}

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
  yield_curve?: number; cpi?: number; pce?: number; m2?: number
  jobless_claims?: number; retail_sales?: number; housing?: number; gdp?: number; pmi?: number | null
}
interface SearchResult { symbol: string; name: string; type: string }
interface PortfolioData {
  top_pick: { symbol: string; conviction: number; reasoning: string } | null
  high_conviction: string[]; moderate_conviction: string[]; low_conviction: string[]
  risk_factors: string[]; regime_alignment: string; regime: string
  scores: Record<string, number>; total_symbols: number
}
type Tab = 'scanner' | 'macro' | 'watchlist' | 'news' | 'settings'

const MACRO_INFO: Record<string, { title: string; desc: string; getStatus: (v: number) => string }> = {
  fed_rate: { title: 'Fed Funds Rate', desc: "The Federal Reserve's benchmark interest rate. Higher rates increase borrowing costs and typically pressure equity valuations.", getStatus: v => v > 5 ? 'Restrictive' : v > 3 ? 'Neutral' : 'Accommodative' },
  yield_10y: { title: '10Y Yield', desc: 'Rising yields increase the discount rate for equities and compete with stocks for capital.', getStatus: v => v > 4.5 ? 'Elevated' : v > 3 ? 'Moderate' : 'Low' },
  vix: { title: 'VIX', desc: 'CBOE Volatility Index measures expected 30-day market volatility. Above 20 = elevated fear, above 30 = extreme fear.', getStatus: v => v > 30 ? 'Extreme fear' : v > 20 ? 'Elevated' : 'Calm' },
  dxy: { title: 'DXY', desc: 'US Dollar Index. Strong dollar pressures multinational earnings and commodities priced in USD.', getStatus: v => v > 105 ? 'Strong dollar' : v > 95 ? 'Neutral' : 'Weak dollar' },
  unemployment: { title: 'Unemployment', desc: 'US unemployment rate. Rising unemployment signals economic weakness and often precedes Fed rate cuts.', getStatus: v => v > 5 ? 'Elevated' : v > 4 ? 'Moderate' : 'Low' },
  credit_spread: { title: 'Credit Spread', desc: 'Difference between corporate and Treasury yields. Widening spreads signal rising credit risk and potential economic stress.', getStatus: v => v > 2 ? 'Stressed' : v > 1 ? 'Moderate' : 'Tight' },
}

// ── Utilities ──
function tierColor(c: number): string {
  if (c >= 70) return D.accent
  if (c >= 40) return D.accentAmber
  return D.muted
}

function signalLabel(score: number): { text: string; color: string; bg: string } {
  if (score >= 75) return { text: 'STRONG BUY', color: D.accent, bg: `${D.accent}18` }
  if (score >= 60) return { text: 'BUY', color: D.accent, bg: `${D.accent}12` }
  if (score >= 40) return { text: 'HOLD', color: D.accentAmber, bg: `${D.accentAmber}15` }
  if (score >= 25) return { text: 'WEAK', color: D.muted, bg: `${D.muted}15` }
  return { text: 'NO SIGNAL', color: D.muted, bg: `${D.muted}10` }
}

// ── Small Components ──
const ConvictionBar = memo(({ score }: { score: number }) => (
  <div style={{ width: 60, height: 4, background: D.border, borderRadius: 2, overflow: 'hidden' }}>
    <div style={{
      width: `${score}%`, height: '100%', borderRadius: 2,
      background: score >= 70 ? D.accent : score >= 40 ? D.accentAmber : D.red,
      transition: 'width 0.5s ease',
    }} />
  </div>
))
ConvictionBar.displayName = 'ConvictionBar'

const SignalBadge = memo(({ score }: { score: number }) => {
  const s = signalLabel(score)
  return (
    <span style={{
      fontFamily: D.sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
      padding: '3px 8px', borderRadius: 4,
      color: s.color, background: s.bg,
    }}>{s.text}</span>
  )
})
SignalBadge.displayName = 'SignalBadge'

function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const c = color ?? (data[data.length - 1] >= data[0] ? D.accent : D.red)
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - 2 - ((v - min) / range) * (height - 4)}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={c} strokeWidth="1.5" />
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

// ── Market Hours Widget ──
function MarketHoursWidget() {
  const [status, setStatus] = useState<{ session: 'pre' | 'regular' | 'post' | 'closed'; nextEvent: string; timeUntil: string }>({ session: 'closed', nextEvent: '', timeUntil: '' })

  useEffect(() => {
    const update = () => {
      const et = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      const now = new Date(et)
      const day = now.getDay()
      const time = now.getHours() * 60 + now.getMinutes()
      const PRE = 240, OPEN = 570, CLOSE = 960, POST = 1200
      const isWeekend = day === 0 || day === 6

      let session: 'pre' | 'regular' | 'post' | 'closed' = 'closed'
      let nextEvent = '', timeUntil = ''

      if (!isWeekend) {
        if (time >= OPEN && time < CLOSE) {
          session = 'regular'
          const m = CLOSE - time
          nextEvent = 'Closes'; timeUntil = `${Math.floor(m / 60)}h ${m % 60}m`
        } else if (time >= PRE && time < OPEN) {
          session = 'pre'
          const m = OPEN - time
          nextEvent = 'Opens'; timeUntil = `${Math.floor(m / 60)}h ${m % 60}m`
        } else if (time >= CLOSE && time < POST) {
          session = 'post'
          const m = POST - time
          nextEvent = 'AH ends'; timeUntil = `${Math.floor(m / 60)}h ${m % 60}m`
        } else {
          session = 'closed'
          const m = time < PRE ? PRE - time : (1440 - time) + PRE
          nextEvent = 'Pre-market'; timeUntil = `${Math.floor(m / 60)}h ${m % 60}m`
        }
      } else {
        nextEvent = 'Opens Monday'; timeUntil = ''
      }
      setStatus({ session, nextEvent, timeUntil })
    }
    update()
    const i = setInterval(update, 60000)
    return () => clearInterval(i)
  }, [])

  const cfg = {
    regular: { label: 'MARKET OPEN', color: D.accent },
    pre: { label: 'PRE-MARKET', color: D.accentAmber },
    post: { label: 'AFTER-HOURS', color: D.accentBlue },
    closed: { label: 'CLOSED', color: D.muted },
  }[status.session]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`, borderRadius: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, animation: status.session === 'regular' ? 'pulse-dot 2s infinite' : 'none', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 10, fontFamily: D.sans, fontWeight: 700, color: cfg.color, letterSpacing: '0.8px' }}>{cfg.label}</div>
        {status.timeUntil && <div style={{ fontSize: 10, color: D.muted, fontFamily: D.mono }}>{status.nextEvent} in {status.timeUntil}</div>}
      </div>
    </div>
  )
}

// ── News Components ──
interface NewsArticle {
  id: string; title: string; summary: string; source: string
  url: string; image: string; published_at: number; category: string
  type?: string; symbols?: string[]
}

const CATEGORY_COLORS: Record<string, string> = {
  market: '#4F8EF7',
  sec: '#F5A623',
  regulation: '#E24B4A',
  fed: '#00C896',
}

const NewsCard = memo(({ article, compact, isPro }: { article: NewsArticle; compact?: boolean; isPro?: boolean }) => {
  const color = CATEGORY_COLORS[article.category] ?? D.muted
  const isBenzinga = article.source?.toLowerCase().includes('benzinga')
  const isBlurred = isBenzinga && !isPro
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: D.surface, borderRadius: 10, padding: compact ? 16 : 20,
        border: `1px solid ${D.border}`, cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s',
        borderLeft: `3px solid ${color}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.borderLeftColor = color; e.currentTarget.style.transform = 'translateY(0)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
          <span style={{
            fontSize: 10, fontFamily: D.sans, fontWeight: 700,
            color, textTransform: 'uppercase' as const, letterSpacing: '0.8px',
            background: `${color}15`, padding: '3px 8px', borderRadius: 4, flexShrink: 0,
          }}>{article.source}</span>
          <span style={{ fontSize: 11, color: D.muted, fontFamily: D.mono, flexShrink: 0 }}>
            {new Date(article.published_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{
          fontFamily: D.sans, fontWeight: 600, fontSize: compact ? 13 : 14,
          color: D.text, lineHeight: 1.5, marginBottom: article.summary ? 8 : 0,
        }}>{article.title}</div>
        {article.summary && !compact && (
          <div style={{
            fontSize: 12, color: D.muted, lineHeight: 1.6,
            filter: isBlurred ? 'blur(3px)' : 'none',
            userSelect: isBlurred ? 'none' : 'auto',
            position: 'relative',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>
            {article.summary}
            {isBlurred && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ background: D.surface, padding: '4px 12px', borderRadius: 20, fontSize: 11, color: D.accent, border: `1px solid ${D.accent}40`, fontFamily: D.sans, fontWeight: 600 }}>
                  Pro — Upgrade to read full Benzinga analysis
                </span>
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: compact ? 8 : 12, fontSize: 11, color, fontFamily: D.sans, fontWeight: 600 }}>
          Read more →
        </div>
      </div>
    </a>
  )
})
NewsCard.displayName = 'NewsCard'

const NewsCardSkeleton = () => (
  <div style={{ background: D.surface, borderRadius: 10, padding: 20, border: `1px solid ${D.border}` }}>
    {[80, 100, 60].map((w, i) => (
      <div key={i} style={{ height: 12, background: D.border, borderRadius: 4, width: `${w}%`, marginBottom: 10 }} />
    ))}
  </div>
)

function NewsTab({ isPro }: { isPro: boolean }) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'market' | 'sec' | 'regulation' | 'fed'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news?type=all&limit=50')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = activeFilter === 'all' ? news : news.filter(n => n.category === activeFilter)

  return (
    <>
      <div style={{ fontFamily: D.sans, fontWeight: 700, color: D.text, fontSize: 18, marginBottom: 20 }}>News & Regulations</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {([
          { id: 'all' as const, label: 'All News' },
          { id: 'market' as const, label: 'Markets' },
          { id: 'sec' as const, label: 'SEC Filings' },
          { id: 'regulation' as const, label: 'Regulations' },
          { id: 'fed' as const, label: 'Federal Reserve' },
        ]).map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)}
            style={{
              padding: '6px 14px',
              background: activeFilter === f.id ? D.accent : D.surface,
              color: activeFilter === f.id ? '#000' : D.muted,
              border: `1px solid ${activeFilter === f.id ? D.accent : D.border}`,
              borderRadius: 20, fontSize: 12, cursor: 'pointer',
              fontFamily: D.sans, fontWeight: 600, transition: 'all 0.15s',
            }}>
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: D.muted, fontFamily: D.sans }}>
          {filtered.length} articles
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
        {loading ? (
          Array(6).fill(0).map((_, i) => <NewsCardSkeleton key={i} />)
        ) : filtered.length > 0 ? (
          filtered.map((article, i) => <NewsCard key={article.id || i} article={article} isPro={isPro} />)
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: D.muted, fontFamily: D.sans, fontSize: 14 }}>
            No articles found for this filter.
          </div>
        )}
      </div>
    </>
  )
}

function NewsFeed({ limit = 15, isPro }: { limit?: number; isPro: boolean }) {
  const [news, setNews] = useState<NewsArticle[]>([])
  useEffect(() => {
    fetch(`/api/news?type=all&limit=${limit}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNews(data) })
      .catch(() => {})
  }, [limit])
  return (
    <>
      {news.map((article, i) => (
        <a key={article.id || i} href={article.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', padding: '10px 0', borderBottom: i < news.length - 1 ? `1px solid ${D.border}` : 'none', textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontFamily: D.sans, fontWeight: 700, color: CATEGORY_COLORS[article.category] ?? D.muted, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{article.source}</span>
            <span style={{ fontSize: 10, color: D.muted, fontFamily: D.mono, flexShrink: 0 }}>
              {new Date(article.published_at * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ fontSize: 12, color: D.text, fontFamily: D.sans, fontWeight: 500, lineHeight: 1.4 }}>{article.title}</div>
        </a>
      ))}
      {news.length === 0 && <div style={{ color: D.muted, fontSize: 12, fontFamily: D.sans, padding: 20, textAlign: 'center' }}>Loading news...</div>}
    </>
  )
}

function TickerNews({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/news?type=market&symbol=${symbol}&limit=5`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [symbol])

  if (loading) return null
  if (news.length === 0) return null

  return (
    <div style={{ background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`, padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ fontFamily: D.sans, fontSize: 10, color: D.muted, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }}>
        Latest {symbol} News
      </div>
      {news.map((article, i) => (
        <a key={article.id || i} href={article.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', padding: '10px 0', borderBottom: i < news.length - 1 ? `1px solid ${D.border}` : 'none', textDecoration: 'none' }}>
          <div style={{ fontSize: 13, color: D.text, fontFamily: D.sans, fontWeight: 500, lineHeight: 1.4, marginBottom: 4 }}>{article.title}</div>
          <div style={{ fontSize: 11, color: D.muted, fontFamily: D.sans }}>
            {article.source} · {new Date(article.published_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </a>
      ))}
    </div>
  )
}

function WatchlistNewsFeed({ symbols, isPro }: { symbols: string[]; isPro: boolean }) {
  const [news, setNews] = useState<NewsArticle[]>([])
  useEffect(() => {
    if (!symbols.length) return
    Promise.all(
      symbols.slice(0, 5).map(sym =>
        fetch(`/api/news?type=market&symbol=${sym}&limit=3`).then(r => r.json()).catch(() => [])
      )
    ).then(results => {
      const all = (results.flat() as NewsArticle[]).filter(a => a && a.title).sort((a, b) => b.published_at - a.published_at)
      setNews(all.slice(0, 9))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(',')])

  if (news.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
      {news.map((article, i) => <NewsCard key={article.id || i} article={article} isPro={isPro} compact />)}
    </div>
  )
}

function MacroNewsFeed() {
  const [news, setNews] = useState<NewsArticle[]>([])
  useEffect(() => {
    fetch('/api/news?type=regulations&limit=8')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNews(data) })
      .catch(() => {})
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {news.map((article, i) => (
        <a key={article.id || i} href={article.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < news.length - 1 ? `1px solid ${D.border}` : 'none', textDecoration: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontFamily: D.sans, fontWeight: 700, color: CATEGORY_COLORS[article.category] ?? D.muted, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{article.source}</span>
            </div>
            <div style={{ fontSize: 13, color: D.text, fontFamily: D.sans, fontWeight: 500, lineHeight: 1.4 }}>{article.title}</div>
          </div>
          <span style={{ fontSize: 10, color: D.muted, fontFamily: D.mono, flexShrink: 0, marginTop: 2 }}>
            {new Date(article.published_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </a>
      ))}
      {news.length === 0 && <div style={{ color: D.muted, fontSize: 12, fontFamily: D.sans, padding: 20, textAlign: 'center' }}>Loading regulatory news...</div>}
    </div>
  )
}

function NewsFeedInline({ limit = 6, isPro }: { limit?: number; isPro: boolean }) {
  const [news, setNews] = useState<NewsArticle[]>([])
  useEffect(() => {
    fetch(`/api/news?type=all&limit=${limit}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNews(data) })
      .catch(() => {})
  }, [limit])
  return (
    <>
      {news.map((article, i) => (
        <NewsCard key={article.id || i} article={article} isPro={isPro} compact />
      ))}
    </>
  )
}

// ── Main App ──
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
  const [aiData, setAIData] = useState<Record<string, { loading: boolean; text: string; factors: string[] }>>({})
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<{ loading: boolean; data: PortfolioData | null }>({ loading: false, data: null })
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [aiUsage, setAIUsage] = useState<{ daily_used: number; monthly_used: number; daily_limit: number; monthly_limit: number } | null>(null)
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({})
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [aiChatLoading, setAiChatLoading] = useState(false)
  const [aiChatMinimized, setAiChatMinimized] = useState(false)
  const [aiChatPos, setAiChatPos] = useState<{ x: number; y: number } | null>(null)
  const [aiDragging, setAiDragging] = useState(false)
  const aiDragOffset = useRef({ x: 0, y: 0 })
  const [windowWidth, setWindowWidth] = useState(0)
  const [overviewQuotes, setOverviewQuotes] = useState<Record<string, { price: number; change_percent: number }>>({})
  const [selectedAnthropicModel, setSelectedAnthropicModel] = useState('claude-sonnet-4-5')
  const [selectedOpenAIModel, setSelectedOpenAIModel] = useState('gpt-4o-mini')
  const [preferredProvider, setPreferredProvider] = useState('anthropic')
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDesktop = useIsDesktop()
  const isMobile = !isDesktop
  const { quotes: liveQuotes, isLive, stockMarketOpen, flashes } = useLivePrices(watchlist)

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

  useEffect(() => {
    if (watchlist.length) fetchQuotes(watchlist)
    fetch('/api/demo/macro').then(r => r.ok ? r.json() : null).then(d => { if (d) setMacro(d) }).catch(() => {})
    const syms = [...new Set([...watchlist])]
    syms.forEach(s => {
      if (sparklines[s]) return
      fetch(`/api/chart/${s}?timeframe=1M`).then(r => r.ok ? r.json() : null).then(d => {
        if (d?.bars?.length) setSparklines(prev => ({ ...prev, [s]: d.bars.map((b: { close: number }) => b.close) }))
      }).catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchQuotes, watchlist])

  // Fetch market overview tickers (SPY/QQQ/BTC) — independent of watchlist
  useEffect(() => {
    const fetchOverview = async () => {
      const results = await Promise.allSettled(
        ['SPY', 'QQQ', 'BTC'].map(s =>
          fetch(`/api/quote/${s}?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
        )
      )
      const map: Record<string, { price: number; change_percent: number }> = {}
      ;['SPY', 'QQQ', 'BTC'].forEach((s, i) => {
        const r = results[i]
        if (r.status === 'fulfilled' && r.value?.price != null) map[s] = r.value
      })
      setOverviewQuotes(prev => ({ ...prev, ...map }))
    }
    fetchOverview()
    const interval = setInterval(fetchOverview, 30000)
    return () => clearInterval(interval)
  }, [])

  // Re-fetch scores when Pro status loads (profile is async)
  useEffect(() => {
    if (!isPro || watchlist.length === 0) return
    fetchQuotes(watchlist)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro])

  // Live price polling
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
    const urlTab = p.get('tab')
    if (urlTab && ['scanner', 'macro', 'watchlist', 'news', 'settings'].includes(urlTab)) {
      setTab(urlTab as Tab)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetch('/api/usage/ai', { headers: { 'X-User-ID': user.id } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAIUsage(d) })
      .catch(() => {})
  }, [user])

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return
    const handler = () => setShowUserMenu(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [showUserMenu])

  // Track window width for responsive layout
  useEffect(() => {
    const update = () => setWindowWidth(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── AI Chat drag ──
  useEffect(() => {
    if (!aiDragging) return
    const handleMove = (e: MouseEvent) => setAiChatPos({ x: e.clientX - aiDragOffset.current.x, y: e.clientY - aiDragOffset.current.y })
    const handleUp = () => setAiDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp) }
  }, [aiDragging])

  const startAiDrag = (e: React.MouseEvent) => {
    const pos = aiChatPos ?? { x: windowWidth - 440, y: 80 }
    aiDragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    setAiDragging(true)
  }

  // ── AI Chat send ──
  const sendMessage = async (content: string) => {
    if (!content.trim() || aiChatLoading) return
    setChatInput('')
    setAiChatLoading(true)
    const userMsg = { role: 'user' as const, content }
    setChatMessages(prev => [...prev, userMsg])

    const context = [
      selectedTicker && quotes[selectedTicker] ? `${selectedTicker} conviction score: ${quotes[selectedTicker].conviction}/100` : null,
      macro?.regime ? `Current macro regime: ${macro.regime}` : null,
      watchlist.length > 0 ? `User watchlist: ${watchlist.join(', ')}` : null,
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch(`${BACKEND}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.id ?? '',
          'X-Is-Pro': isPro ? 'true' : 'false',
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          context,
          symbol: selectedTicker,
          model: preferredProvider === 'anthropic' ? selectedAnthropicModel : selectedOpenAIModel,
          provider: preferredProvider,
        }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response ?? data.detail ?? 'No response received.' }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setAiChatLoading(false)
    }
  }

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
          ? 'Daily AI limit reached. Resets tomorrow. Add your own key for unlimited — billed directly by your provider.'
          : 'Monthly AI limit reached. Add your own key for unlimited — billed directly by your provider.'
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

  async function saveModelPreference(provider: string, model: string) {
    if (!user) return
    try {
      await getSupabase().from('profiles').update({ preferred_ai_model: model, preferred_ai_provider: provider }).eq('id', user.id)
    } catch (e) {
      console.error('Failed to save model preference:', e)
    }
  }

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id) return
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: profile.stripe_customer_id }) })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) { console.error('Portal error:', err) }
  }

  // ── Quote helper ──
  function getQuote(sym: string): QuoteData | undefined {
    const fetched = quotes[sym]
    if (!fetched) return undefined
    const live = liveQuotes[sym]
    if (live?.price != null && live.timestamp && (!fetched || live.timestamp > (Date.now() / 1000 - 10))) {
      return { ...fetched, price: live.price, change_percent: live.change_percent }
    }
    return fetched
  }

  // ── Search Input Component ──
  function SearchInput({ inline }: { inline?: boolean }) {
    return (
      <div ref={searchRef} style={{ position: 'relative', ...(inline ? {} : { marginBottom: 14 }) }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={searchInputRef}
            type="text" value={searchInput}
            onChange={e => handleSearchInput(e.target.value.toUpperCase())}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
            placeholder="Search ticker or company..."
            disabled={searchLoading}
            style={{
              flex: 1, padding: '8px 14px', borderRadius: 6,
              border: `1px solid ${D.border}`, background: D.surface,
              color: D.text, fontFamily: D.sans, fontSize: 13, outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocusCapture={e => e.currentTarget.style.borderColor = D.accent + '60'}
            onBlurCapture={e => e.currentTarget.style.borderColor = D.border}
          />
          <button onClick={addTicker} disabled={searchLoading || !searchInput.trim()} style={{
            padding: '8px 18px', borderRadius: 6, border: 'none',
            background: D.accent, color: '#000', fontFamily: D.sans,
            fontSize: 13, fontWeight: 700, cursor: searchLoading ? 'wait' : 'pointer',
            opacity: searchLoading || !searchInput.trim() ? 0.4 : 1, whiteSpace: 'nowrap',
          }}>
            {searchLoading ? '...' : 'Add'}
          </button>
        </div>
        {searchError && (
          <p style={{ fontFamily: D.sans, fontSize: 11, color: searchError.includes('limited') ? D.accentAmber : D.red, marginTop: 6 }}>{searchError}</p>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: D.card, border: `1px solid ${D.border}`, borderRadius: 8,
            overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            {suggestions.map((s, i) => (
              <button key={s.symbol}
                onClick={() => selectSuggestion(s.symbol)}
                onMouseEnter={() => setSugIdx(i)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: i === sugIdx ? `${D.accent}10` : 'transparent',
                  transition: 'background 0.1s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 600, color: D.text }}>{s.symbol}</span>
                  {s.type === 'ETF' && <span style={{ fontFamily: D.sans, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${D.accentBlue}15`, color: D.accentBlue, fontWeight: 600 }}>ETF</span>}
                  {s.type === 'CRYPTO' && <span style={{ fontFamily: D.sans, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${D.accentAmber}15`, color: D.accentAmber, fontWeight: 600 }}>CRYPTO</span>}
                </div>
                <span style={{ fontFamily: D.sans, fontSize: 11, color: D.muted, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Portfolio Analysis ──
  async function runPortfolioAnalysis() {
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
  }

  // ════════════════════════════════════════
  // ── RENDER ──
  // ════════════════════════════════════════

  // ── SCANNER TAB ──
  function renderScanner() {
    const symbols = watchlist.length ? watchlist : []

    if (!user && !authLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontFamily: D.sans, fontSize: 24, fontWeight: 700, color: D.text, marginBottom: 8 }}>Market Scanner</div>
          <p style={{ fontFamily: D.sans, fontSize: 14, color: D.muted, marginBottom: 24 }}>Sign in to access conviction scores, macro data, and your watchlist.</p>
          <button onClick={() => setShowAuth(true)} style={{ padding: '10px 32px', borderRadius: 8, border: 'none', background: D.accent, color: '#000', fontFamily: D.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
        </div>
      )
    }

    return (
      <>
        {/* Market overview stats bar */}
        {!isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'SPY', value: overviewQuotes['SPY']?.price?.toFixed(2), change: overviewQuotes['SPY']?.change_percent },
              { label: 'QQQ', value: overviewQuotes['QQQ']?.price?.toFixed(2), change: overviewQuotes['QQQ']?.change_percent },
              { label: 'VIX', value: macro?.vix?.toFixed(1), change: null },
              { label: 'BTC', value: overviewQuotes['BTC']?.price?.toFixed(0), change: overviewQuotes['BTC']?.change_percent },
              { label: 'DXY', value: macro?.dxy?.toFixed(2), change: null },
              { label: '10Y', value: macro?.yield_10y ? `${macro.yield_10y.toFixed(2)}%` : null, change: null },
            ].map(stat => (
              <div key={stat.label} style={{ background: D.surface, borderRadius: 8, padding: '10px 14px', border: `1px solid ${D.border}` }}>
                <div style={{ fontSize: 10, color: D.muted, fontFamily: D.sans, letterSpacing: '1px', fontWeight: 600 }}>{stat.label}</div>
                <div style={{ fontFamily: D.mono, fontWeight: 700, fontSize: 16, color: D.text, marginTop: 2 }}>{stat.value ?? '—'}</div>
                {stat.change != null && (
                  <div style={{ fontSize: 11, color: stat.change >= 0 ? D.accent : D.red, fontFamily: D.mono, fontWeight: 600 }}>
                    {stat.change >= 0 ? '+' : ''}{stat.change?.toFixed(2)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: D.sans, fontWeight: 700, color: D.text, fontSize: 18 }}>Market Scanner</span>
            <span style={{ marginLeft: 12, fontSize: 12, color: D.muted, fontFamily: D.sans, fontWeight: 400 }}>
              {symbols.length} symbols{lastUpdated && <> &middot; Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
            </span>
          </div>
          <button onClick={() => setTab('watchlist')} style={{
            padding: '6px 16px', borderRadius: 6, border: `1px solid ${D.border}`,
            background: 'transparent', color: D.muted, fontFamily: D.sans, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = D.accent; e.currentTarget.style.color = D.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.muted }}>
            + Add Ticker
          </button>
        </div>

        {symbols.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontFamily: D.sans, fontSize: 14, color: D.muted, marginBottom: 16 }}>No tickers in your watchlist</p>
            <button onClick={() => setTab('watchlist')} style={{
              padding: '10px 24px', borderRadius: 6, border: `1px solid ${D.accent}40`,
              background: `${D.accent}10`, color: D.accent, fontFamily: D.sans,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Add tickers to get started</button>
          </div>
        ) : isDesktop ? (
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px' }}>
            <thead>
              <tr>
                {['SYMBOL', 'PRICE', 'CHG%', '7D TREND', 'CONVICTION', 'SIGNAL', 'OPTIONS RSI', 'ACTION'].map(h => (
                  <th key={h} style={{
                    textAlign: h === 'SYMBOL' ? 'left' : 'right',
                    padding: '8px 12px', color: D.muted,
                    fontSize: 10, fontFamily: D.sans, fontWeight: 600,
                    textTransform: 'uppercase' as const, letterSpacing: '0.8px',
                    borderBottom: `1px solid ${D.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map(symbol => {
                const quote = getQuote(symbol)
                const isUp = (quote?.change_percent ?? 0) >= 0
                const conviction = quote?.conviction ?? 0
                return (
                  <tr key={symbol}
                    onClick={() => setSelectedTicker(symbol)}
                    style={{ cursor: 'pointer', background: D.surface }}
                    onMouseEnter={e => e.currentTarget.style.background = D.card}
                    onMouseLeave={e => e.currentTarget.style.background = D.surface}>
                    <td style={{ padding: '12px', borderRadius: '6px 0 0 6px', borderLeft: `2px solid ${isUp ? D.accent : D.red}` }}>
                      <div style={{ fontFamily: D.sans, fontWeight: 700, color: D.text, fontSize: 14 }}>{symbol}</div>
                      {CRYPTO_SYMBOLS.has(symbol) && <span style={{ fontFamily: D.sans, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${D.accentAmber}15`, color: D.accentAmber, fontWeight: 600 }}>CRYPTO</span>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: D.mono, fontWeight: 600, color: D.text, fontSize: 15 }}>
                      ${quote?.price?.toFixed(2) ?? '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: D.mono, fontSize: 13, fontWeight: 600, color: isUp ? D.accent : D.red }}>
                      {isUp ? '+' : ''}{(quote?.change_percent ?? 0).toFixed(2)}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Sparkline data={sparklines[symbol] ?? []} color={isUp ? D.accent : D.red} width={80} height={28} />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <ConvictionBar score={conviction} />
                        <span style={{ fontFamily: D.mono, fontSize: 14, fontWeight: 700, color: tierColor(conviction) }}>
                          {conviction || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <SignalBadge score={conviction} />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontFamily: D.mono, fontSize: 13,
                      color: (quote?.options_flow_score ?? 50) < 30 ? D.accent : (quote?.options_flow_score ?? 50) > 70 ? D.red : D.muted }}>
                      {quote?.options_flow_score?.toFixed(1) ?? '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>
                      <button onClick={e => { e.stopPropagation(); setSelectedTicker(symbol) }}
                        style={{
                          padding: '5px 12px', background: 'transparent', border: `1px solid ${D.border}`,
                          borderRadius: 5, color: D.muted, fontSize: 11, cursor: 'pointer',
                          fontFamily: D.sans, fontWeight: 600, letterSpacing: '0.5px',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = D.accent; e.currentTarget.style.color = D.accent }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.muted }}>
                        ANALYZE
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          /* Mobile scanner cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {symbols.map(symbol => {
              const quote = getQuote(symbol)
              const isUp = (quote?.change_percent ?? 0) >= 0
              const conviction = quote?.conviction ?? 0
              return (
                <div key={symbol} onClick={() => setSelectedTicker(symbol)} style={{
                  background: D.surface, borderRadius: 10, padding: '14px 16px',
                  border: `1px solid ${D.border}`, cursor: 'pointer',
                  borderLeft: `3px solid ${isUp ? D.accent : D.red}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontFamily: D.sans, fontWeight: 700, color: D.text, fontSize: 15 }}>{symbol}</span>
                      {CRYPTO_SYMBOLS.has(symbol) && <span style={{ marginLeft: 6, fontFamily: D.sans, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${D.accentAmber}15`, color: D.accentAmber, fontWeight: 600 }}>CRYPTO</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: D.mono, fontSize: 16, fontWeight: 600, color: D.text }}>${quote?.price?.toFixed(2) ?? '—'}</div>
                      <div style={{ fontFamily: D.mono, fontSize: 12, fontWeight: 600, color: isUp ? D.accent : D.red }}>
                        {isUp ? '+' : ''}{(quote?.change_percent ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ConvictionBar score={conviction} />
                      <span style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 700, color: tierColor(conviction) }}>{conviction || '—'}</span>
                    </div>
                    <SignalBadge score={conviction} />
                  </div>
                  {sparklines[symbol] && <div style={{ marginTop: 8 }}><Sparkline data={sparklines[symbol]} color={isUp ? D.accent : D.red} width={200} height={24} /></div>}
                </div>
              )
            })}
          </div>
        )}

        {/* Latest News — stacked below scanner */}
        {symbols.length > 0 && (
          <div style={{ background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`, padding: 20, marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: D.muted, fontFamily: D.sans, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const }}>Latest News</span>
              <button onClick={() => setTab('news')} style={{ background: 'none', border: 'none', color: D.accent, fontSize: 11, fontFamily: D.sans, fontWeight: 600, cursor: 'pointer' }}>View all →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
              <NewsFeedInline limit={6} isPro={isPro} />
            </div>
          </div>
        )}
      </>
    )
  }

  // ── MACRO TAB ──
  function renderMacro() {
    const indicators = macro ? [
      { key: 'fed_rate', value: macro.fed_rate, fmt: `${macro.fed_rate?.toFixed(2)}%` },
      { key: 'vix', value: macro.vix, fmt: macro.vix?.toFixed(1) },
      { key: 'yield_10y', value: macro.yield_10y, fmt: `${macro.yield_10y?.toFixed(2)}%` },
      { key: 'dxy', value: macro.dxy, fmt: macro.dxy?.toFixed(2) },
      { key: 'unemployment', value: macro.unemployment, fmt: `${macro.unemployment?.toFixed(1)}%` },
      { key: 'credit_spread', value: macro.credit_spread, fmt: `${macro.credit_spread?.toFixed(2)}%` },
      ...(macro.yield_curve != null ? [{ key: 'yield_curve' as const, value: macro.yield_curve, fmt: `${macro.yield_curve?.toFixed(2)}%` }] : []),
      ...(macro.cpi != null ? [{ key: 'cpi' as const, value: macro.cpi, fmt: macro.cpi?.toFixed(1) }] : []),
      ...(macro.pce != null ? [{ key: 'pce' as const, value: macro.pce, fmt: macro.pce?.toFixed(1) }] : []),
      ...(macro.m2 != null ? [{ key: 'm2' as const, value: macro.m2, fmt: `$${(macro.m2 / 1000)?.toFixed(1)}T` }] : []),
      ...(macro.jobless_claims != null ? [{ key: 'jobless_claims' as const, value: macro.jobless_claims, fmt: `${(macro.jobless_claims / 1000)?.toFixed(0)}K` }] : []),
      ...(macro.retail_sales != null ? [{ key: 'retail_sales' as const, value: macro.retail_sales, fmt: `$${(macro.retail_sales / 1000)?.toFixed(0)}B` }] : []),
    ] : []

    const extraInfo: Record<string, { title: string; desc: string; getStatus: (v: number) => string }> = {
      yield_curve: { title: 'Yield Curve', desc: '10Y minus 2Y Treasury spread. Inversion (negative) historically precedes recessions.', getStatus: v => v < 0 ? 'Inverted' : v < 0.5 ? 'Flat' : 'Normal' },
      cpi: { title: 'CPI Index', desc: 'Consumer Price Index. Measures inflation in consumer goods and services.', getStatus: v => v > 310 ? 'Elevated' : 'Moderate' },
      pce: { title: 'PCE', desc: 'Personal Consumption Expenditures. The Fed\'s preferred inflation gauge.', getStatus: v => v > 20000 ? 'Elevated' : 'Moderate' },
      m2: { title: 'M2 Money Supply', desc: 'Total money supply including savings. Expansion signals liquidity, contraction signals tightening.', getStatus: v => v > 21000 ? 'Expansionary' : 'Neutral' },
      jobless_claims: { title: 'Jobless Claims', desc: 'Weekly initial unemployment claims. Rising claims signal labor market weakness.', getStatus: v => v > 250000 ? 'Elevated' : v > 200000 ? 'Moderate' : 'Low' },
      retail_sales: { title: 'Retail Sales', desc: 'Monthly retail and food services sales. Measures consumer spending strength.', getStatus: v => v > 700000 ? 'Strong' : 'Moderate' },
    }
    const allInfo = { ...MACRO_INFO, ...extraInfo }

    const regimeColor = (macro?.risk_on_score ?? 0) >= 55 ? D.accent : D.red

    return (
      <>
        <div style={{ fontFamily: D.sans, fontWeight: 700, color: D.text, fontSize: 18, marginBottom: 20 }}>Macro Dashboard</div>

        {macro ? (
          <>
            {/* Regime banner */}
            <div style={{
              background: `${regimeColor}0C`, border: `1px solid ${regimeColor}30`,
              borderRadius: 10, padding: '20px 24px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: D.sans, fontSize: 11, color: D.muted, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 4 }}>Market Regime</div>
                <div style={{ fontFamily: D.sans, fontSize: 22, fontWeight: 800, color: regimeColor }}>{macro.regime?.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: D.mono, fontSize: 36, fontWeight: 700, color: tierColor(macro.risk_on_score), lineHeight: 1 }}>{macro.risk_on_score}</div>
                <div style={{ fontFamily: D.sans, fontSize: 10, color: D.muted, marginTop: 2 }}>RISK SCORE</div>
              </div>
            </div>

            {/* Indicator grid — 4 col desktop, 2 col mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 12 }}>
              {indicators.map(ind => {
                const info = allInfo[ind.key]
                if (!info) return null
                const expanded = expandedMacro === ind.key
                const status = info.getStatus(ind.value)
                const statusColor = status.includes('Extreme') || status.includes('Stressed') || status.includes('Elevated') || status.includes('Restrictive') || status.includes('Inverted')
                  ? D.red
                  : status.includes('Moderate') || status.includes('Neutral') || status.includes('Flat')
                    ? D.accentAmber
                    : D.accent
                return (
                  <div key={ind.key}
                    onClick={() => setExpandedMacro(expanded ? null : ind.key)}
                    style={{
                      background: D.surface, borderRadius: 8, padding: '16px 20px',
                      border: `1px solid ${D.border}`, cursor: 'pointer',
                      transition: 'border-color 0.15s',
                      ...(expanded && !isDesktop ? { gridColumn: 'span 2' } : {}),
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = D.border + 'cc'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 10, color: D.muted, fontFamily: D.sans, textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 600 }}>{info.title}</div>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                    </div>
                    <div style={{ fontFamily: D.mono, fontSize: 24, fontWeight: 700, color: D.text, margin: '6px 0 4px' }}>{ind.fmt}</div>
                    <div style={{ fontSize: 11, fontFamily: D.sans, color: statusColor, fontWeight: 500 }}>{status}</div>
                    {expanded && (
                      <div style={{ marginTop: 12, borderTop: `1px solid ${D.border}`, paddingTop: 12 }}>
                        <p style={{ fontFamily: D.sans, fontSize: 12, color: D.muted, lineHeight: 1.6 }}>{info.desc}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Fed & Regulatory News below indicators */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontFamily: D.sans, fontWeight: 700, color: D.text, marginBottom: 12 }}>Fed & Regulatory News</div>
              <MacroNewsFeed />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: D.muted, fontFamily: D.sans, fontSize: 14 }}>Loading macro data...</div>
        )}
      </>
    )
  }

  // ── WATCHLIST TAB ──
  function renderWatchlist() {
    if (!user && !authLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontFamily: D.sans, fontSize: 24, fontWeight: 700, color: D.text, marginBottom: 8 }}>Watchlist</div>
          <p style={{ fontFamily: D.sans, fontSize: 14, color: D.muted, marginBottom: 24 }}>Sign in to build your watchlist.</p>
          <button onClick={() => setShowAuth(true)} style={{ padding: '10px 32px', borderRadius: 8, border: 'none', background: D.accent, color: '#000', fontFamily: D.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
        </div>
      )
    }

    const atLimit = !isPro && watchlist.length >= FREE_WATCHLIST_LIMIT

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontFamily: D.sans, fontWeight: 700, color: D.text, fontSize: 18 }}>Watchlist</span>
            <span style={{ marginLeft: 12, fontFamily: D.sans, fontSize: 12, color: D.muted }}>
              {watchlist.length}{isPro ? ' symbols' : ` / ${FREE_WATCHLIST_LIMIT}`}
              {isPro && <span style={{ marginLeft: 8, fontFamily: D.sans, fontSize: 10, padding: '2px 6px', borderRadius: 3, background: `${D.accent}15`, color: D.accent, fontWeight: 600 }}>PRO</span>}
            </span>
          </div>
          {watchlist.length >= 2 && isPro && (
            <button onClick={runPortfolioAnalysis} disabled={portfolioAnalysis.loading} style={{
              padding: '6px 16px', borderRadius: 6, border: `1px solid ${D.accent}40`,
              background: `${D.accent}10`, color: D.accent, fontFamily: D.sans,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              opacity: portfolioAnalysis.loading ? 0.6 : 1,
            }}>
              {portfolioAnalysis.loading ? 'Analyzing...' : 'AI Portfolio Analysis'}
            </button>
          )}
        </div>

        {user && <SearchInput />}

        {/* Portfolio analysis result */}
        {showPortfolio && portfolioAnalysis.data && (
          <div style={{ background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`, padding: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: D.sans, fontSize: 11, color: D.muted, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }}>Portfolio Analysis</div>
            {portfolioAnalysis.data.top_pick && (
              <div style={{ marginBottom: 12, padding: '12px 16px', background: `${D.accent}0A`, borderRadius: 8, border: `1px solid ${D.accent}25` }}>
                <div style={{ fontFamily: D.sans, fontSize: 10, color: D.accent, marginBottom: 4, fontWeight: 600 }}>TOP PICK</div>
                <div style={{ fontFamily: D.sans, fontSize: 16, fontWeight: 700, color: D.text }}>
                  {portfolioAnalysis.data.top_pick.symbol}
                  <span style={{ fontSize: 13, color: D.accent, marginLeft: 10 }}>{portfolioAnalysis.data.top_pick.conviction}/100</span>
                </div>
                <div style={{ fontFamily: D.sans, fontSize: 12, color: D.muted, marginTop: 4 }}>{portfolioAnalysis.data.top_pick.reasoning}</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: D.sans, fontSize: 12, color: D.muted }}>Regime alignment</span>
              <span style={{ fontFamily: D.sans, fontSize: 12, fontWeight: 600, color:
                portfolioAnalysis.data.regime_alignment === 'aligned' ? D.accent :
                portfolioAnalysis.data.regime_alignment === 'misaligned' ? D.red : D.accentAmber }}>
                {portfolioAnalysis.data.regime_alignment.toUpperCase()}
              </span>
            </div>
            {portfolioAnalysis.data.risk_factors.length > 0 && (
              <div>
                <div style={{ fontFamily: D.sans, fontSize: 10, color: D.muted, marginBottom: 6, fontWeight: 600 }}>RISK FACTORS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {portfolioAnalysis.data.risk_factors.map((f, i) => (
                    <span key={i} style={{ fontFamily: D.sans, fontSize: 11, padding: '4px 8px', borderRadius: 4, background: `${D.red}12`, color: D.red }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Watchlist cards — grid with mini charts */}
        {watchlist.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: 12 }}>
            {watchlist.map(sym => {
              const d = getQuote(sym)
              const isUp = (d?.change_percent ?? 0) >= 0
              const conviction = d?.conviction ?? 0
              return (
                <div key={sym} onClick={() => setSelectedTicker(sym)} style={{
                  background: D.surface, borderRadius: 12, padding: 20, border: `1px solid ${D.border}`,
                  cursor: 'pointer', transition: 'border-color 0.15s',
                  borderLeft: `3px solid ${isUp ? D.accent : D.red}`,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = isUp ? D.accent : D.red}
                onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.borderLeftColor = isUp ? D.accent : D.red }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: D.sans, fontWeight: 800, fontSize: 18, color: D.text }}>{sym}</div>
                      <div style={{ fontFamily: D.mono, fontSize: 20, fontWeight: 700, color: D.text, marginTop: 2 }}>${d?.price?.toFixed(2) ?? '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: D.mono, fontSize: 14, color: isUp ? D.accent : D.red, fontWeight: 600 }}>
                        {isUp ? '+' : ''}{(d?.change_percent ?? 0).toFixed(2)}%
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <ConvictionBar score={conviction} />
                        <span style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 700, color: tierColor(conviction) }}>{conviction || '—'}</span>
                      </div>
                    </div>
                  </div>
                  {sparklines[sym] && <Sparkline data={sparklines[sym]} color={isUp ? D.accent : D.red} width={280} height={50} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <SignalBadge score={conviction} />
                    <button onClick={e => { e.stopPropagation(); removeTicker(sym) }} style={{
                      background: 'none', border: 'none', color: D.muted, cursor: 'pointer', fontSize: 16, padding: '2px 6px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = D.red}
                    onMouseLeave={e => e.currentTarget.style.color = D.muted}>×</button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: D.muted, fontFamily: D.sans, fontSize: 14 }}>
            {user ? 'Search and add tickers above' : 'Sign in to build your watchlist'}
          </div>
        )}

        {atLimit && (
          <a href="/#pricing" style={{
            display: 'block', textAlign: 'center', padding: 12, borderRadius: 8, marginTop: 12,
            background: `${D.accent}08`, border: `1px solid ${D.accent}20`,
            color: D.accent, fontFamily: D.sans, fontSize: 12, fontWeight: 600, textDecoration: 'none',
          }}>Upgrade to Pro for unlimited watchlist</a>
        )}

        {watchlist.length >= 2 && !isPro && (
          <div style={{ position: 'relative', marginTop: 16 }}>
            <button disabled style={{
              width: '100%', padding: 12, borderRadius: 8, border: 'none',
              background: `${D.muted}10`, fontFamily: D.sans, fontSize: 13,
              color: D.muted, cursor: 'default',
            }}>AI Portfolio Analysis</button>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              <a href="/#pricing" style={{ fontFamily: D.sans, fontSize: 11, color: D.accent, textDecoration: 'none', fontWeight: 600 }}>Upgrade to Pro</a>
            </div>
          </div>
        )}

        {/* Watchlist News */}
        {watchlist.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontFamily: D.sans, fontWeight: 700, color: D.text, marginBottom: 12 }}>Watchlist News</div>
            <WatchlistNewsFeed symbols={watchlist} isPro={isPro} />
          </div>
        )}
      </>
    )
  }

  // ── SETTINGS TAB ──
  function renderSettings() {
    const cardStyle: React.CSSProperties = {
      background: D.surface, borderRadius: 10, padding: 24, border: `1px solid ${D.border}`, marginBottom: 12,
    }
    const labelStyle: React.CSSProperties = { fontFamily: D.sans, fontSize: 10, color: D.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }

    return (
      <>
        <div style={{ fontFamily: D.sans, fontWeight: 700, color: D.text, fontSize: 18, marginBottom: 20 }}>Settings</div>
        {user ? (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 12, maxWidth: 900 }}>
            {/* Account */}
            <div style={cardStyle}>
              <div style={labelStyle}>Account</div>
              <div style={{ fontFamily: D.sans, fontSize: 14, color: D.text, marginBottom: 12 }}>{user.email}</div>
              <a href="/account" style={{
                display: 'block', textAlign: 'center', padding: 10, borderRadius: 6,
                background: `${D.muted}15`, border: `1px solid ${D.border}`,
                color: D.text, fontFamily: D.sans, fontSize: 12, fontWeight: 600, textDecoration: 'none',
              }}>Manage Account & Billing</a>
            </div>

            {/* Subscription */}
            <div style={cardStyle}>
              <div style={labelStyle}>Subscription</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontFamily: D.sans, fontSize: 14, color: D.text }}>Status</span>
                <span style={{
                  fontFamily: D.sans, fontSize: 12, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 4,
                  background: isPro ? `${D.accent}15` : `${D.muted}15`,
                  color: isPro ? D.accent : D.muted,
                }}>{isPro ? 'PRO' : 'FREE'}</span>
              </div>
              {isPro && profile?.subscription_source === 'stripe' && (
                <button onClick={handleManageSubscription} style={{
                  width: '100%', padding: 10, borderRadius: 6,
                  border: `1px solid ${D.border}`, background: 'transparent',
                  color: D.text, fontFamily: D.sans, fontSize: 12, cursor: 'pointer',
                }}>Manage subscription</button>
              )}
              {isPro && profile?.subscription_source === 'apple' && (
                <p style={{ fontFamily: D.sans, fontSize: 12, color: D.muted }}>Manage in iPhone Settings &gt; Subscriptions</p>
              )}
              {!isPro && (
                <a href="/#pricing" style={{
                  display: 'block', textAlign: 'center', padding: 10, borderRadius: 6,
                  background: `${D.accent}15`, color: D.accent, border: `1px solid ${D.accent}25`,
                  fontFamily: D.sans, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                }}>Upgrade to Pro</a>
              )}
            </div>

            {/* AI Keys + Model Selector */}
            <div style={cardStyle}>
              <div style={labelStyle}>Bring Your Own Key</div>
              <p style={{ fontFamily: D.sans, fontSize: 11, color: D.muted, marginBottom: 12 }}>
                Billed directly by your chosen AI provider at their rates. XAtlas has no markup.
              </p>
              {isPro ? (
                <a href="/account" style={{
                  display: 'block', textAlign: 'center', padding: 10, borderRadius: 6,
                  background: `${D.muted}15`, border: `1px solid ${D.border}`,
                  color: D.text, fontFamily: D.sans, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                }}>Manage API Keys</a>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  <p style={{ fontFamily: D.sans, fontSize: 12, color: D.muted, margin: '8px 0' }}>API Keys require Pro</p>
                  <a href="/#pricing" style={{
                    padding: '6px 16px', borderRadius: 4, background: `${D.accent}12`,
                    color: D.accent, fontFamily: D.sans, fontSize: 11, fontWeight: 600, textDecoration: 'none',
                  }}>Start free trial</a>
                </div>
              )}
            </div>

            {/* AI Usage */}
            {aiUsage && (
              <div style={cardStyle}>
                <div style={labelStyle}>AI Usage</div>
                {[
                  { label: 'Today', used: aiUsage.daily_used, limit: aiUsage.daily_limit },
                  { label: 'Month', used: aiUsage.monthly_used, limit: aiUsage.monthly_limit },
                ].map(u => (
                  <div key={u.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: D.sans, fontSize: 12, color: D.muted }}>{u.label}</span>
                      <span style={{ fontFamily: D.mono, fontSize: 12, color: u.used >= u.limit ? D.red : D.text }}>{u.used} / {u.limit}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: D.border, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min((u.used / u.limit) * 100, 100)}%`, height: '100%', borderRadius: 2, background: u.used >= u.limit ? D.red : D.accent, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
                <p style={{ fontFamily: D.sans, fontSize: 11, color: D.muted }}>
                  Bring your own key for unlimited AI. Billed directly by your chosen provider — no markup. <a href="/account" style={{ color: D.accent, textDecoration: 'none', fontWeight: 600 }}>Add key</a>
                </p>
              </div>
            )}

            {/* Legal — full width */}
            <div style={{ ...cardStyle, ...(isDesktop ? { gridColumn: 'span 2' } : {}) }}>
              <div style={labelStyle}>Legal</div>
              {[
                { label: 'Privacy Policy', href: 'https://www.iubenda.com/privacy-policy/19345970' },
                { label: 'Terms of Service', href: 'https://www.iubenda.com/terms-and-conditions/19345970' },
              ].map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', textDecoration: 'none',
                }}>
                  <span style={{ fontFamily: D.sans, fontSize: 13, color: D.text }}>{l.label}</span>
                  <span style={{ fontFamily: D.sans, fontSize: 13, color: D.muted }}>&rsaquo;</span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`, padding: 24 }}>
            <p style={{ fontFamily: D.sans, fontSize: 14, color: D.muted, marginBottom: 12 }}>Sign in to access your subscription and settings.</p>
            <button onClick={() => setShowAuth(true)} style={{
              width: '100%', padding: 12, borderRadius: 8, border: 'none',
              background: D.accent, color: '#000', fontFamily: D.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Sign In</button>
          </div>
        )}
      </>
    )
  }

  // ── DETAIL PANEL ──
  function renderDetailPanel() {
    if (!selectedTicker) return null
    const sym = selectedTicker
    const d = getQuote(sym)
    const isCrypto = CRYPTO_SYMBOLS.has(sym)
    const ai = aiData[sym]
    if (!ai && isPro) fetchAI(sym)
    const isUp = (d?.change_percent ?? 0) >= 0

    return (
      <>
        {isMobile && <div onClick={() => setSelectedTicker(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 299 }} />}

        <div style={{
          position: 'fixed', right: 0, top: isMobile ? 0 : 48, bottom: isMobile ? 60 : 0,
          width: isMobile ? '100%' : 580,
          background: '#0A0D14',
          borderLeft: isMobile ? 'none' : `1px solid ${D.border}`,
          overflowY: 'auto',
          zIndex: 300,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Panel header */}
          <div style={{
            padding: '16px 24px', borderBottom: `1px solid ${D.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, background: '#0A0D14', zIndex: 10,
          }}>
            <div>
              <span style={{ fontFamily: D.sans, fontWeight: 800, fontSize: 20, color: D.text }}>{sym}</span>
              {isCrypto && <span style={{ marginLeft: 8, fontFamily: D.sans, fontSize: 9, padding: '2px 6px', borderRadius: 3, background: `${D.accentAmber}15`, color: D.accentAmber, fontWeight: 600 }}>CRYPTO</span>}
              <span style={{ marginLeft: 12, fontFamily: D.mono, fontSize: 18, color: D.text }}>
                ${d?.price?.toFixed(isCrypto && (d?.price ?? 0) < 1 ? 6 : 2) ?? '—'}
              </span>
              <span style={{ marginLeft: 8, fontFamily: D.mono, fontSize: 13, color: isUp ? D.accent : D.red }}>
                {isUp ? '+' : ''}{(d?.change_percent ?? 0).toFixed(2)}%
              </span>
            </div>
            <button onClick={() => setSelectedTicker(null)} style={{
              background: 'none', border: 'none', color: D.muted, fontSize: 20, cursor: 'pointer', padding: 4,
            }}>✕</button>
          </div>

          {/* Panel content */}
          <div style={{ padding: '20px 24px', flex: 1 }}>
            {/* Chart */}
            <div style={{ marginBottom: 20 }}>
              <StockChart symbol={sym} isCrypto={isCrypto} livePrice={liveQuotes[sym.toUpperCase()]?.price ?? liveQuotes[sym]?.price} isLive={!!liveQuotes[sym.toUpperCase()]?.is_live} />
            </div>

            {/* Conviction score */}
            <div style={{
              background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
            }}>
              <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke={D.border} strokeWidth="4" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke={tierColor(d?.conviction ?? 0)} strokeWidth="4"
                    strokeDasharray={`${(d?.conviction ?? 0) * 1.508} 999`}
                    strokeLinecap="round" transform="rotate(-90 28 28)" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: D.mono, fontSize: 16, fontWeight: 700, color: tierColor(d?.conviction ?? 0) }}>
                  {d?.conviction ?? '—'}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: D.sans, fontSize: 14, fontWeight: 700, color: D.text }}>
                  {(d?.conviction ?? 0) >= 75 ? 'STRONG' : (d?.conviction ?? 0) >= 50 ? 'MODERATE' : 'NOISE'}
                </div>
                <div style={{ fontFamily: D.sans, fontSize: 11, color: D.muted, marginTop: 2 }}>Conviction Score</div>
              </div>
            </div>

            {/* Score breakdown — Pro */}
            {isPro && d ? (
              <div style={{ background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontFamily: D.sans, fontSize: 10, color: D.muted, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }}>Score Breakdown</div>
                {[
                  { l: 'Squeeze', v: d.squeeze_score },
                  { l: 'Options Flow', v: d.options_flow_score },
                  { l: 'Macro', v: d.macro_score },
                ].map(b => (
                  <div key={b.l} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: D.sans, fontSize: 12, color: D.muted }}>{b.l}</span>
                      <span style={{ fontFamily: D.mono, fontSize: 12, color: tierColor(b.v ?? 50) }}>{b.v ?? '—'}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: D.border, overflow: 'hidden' }}>
                      <div style={{ width: `${b.v ?? 50}%`, height: '100%', borderRadius: 2, background: tierColor(b.v ?? 50), transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !isPro ? (
              <div style={{ background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`, padding: '16px 20px', position: 'relative', marginBottom: 16 }}>
                <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
                  <div style={{ fontFamily: D.sans, fontSize: 10, color: D.muted, letterSpacing: '1px', marginBottom: 12 }}>SCORE BREAKDOWN</div>
                  {['Squeeze', 'Options Flow', 'Macro'].map(l => (
                    <div key={l} style={{ marginBottom: 8 }}>
                      <div style={{ fontFamily: D.sans, fontSize: 12, color: D.muted, marginBottom: 4 }}>{l}</div>
                      <div style={{ height: 4, borderRadius: 2, background: D.border }} />
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  <a href="/#pricing" style={{ fontFamily: D.sans, fontSize: 11, color: D.accent, textDecoration: 'none', fontWeight: 600 }}>Upgrade to Pro</a>
                </div>
              </div>
            ) : null}

            {/* Options panels (stocks only) */}
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
            <div style={{ background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontFamily: D.sans, fontSize: 10, color: D.muted, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }}>AI Analysis</div>
              {isPro ? (
                ai?.loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 14, borderRadius: 4, background: D.border, width: `${100 - i * 15}%` }} />)}
                  </div>
                ) : ai ? (
                  <>
                    <p style={{ fontFamily: D.sans, fontSize: 13, color: D.text, lineHeight: 1.7, marginBottom: 8, opacity: 0.85 }}>{ai.text}</p>
                    {ai.factors.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {ai.factors.map(f => (
                          <span key={f} style={{ fontFamily: D.sans, fontSize: 10, padding: '3px 8px', borderRadius: 4, background: `${D.accent}10`, color: D.accent, fontWeight: 600 }}>{f}</span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontFamily: D.sans, fontSize: 13, color: D.muted }}>Loading analysis...</p>
                )
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ filter: 'blur(4px)', userSelect: 'none' }}>
                    <p style={{ fontFamily: D.sans, fontSize: 13, color: D.muted, lineHeight: 1.7 }}>
                      Based on current squeeze conditions and macro regime alignment, this ticker shows moderate-to-strong conviction with favorable positioning across multiple factors...
                    </p>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(6,8,16,0.6)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    <p style={{ fontFamily: D.sans, fontSize: 12, color: D.muted }}>AI Analysis requires Pro</p>
                    <a href="/#pricing" style={{ fontFamily: D.sans, fontSize: 11, color: D.accent, textDecoration: 'none', fontWeight: 600 }}>Start free trial</a>
                  </div>
                </div>
              )}
            </div>

            {/* Ticker-specific news */}
            <TickerNews symbol={sym} />
          </div>
        </div>
      </>
    )
  }

  // ════════════════════════════════════════
  // ── MAIN LAYOUT ──
  // ════════════════════════════════════════

  if (authLoading) {
    return (
      <div style={{ background: D.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: D.sans, fontSize: 14, color: D.muted }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ background: D.bg, minHeight: '100dvh', color: D.text }}>
      {showAuth && <AuthModal open={true} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}

      {/* ── TOP BAR (48px, fixed, full width) ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 48, background: D.bg,
        borderBottom: `1px solid ${D.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 24px', zIndex: 200, gap: isMobile ? 16 : 32,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8, flexShrink: 0, textDecoration: 'none' }}>
          <img src="/xatlas-logo.png" width={28} height={28} style={{ borderRadius: 6 }} alt="XAtlas" />
          {!isMobile && <span style={{ fontFamily: D.sans, fontWeight: 800, color: D.text, fontSize: 16, letterSpacing: '-0.3px' }}>XATLAS</span>}
        </Link>

        {/* Nav tabs — horizontal, Bloomberg style */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 0, height: 48 }}>
            {(['scanner', 'macro', 'watchlist', 'news', 'settings'] as Tab[]).map(t => (
              <button key={t} onClick={() => { setSelectedTicker(null); setTab(t) }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 16px', height: 48,
                borderBottom: tab === t ? `2px solid ${D.accent}` : '2px solid transparent',
                color: tab === t ? D.text : D.muted,
                fontFamily: D.sans, fontWeight: 600, fontSize: 13,
                textTransform: 'uppercase' as const, letterSpacing: '0.8px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (tab !== t) e.currentTarget.style.color = D.text }}
              onMouseLeave={e => { if (tab !== t) e.currentTarget.style.color = D.muted }}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Right side — AI + live indicator + user */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
          {/* AI Assistant button */}
          {!isMobile && (
            <button onClick={() => setShowAIChat(!showAIChat)} style={{
              padding: '5px 12px', borderRadius: 6,
              background: showAIChat ? D.accent : 'transparent',
              border: `1px solid ${D.accent}40`,
              color: showAIChat ? '#000' : D.accent,
              fontFamily: D.sans, fontWeight: 600, fontSize: 11,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              ✦ AI
            </button>
          )}

          {/* Market hours + crypto badge */}
          {!isMobile && <MarketHoursWidget />}
          {!isMobile && (
            <div style={{ fontSize: 10, padding: '4px 10px', background: `${D.accent}10`, border: `1px solid ${D.accent}30`, borderRadius: 6, color: D.accent, fontFamily: D.sans, fontWeight: 600 }}>
              ₿ CRYPTO 24/7
            </div>
          )}

          {/* Live data indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isLive ? D.accent : D.muted,
              boxShadow: isLive ? `0 0 8px ${D.accent}60` : 'none',
            }} />
            <span style={{ fontFamily: D.mono, fontSize: 10, color: isLive ? D.accent : D.muted, fontWeight: 600, letterSpacing: '0.5px' }}>
              {isLive ? 'LIVE' : !stockMarketOpen ? 'CLOSED' : 'DELAYED'}
            </span>
          </div>

          {/* User menu */}
          {!authLoading && (
            user ? (
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: D.accent, border: 'none', cursor: 'pointer',
                  color: '#000', fontWeight: 700, fontSize: 13, fontFamily: D.sans,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', right: 0, top: 40,
                    background: D.card, border: `1px solid ${D.border}`,
                    borderRadius: 10, padding: '6px 0', minWidth: 200, zIndex: 1000,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ padding: '8px 16px', color: D.muted, fontSize: 11, fontFamily: D.sans, borderBottom: `1px solid ${D.border}` }}>
                      {user.email}
                      {isPro && <span style={{ marginLeft: 8, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${D.accent}15`, color: D.accent, fontWeight: 700 }}>PRO</span>}
                    </div>
                    <a href="/account" style={{ display: 'block', padding: '10px 16px', color: D.text, textDecoration: 'none', fontSize: 13, fontFamily: D.sans }}>My Account</a>
                    <button onClick={async () => { await signOut(); setShowUserMenu(false) }} style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 16px', color: D.red,
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: D.sans,
                    }}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{
                padding: '6px 16px', borderRadius: 6, border: 'none',
                background: D.accent, color: '#000', fontFamily: D.sans,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>Sign In</button>
            )
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        marginTop: 48,
        marginBottom: isMobile ? 60 : 0,
        minHeight: 'calc(100vh - 48px)',
        background: D.bg,
        padding: isMobile ? '16px 16px' : '20px 24px',
        marginRight: selectedTicker && !isMobile ? 580 : 0,
        transition: 'margin-right 0.2s ease',
      }}>
        {tab === 'scanner' && renderScanner()}
        {tab === 'macro' && renderMacro()}
        {tab === 'watchlist' && renderWatchlist()}
        {tab === 'news' && <NewsTab isPro={isPro} />}
        {tab === 'settings' && renderSettings()}
      </main>

      {/* ── AI CHAT — Floating Draggable Window ── */}
      {showAIChat && !isMobile && (() => {
        const pos = aiChatPos ?? { x: windowWidth - 440, y: 80 }
        return (
          <div style={{
            position: 'fixed', left: pos.x, top: pos.y,
            width: 400, height: aiChatMinimized ? 44 : 560,
            background: '#0A0D14', border: `1px solid ${D.border}`, borderRadius: 12,
            zIndex: 500, display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden',
            transition: aiDragging ? 'none' : 'height 0.2s ease',
          }}>
            {/* Draggable header */}
            <div onMouseDown={startAiDrag} style={{
              padding: '10px 16px', borderBottom: aiChatMinimized ? 'none' : `1px solid ${D.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: aiDragging ? 'grabbing' : 'grab', background: D.card, userSelect: 'none', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: D.accent, fontSize: 14 }}>✦</span>
                <span style={{ fontFamily: D.sans, fontWeight: 700, color: D.text, fontSize: 14 }}>AI Assistant</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={e => { e.stopPropagation(); setAiChatMinimized(!aiChatMinimized) }}
                  style={{ background: 'none', border: 'none', color: D.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>—</button>
                <button onClick={e => { e.stopPropagation(); setShowAIChat(false) }}
                  style={{ background: 'none', border: 'none', color: D.muted, cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
            </div>

            {!aiChatMinimized && (
              <>
                {/* Model selector + context */}
                <div style={{ padding: '8px 16px', borderBottom: `1px solid ${D.border}`, display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
                  {/* BYOK Anthropic models */}
                  {isPro && [
                    { id: 'claude-haiku-4-5', label: 'Haiku', desc: 'Fast' },
                    { id: 'claude-sonnet-4-5', label: 'Sonnet', desc: 'Balanced' },
                    { id: 'claude-opus-4-5', label: 'Opus', desc: 'Powerful' },
                  ].map(m => (
                    <button key={m.id} onClick={() => { setSelectedAnthropicModel(m.id); setPreferredProvider('anthropic'); saveModelPreference('anthropic', m.id) }}
                      style={{
                        padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                        background: selectedAnthropicModel === m.id && preferredProvider === 'anthropic' ? `${D.accent}20` : 'transparent',
                        border: `1px solid ${selectedAnthropicModel === m.id && preferredProvider === 'anthropic' ? D.accent : D.border}`,
                        color: selectedAnthropicModel === m.id && preferredProvider === 'anthropic' ? D.accent : D.muted,
                        fontSize: 11, fontFamily: D.sans, fontWeight: 600,
                      }}>
                      {m.label}
                    </button>
                  ))}
                  {/* No BYOK — show default */}
                  {!isPro && (
                    <div style={{ fontSize: 11, color: D.muted, fontFamily: D.sans }}>
                      {isPro ? `● Sonnet 4.5 · XAtlas Pro` : `● Haiku 4.5 · XAtlas Free`}
                      {' · '}
                      <button onClick={() => setTab('settings')} style={{ background: 'none', border: 'none', color: D.accent, cursor: 'pointer', fontSize: 11, padding: 0, fontFamily: D.sans }}>Add your own key →</button>
                    </div>
                  )}
                  {/* Context badges */}
                  {selectedTicker && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: `${D.accentBlue}12`, color: D.accentBlue, fontFamily: D.sans, fontWeight: 600, marginLeft: 'auto' }}>{selectedTicker}</span>}
                </div>

                {/* Suggested prompts */}
                {chatMessages.length === 0 && (
                  <div style={{ padding: '12px 16px', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: D.muted, marginBottom: 8, fontFamily: D.sans, fontWeight: 600, letterSpacing: '0.5px' }}>SUGGESTED</div>
                    {[
                      selectedTicker ? `Analyze ${selectedTicker} conviction score` : 'What does the current macro regime mean for equities?',
                      'Which watchlist stock has the strongest setup?',
                      'Summarize today\'s most important news',
                    ].map((prompt, i) => (
                      <button key={i} onClick={() => sendMessage(prompt)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: 4,
                          background: D.card, border: `1px solid ${D.border}`, borderRadius: 6,
                          color: D.muted, fontSize: 11, cursor: 'pointer', fontFamily: D.sans, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = D.accent; e.currentTarget.style.color = D.text }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.muted }}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%', padding: '8px 12px',
                        borderRadius: msg.role === 'user' ? '10px 10px 4px 10px' : '10px 10px 10px 4px',
                        background: msg.role === 'user' ? `${D.accent}18` : D.card,
                        border: `1px solid ${msg.role === 'user' ? `${D.accent}35` : D.border}`,
                        color: D.text, fontSize: 12, lineHeight: 1.6, fontFamily: D.sans, whiteSpace: 'pre-wrap',
                      }}>{msg.content}</div>
                    </div>
                  ))}
                  {aiChatLoading && (
                    <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: D.accent, opacity: 0.6 }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${D.border}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput) } }}
                      placeholder="Ask about markets, news..."
                      style={{
                        flex: 1, background: D.card, border: `1px solid ${D.border}`, borderRadius: 6,
                        padding: '8px 12px', color: D.text, fontSize: 12, fontFamily: D.sans, outline: 'none',
                      }}
                    />
                    <button onClick={() => sendMessage(chatInput)} disabled={!chatInput.trim() || aiChatLoading}
                      style={{
                        padding: '8px 12px', background: D.accent, border: 'none', borderRadius: 6,
                        color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13,
                        opacity: !chatInput.trim() || aiChatLoading ? 0.4 : 1,
                      }}>↑</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* ── DETAIL PANEL (right slide-in) ── */}
      {renderDetailPanel()}

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          height: 60, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTop: `1px solid ${D.border}`, background: D.bg, zIndex: 200,
        }}>
          {([
            { id: 'scanner' as Tab, icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
            { id: 'macro' as Tab, icon: 'M3 20h18M6 16V10M10 16V6M14 16V12M18 16V8' },
            { id: 'watchlist' as Tab, icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
            { id: 'news' as Tab, icon: 'M4 4h16v16H4zM4 8h16M8 4v16' },
            { id: 'settings' as Tab, icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z' },
          ]).map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => { setSelectedTicker(null); setTab(t.id) }} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer', padding: '6px 16px',
              }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? D.accent : D.muted} strokeWidth={1.8} strokeLinecap="round"><path d={t.icon} /></svg>
                <span style={{ fontFamily: D.sans, fontSize: 10, color: active ? D.accent : D.muted, fontWeight: active ? 700 : 500 }}>{t.id}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
