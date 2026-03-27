'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { computeRSI, computeMACD, computeSMA, computeBollingerBands } from '@/lib/indicators'

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

const D = {
  bg: '#060810', surface: '#0B0E1A', border: '#1A2038',
  accent: '#00C896', red: '#E24B4A', text: '#E8EDFF', muted: '#4A5575',
  mono: "'JetBrains Mono', monospace", sans: "'DM Sans', sans-serif",
}

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number }

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'] as const
type Timeframe = (typeof TIMEFRAMES)[number]

interface Props {
  symbol: string
  isCrypto?: boolean
  livePrice?: number
  isLive?: boolean
}

export default function ApexStockChart({ symbol, isCrypto, livePrice, isLive }: Props) {
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [chartMode, setChartMode] = useState<'candle' | 'line'>('candle')
  const [showBB, setShowBB] = useState(false)
  const [showMA, setShowMA] = useState(false)
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)
  const prevSymbol = useRef('')

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setError('')
    setBars([])
    prevSymbol.current = symbol

    fetch(`/api/chart/${symbol}?timeframe=${timeframe}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(json => {
        if (prevSymbol.current !== symbol) return
        console.log('[ApexChart]', symbol, 'response keys:', Object.keys(json), 'bars?', Array.isArray(json.bars) ? json.bars.length : 'not array')
        const b: Bar[] = json.bars ?? json.candles ?? (Array.isArray(json) ? json : [])
        if (b.length === 0) {
          setError(json.error ?? 'No chart data available')
          setLoading(false)
          return
        }
        setBars(b)
        setLoading(false)
      })
      .catch(e => { console.error('[ApexChart]', symbol, 'error:', e); setError('Chart unavailable'); setLoading(false) })
  }, [symbol, timeframe])

  const closes = bars.map(b => b.close)

  // Build series
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series: any[] = []
  if (bars.length > 0) {
    if (chartMode === 'candle') {
      series.push({
        name: symbol,
        type: 'candlestick',
        data: bars.map(b => ({
          x: new Date(b.time * 1000),
          y: [b.open, b.high, b.low, b.close],
        })),
      })
    } else {
      series.push({
        name: symbol,
        type: 'line',
        data: bars.map(b => ({ x: new Date(b.time * 1000), y: b.close })),
      })
    }

    // Bollinger Bands
    if (showBB && closes.length >= 20) {
      const bb = computeBollingerBands(closes)
      const times = bars.map(b => new Date(b.time * 1000))
      const toSeries = (vals: (number | null)[], name: string) => ({
        name, type: 'line' as const,
        data: vals.map((v, i) => ({ x: times[i], y: v ?? null })).filter(d => d.y !== null),
      })
      series.push(toSeries(bb.upper, 'BB Upper'))
      series.push(toSeries(bb.lower, 'BB Lower'))
      series.push(toSeries(bb.middle, 'BB Mid'))
    }

    // Moving Averages
    if (showMA) {
      const times = bars.map(b => new Date(b.time * 1000))
      const addMA = (period: number, name: string) => {
        if (closes.length >= period) {
          const vals = computeSMA(closes, period)
          series.push({
            name, type: 'line',
            data: vals.map((v, i) => ({ x: times[i], y: v ?? null })).filter(d => d.y !== null),
          })
        }
      }
      addMA(20, 'SMA 20')
      addMA(50, 'SMA 50')
      addMA(200, 'SMA 200')
    }
  }

  const annotations: ApexCharts.ApexOptions['annotations'] = {}
  if (livePrice && livePrice > 0) {
    annotations.yaxis = [{
      y: livePrice,
      borderColor: '#4F8EF7',
      strokeDashArray: 4,
      label: {
        text: `$${livePrice.toFixed(2)}`,
        style: { color: D.text, background: '#4F8EF7', fontFamily: D.mono, fontSize: '11px' },
      },
    }]
  }

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: chartMode === 'candle' ? 'candlestick' : 'line',
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: false },
      zoom: { enabled: true, type: 'x' },
      selection: { enabled: false },
    },
    theme: { mode: 'dark' },
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: D.muted, fontFamily: D.mono, fontSize: '10px' } },
      axisBorder: { color: D.border },
      axisTicks: { color: D.border },
    },
    yaxis: {
      opposite: true,
      labels: {
        style: { colors: D.muted, fontFamily: D.mono, fontSize: '10px' },
        formatter: (val: number) => val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(2)}`,
      },
    },
    grid: { borderColor: `${D.border}80`, strokeDashArray: 3 },
    plotOptions: {
      candlestick: {
        colors: { upward: D.accent, downward: D.red },
        wick: { useFillColor: true },
      },
    },
    stroke: {
      curve: 'smooth',
      width: series.map((s, i) => i === 0 ? (chartMode === 'line' ? 2 : 1) : 1),
      colors: chartMode === 'line' ? [D.accent] : undefined,
    },
    colors: chartMode === 'line'
      ? [D.accent, '#4a9eff88', '#4a9eff88', '#88888844', '#ffffff', '#fbbf24', '#fb923c']
      : undefined,
    tooltip: {
      theme: 'dark',
      style: { fontFamily: D.mono, fontSize: '12px' },
      x: { format: timeframe === '1D' || timeframe === '1W' ? 'MMM dd HH:mm' : 'MMM dd yyyy' },
    },
    legend: { show: series.length > 1, position: 'top', horizontalAlign: 'left', labels: { colors: D.muted }, fontFamily: D.sans, fontSize: '11px' },
    annotations,
    responsive: [{ breakpoint: 768, options: { chart: { height: 280 } } }],
  }

  // MACD data
  const macdData = showMACD && closes.length >= 26 ? computeMACD(closes) : null
  // RSI data
  const rsiValues = showRSI ? computeRSI(closes) : []

  const desktop = typeof window !== 'undefined' && window.innerWidth >= 768
  const chartHeight = desktop ? 380 : 280

  return (
    <div style={{ background: D.surface, borderRadius: 12, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
      {/* Controls */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderBottom: `1px solid ${D.border}` }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: D.sans, fontSize: 12, fontWeight: 700,
              background: timeframe === tf ? D.accent : 'transparent',
              color: timeframe === tf ? '#000' : D.muted,
            }}>{tf}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: D.accent }} />
              <span style={{ fontFamily: D.mono, fontSize: 10, color: D.accent }}>LIVE</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 2, background: D.bg, borderRadius: 8, padding: 3 }}>
            {(['candle', 'line'] as const).map(m => (
              <button key={m} onClick={() => setChartMode(m)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: D.sans, fontSize: 12, fontWeight: 700,
                background: chartMode === m ? D.accent : 'transparent',
                color: chartMode === m ? '#000' : D.muted,
              }}>{m === 'candle' ? 'Candle' : 'Line'}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: chartHeight, display: 'flex', alignItems: 'flex-end', padding: '0 20px 40px', gap: 2 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: `${25 + Math.sin(i * 0.3) * 15 + i % 3 * 10}%`, background: D.border, borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: D.sans, fontSize: 13, color: D.muted }}>{error}</span>
        </div>
      ) : (
        <ReactApexChart
          options={options}
          series={series}
          type={chartMode === 'candle' ? 'candlestick' : 'line'}
          height={chartHeight}
          width="100%"
        />
      )}

      {/* Indicator toggles */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: D.sans, fontSize: 10, color: D.muted, letterSpacing: '1px', fontWeight: 600 }}>INDICATORS</span>
        {[
          { key: 'bb', label: 'Bollinger', active: showBB, toggle: () => setShowBB(v => !v) },
          { key: 'ma', label: 'Moving Avg', active: showMA, toggle: () => setShowMA(v => !v) },
          { key: 'rsi', label: 'RSI', active: showRSI, toggle: () => setShowRSI(v => !v) },
          { key: 'macd', label: 'MACD', active: showMACD, toggle: () => setShowMACD(v => !v) },
        ].map(ind => (
          <button key={ind.key} onClick={ind.toggle} style={{
            padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
            fontFamily: D.sans, fontSize: 11, fontWeight: 700,
            border: ind.active ? `1px solid ${D.accent}` : `1px solid ${D.border}`,
            background: ind.active ? `${D.accent}15` : 'transparent',
            color: ind.active ? D.accent : D.muted,
          }}>{ind.label}</button>
        ))}
      </div>

      {/* RSI panel */}
      {showRSI && rsiValues.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${D.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: D.mono, fontSize: 11, color: D.muted }}>RSI (14)</span>
            <span style={{ fontFamily: D.mono, fontSize: 11, color: '#a855f7', fontWeight: 600 }}>
              {rsiValues.filter(v => v !== null).slice(-1)[0]?.toFixed(1)}
            </span>
          </div>
          <div style={{ position: 'relative', height: 60 }}>
            <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, borderTop: `1px dashed ${D.red}44` }}>
              <span style={{ fontFamily: D.mono, fontSize: 9, color: `${D.red}88`, position: 'absolute', right: 0, top: -10 }}>70</span>
            </div>
            <div style={{ position: 'absolute', top: '70%', left: 0, right: 0, borderTop: `1px dashed ${D.accent}44` }}>
              <span style={{ fontFamily: D.mono, fontSize: 9, color: `${D.accent}88`, position: 'absolute', right: 0, top: -10 }}>30</span>
            </div>
            <svg width="100%" height="60" viewBox={`0 0 ${rsiValues.length} 100`} preserveAspectRatio="none">
              <polyline fill="none" stroke="#a855f7" strokeWidth="1.5"
                points={rsiValues.map((v, i) => v !== null ? `${i},${100 - v}` : '').filter(Boolean).join(' ')} />
            </svg>
          </div>
        </div>
      )}

      {/* MACD panel */}
      {showMACD && macdData && (
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${D.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: D.mono, fontSize: 11, color: D.muted }}>MACD (12,26,9)</span>
            <span style={{ fontFamily: D.mono, fontSize: 11, color: D.accent, fontWeight: 600 }}>
              {macdData.macd.filter(v => v !== null).slice(-1)[0]?.toFixed(3)}
            </span>
          </div>
          <div style={{ height: 50, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            {macdData.histogram.slice(-80).map((v, i) => v !== null ? (
              <div key={i} style={{
                flex: 1, background: v >= 0 ? `${D.accent}88` : `${D.red}88`,
                height: `${Math.min(Math.abs(v) * 500, 100)}%`, borderRadius: '1px 1px 0 0',
              }} />
            ) : null)}
          </div>
        </div>
      )}
    </div>
  )
}
