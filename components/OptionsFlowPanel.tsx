'use client'

import { useEffect, useState } from 'react'

const mono = "'JetBrains Mono', monospace"
const GREEN = '#1D9E75'
const RED = '#E24B4A'

interface FlowData {
  symbol: string
  put_call_ratio: number
  total_call_volume: number
  total_put_volume: number
  unusual_activity: UnusualContract[]
  error?: string
}

interface UnusualContract {
  ticker: string; type: string; strike: number; expiration: string
  volume: number; open_interest: number; vol_oi_ratio: number
  implied_volatility: number | null; delta: number | null; premium: number
}

interface ChainContract {
  ticker: string; type: string; strike: number; expiration: string
  last_price: number | null; bid: number; ask: number
  volume: number; open_interest: number
  implied_volatility: number | null; delta: number | null
  in_the_money: boolean
}

interface ChainData {
  calls: ChainContract[]; puts: ChainContract[]
  put_call_ratio: number; total_call_volume: number; total_put_volume: number
}

function formatPremium(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export default function OptionsFlowPanel({ symbol, isPro }: { symbol: string; isPro: boolean }) {
  const [flow, setFlow] = useState<FlowData | null>(null)
  const [chain, setChain] = useState<ChainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'flow' | 'calls' | 'puts'>('flow')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/options/flow/${symbol}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/options/chain/${symbol}`).then(r => r.ok ? r.json() : null),
    ]).then(([f, c]) => {
      setFlow(f)
      setChain(c)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [symbol])

  if (!isPro) {
    return (
      <div style={{ background: '#111', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
        <div style={{ fontFamily: mono, fontSize: 13, color: '#555', letterSpacing: '0.1em', marginBottom: 12 }}>OPTIONS FLOW</div>
        <div style={{ filter: 'blur(4px)', opacity: 0.3, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 6, padding: 10, height: 50 }} />
            <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 6, padding: 10, height: 50 }} />
          </div>
          <div style={{ height: 80, background: '#0a0a0a', borderRadius: 6 }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
          <p style={{ fontFamily: mono, fontSize: 13, color: '#888' }}>Options flow requires Pro</p>
          <a href="/#pricing" style={{ fontFamily: mono, fontSize: 11, color: GREEN, textDecoration: 'none', background: `${GREEN}1a`, padding: '4px 12px', borderRadius: 4, border: `1px solid ${GREEN}33` }}>Upgrade</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ background: '#111', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: mono, fontSize: 13, color: '#555', letterSpacing: '0.1em', marginBottom: 12 }}>OPTIONS FLOW</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 50, borderRadius: 6, background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      </div>
    )
  }

  if (!flow || flow.error || flow.put_call_ratio == null) {
    return (
      <div style={{ background: '#0B0E1A', borderRadius: 10, padding: 16, border: '1px solid #1A2038' }}>
        <div style={{ fontSize: 13, color: '#4A5575', fontFamily: "'DM Sans', sans-serif" }}>Options chain data available during market hours</div>
        <div style={{ fontSize: 11, color: '#4A5575', marginTop: 4 }}>Mon–Fri, 9:30am–4:00pm ET · Options Intelligence (RSI/MACD) available 24/7</div>
      </div>
    )
  }

  const pcr = flow.put_call_ratio
  const pcrColor = pcr < 0.7 ? GREEN : pcr > 1.3 ? RED : '#fbbf24'
  const pcrLabel = pcr < 0.7 ? 'BULLISH FLOW' : pcr > 1.3 ? 'BEARISH FLOW' : 'NEUTRAL'
  const totalVol = flow.total_call_volume + flow.total_put_volume
  const callPct = totalVol > 0 ? (flow.total_call_volume / totalVol) * 100 : 50

  const tabBtn = (t: 'flow' | 'calls' | 'puts', label: string) => (
    <button onClick={() => setTab(t)} style={{
      padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer',
      fontFamily: mono, fontSize: 13, fontWeight: 600,
      background: tab === t ? GREEN : 'transparent', color: tab === t ? '#fff' : '#666',
    }}>{label}</button>
  )

  return (
    <div style={{ background: '#111', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: mono, fontSize: 13, color: '#555', letterSpacing: '0.1em' }}>OPTIONS FLOW</div>
        <span style={{ fontFamily: mono, fontSize: 11, padding: '3px 8px', borderRadius: 4, background: `${pcrColor}1a`, color: pcrColor, border: `1px solid ${pcrColor}33`, fontWeight: 600 }}>{pcrLabel}</span>
      </div>

      {/* P/C Ratio + Volume bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: '#555', marginBottom: 4 }}>P/C RATIO</div>
          <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: pcrColor }}>{pcr.toFixed(2)}</div>
        </div>
        <div style={{ flex: 2, background: '#0a0a0a', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, color: '#555', marginBottom: 6 }}>
            <span>Calls {flow.total_call_volume.toLocaleString()}</span>
            <span>Puts {flow.total_put_volume.toLocaleString()}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: RED, overflow: 'hidden' }}>
            <div style={{ width: `${callPct}%`, height: '100%', background: GREEN, borderRadius: 4 }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: 3 }}>
        {tabBtn('flow', 'Unusual')}
        {tabBtn('calls', 'Calls')}
        {tabBtn('puts', 'Puts')}
      </div>

      {/* Unusual activity */}
      {tab === 'flow' && (
        <div>
          {flow.unusual_activity.length === 0 && (
            <p style={{ fontFamily: mono, fontSize: 13, color: '#555', textAlign: 'center', padding: 20 }}>No unusual activity detected</p>
          )}
          {flow.unusual_activity.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < flow.unusual_activity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 600, background: c.type === 'call' ? `${GREEN}1a` : `${RED}1a`, color: c.type === 'call' ? GREEN : RED }}>
                  {c.type.toUpperCase()}
                </span>
                <span style={{ fontFamily: mono, fontSize: 13, color: '#f0ede6' }}>${c.strike}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#555' }}>{c.expiration}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#fbbf24' }}>{c.vol_oi_ratio}x</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: '#888' }}>{formatPremium(c.premium)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chain tables */}
      {(tab === 'calls' || tab === 'puts') && chain && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr>
                {['Strike', 'Exp', 'Bid', 'Ask', 'IV', 'Delta', 'Vol', 'OI'].map(h => (
                  <th key={h} style={{ fontFamily: mono, fontSize: 10, color: '#555', textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tab === 'calls' ? chain.calls : chain.puts).slice(0, 30).map((c, i) => (
                <tr key={i} style={{ background: c.in_the_money ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ fontFamily: mono, fontSize: 13, color: '#f0ede6', padding: '6px 8px', fontWeight: 600 }}>${c.strike}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, color: '#888', padding: '6px 8px' }}>{c.expiration}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, color: '#aaa', padding: '6px 8px' }}>{c.bid?.toFixed(2) ?? '—'}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, color: '#aaa', padding: '6px 8px' }}>{c.ask?.toFixed(2) ?? '—'}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, color: '#888', padding: '6px 8px' }}>{c.implied_volatility ? `${(c.implied_volatility * 100).toFixed(0)}%` : '—'}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, color: '#888', padding: '6px 8px' }}>{c.delta?.toFixed(2) ?? '—'}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, color: '#f0ede6', padding: '6px 8px' }}>{(c.volume || 0).toLocaleString()}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, color: '#888', padding: '6px 8px' }}>{(c.open_interest || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
