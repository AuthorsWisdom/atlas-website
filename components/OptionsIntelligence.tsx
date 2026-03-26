'use client'

import { useEffect, useState } from 'react'

const mono = "'JetBrains Mono', monospace"
const GREEN = '#1D9E75'
const RED = '#E24B4A'

interface RSIPoint { timestamp: number; value: number }
interface MACDPoint { timestamp: number; value: number; signal: number; histogram: number }
interface ActiveContract {
  contract: string; type: string; strike: number; expiration: string
  last_price: number | null; day_volume: number; open_interest: number
  iv: number | null; delta: number | null
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function RSISparkline({ data }: { data: RSIPoint[] }) {
  if (data.length < 2) return null
  const values = data.map(d => d.value).reverse()
  const min = Math.min(...values, 20)
  const max = Math.max(...values, 80)
  const range = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 200},${55 - ((v - min) / range) * 50}`).join(' ')
  return (
    <div style={{ position: 'relative', height: 60, marginTop: 8 }}>
      <div style={{ position: 'absolute', top: `${((max - 70) / range) * 100}%`, left: 0, right: 0, borderTop: `1px dashed ${RED}33` }} />
      <div style={{ position: 'absolute', top: `${((max - 30) / range) * 100}%`, left: 0, right: 0, borderTop: `1px dashed ${GREEN}33` }} />
      <svg viewBox="0 0 200 60" style={{ width: '100%', height: 60 }} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke="#a855f7" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

export default function OptionsIntelligence({ symbol, isPro }: { symbol: string; isPro: boolean }) {
  const [rsiData, setRsiData] = useState<RSIPoint[]>([])
  const [macdData, setMacdData] = useState<MACDPoint[]>([])
  const [activeContracts, setActiveContracts] = useState<ActiveContract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/options/indicators/${symbol}`).then(r => r.ok ? r.json() : { rsi: [], macd: [] }),
      fetch(`/api/options/snapshot/${symbol}`).then(r => r.ok ? r.json() : { active_contracts: [] }),
    ]).then(([ind, snap]) => {
      setRsiData(ind.rsi ?? [])
      setMacdData(ind.macd ?? [])
      setActiveContracts(snap.active_contracts ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [symbol])

  const latestRSI = rsiData.length > 0 ? rsiData[0].value : null
  const latestMACD = macdData.length > 0 ? macdData[0] : null

  if (!isPro) {
    return (
      <div style={{ background: '#111', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
        <div style={{ fontFamily: mono, fontSize: 13, color: '#555', letterSpacing: '0.1em', marginBottom: 12 }}>OPTIONS INTELLIGENCE</div>
        <div style={{ filter: 'blur(4px)', opacity: 0.3, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 8, padding: 14, height: 70 }} />
            <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 8, padding: 14, height: 70 }} />
          </div>
          <div style={{ height: 60, background: '#0a0a0a', borderRadius: 8 }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
          <p style={{ fontFamily: mono, fontSize: 13, color: '#888' }}>Options intelligence requires Pro</p>
          <a href="/#pricing" style={{ fontFamily: mono, fontSize: 11, color: GREEN, textDecoration: 'none', background: `${GREEN}1a`, padding: '4px 12px', borderRadius: 4, border: `1px solid ${GREEN}33` }}>Upgrade</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ background: '#111', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: mono, fontSize: 13, color: '#555', letterSpacing: '0.1em', marginBottom: 12 }}>OPTIONS INTELLIGENCE</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[1, 2].map(i => <div key={i} style={{ flex: 1, height: 70, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      </div>
    )
  }

  if (!latestRSI && !latestMACD) {
    return (
      <div style={{ background: '#0B0E1A', borderRadius: 10, padding: 16, border: '1px solid #1A2038' }}>
        <div style={{ fontSize: 13, color: '#4A5575', fontFamily: "'DM Sans', sans-serif" }}>Options indicators available during market hours</div>
        <div style={{ fontSize: 11, color: '#4A5575', marginTop: 4 }}>RSI and MACD signals refresh when options chains are live</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#111', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontFamily: mono, fontSize: 13, color: '#555', letterSpacing: '0.1em', marginBottom: 14 }}>OPTIONS INTELLIGENCE</div>

      {/* RSI + MACD cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {/* Options RSI */}
        {latestRSI !== null && (
          <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#555', marginBottom: 6 }}>OPTIONS RSI (14)</div>
            <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: latestRSI > 70 ? RED : latestRSI < 30 ? GREEN : '#f0ede6' }}>
              {latestRSI.toFixed(1)}
            </div>
            <div style={{ fontFamily: mono, fontSize: 13, color: '#888', marginTop: 4 }}>
              {latestRSI > 70 ? 'Overbought — options expensive' : latestRSI < 30 ? 'Oversold — options cheap' : 'Neutral territory'}
            </div>
          </div>
        )}

        {/* MACD */}
        {latestMACD && (
          <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#555', marginBottom: 6 }}>OPTIONS MACD</div>
            <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 600, color: latestMACD.histogram > 0 ? GREEN : RED }}>
              {latestMACD.histogram > 0 ? 'Bullish' : 'Bearish'}
            </div>
            <div style={{ fontFamily: mono, fontSize: 13, color: '#888', marginTop: 4 }}>
              MACD: {latestMACD.value.toFixed(2)} | Signal: {latestMACD.signal.toFixed(2)}
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, color: latestMACD.histogram > 0 ? `${GREEN}aa` : `${RED}aa`, marginTop: 2 }}>
              Hist: {latestMACD.histogram > 0 ? '+' : ''}{latestMACD.histogram.toFixed(3)}
            </div>
          </div>
        )}
      </div>

      {/* RSI sparkline */}
      {rsiData.length > 2 && <RSISparkline data={rsiData} />}

      {/* Active contracts */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#555', letterSpacing: '0.1em', marginBottom: 8 }}>MOST ACTIVE CONTRACTS</div>
        {activeContracts.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: mono, fontSize: 13, color: '#888' }}>Active contracts available during market hours</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#555', marginTop: 4 }}>Mon-Fri, 9:30am-4:00pm ET</div>
          </div>
        ) : (
          activeContracts.slice(0, 5).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < Math.min(activeContracts.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 600, background: c.type === 'call' ? `${GREEN}1a` : `${RED}1a`, color: c.type === 'call' ? GREEN : RED }}>
                  {c.type.toUpperCase()}
                </span>
                <span style={{ fontFamily: mono, fontSize: 13, color: '#f0ede6' }}>${c.strike}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#555' }}>{c.expiration}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#888' }}>Vol {formatNum(c.day_volume)}</span>
                {c.iv != null && <span style={{ fontFamily: mono, fontSize: 11, color: '#888' }}>IV {(c.iv * 100).toFixed(0)}%</span>}
                {c.delta != null && <span style={{ fontFamily: mono, fontSize: 11, color: '#666' }}>{c.delta.toFixed(2)}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
