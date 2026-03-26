'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries, type IChartApi } from 'lightweight-charts'
import { computeRSI, computeMACD, computeSMA, computeBollingerBands } from '@/lib/indicators'

const mono = "'JetBrains Mono', monospace"
const GREEN = '#1D9E75'
const RED = '#E24B4A'

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number }
interface Props { symbol: string; isCrypto?: boolean }

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'] as const
type Timeframe = typeof TIMEFRAMES[number]

export default function StockChart({ symbol, isCrypto }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [chartMode, setChartMode] = useState<'candle' | 'line'>('candle')
  const [showBB, setShowBB] = useState(false)
  const [showMA, setShowMA] = useState(false)
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)
  const chartInstanceRef = useRef<IChartApi | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Use Next.js proxy to avoid CORS
      const res = await fetch(`/api/chart/${symbol}?timeframe=${timeframe}`)
      if (res.ok) {
        const data = await res.json()
        const b = data.bars ?? data.candles ?? []
        setBars(b)
        if (b.length === 0) setError('No chart data available')
      } else {
        setBars([])
        setError('Chart data unavailable')
      }
    } catch {
      setBars([])
      setError('Failed to load chart')
    }
    setLoading(false)
  }, [symbol, timeframe])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!chartRef.current || bars.length === 0) return
    if (chartInstanceRef.current) { chartInstanceRef.current.remove(); chartInstanceRef.current = null }

    const isDesktopWidth = window.innerWidth >= 768
    const chartHeight = isDesktopWidth ? 400 : 300

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: chartHeight,
      layout: { background: { type: ColorType.Solid, color: '#000000' }, textColor: '#888888', fontFamily: mono, fontSize: 10 },
      grid: { vertLines: { color: '#1a1a1a' }, horzLines: { color: '#1a1a1a' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#1a1a1a' },
      timeScale: { borderColor: '#1a1a1a', timeVisible: timeframe === '1D' || timeframe === '1W' },
    })
    chartInstanceRef.current = chart

    const closes = bars.map(b => b.close)

    if (chartMode === 'candle') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: GREEN, downColor: RED, borderDownColor: RED, borderUpColor: GREEN,
        wickDownColor: RED, wickUpColor: GREEN,
      })
      series.setData(bars.map(b => ({ time: b.time as never, open: b.open, high: b.high, low: b.low, close: b.close })))

      if (showBB) {
        const bb = computeBollingerBands(closes)
        const valid = bars.reduce<number[]>((acc, _, i) => { if (bb.upper[i] !== null) acc.push(i); return acc }, [])
        if (valid.length > 1) {
          chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.5)', lineWidth: 1 })
            .setData(valid.map(i => ({ time: bars[i].time as never, value: bb.upper[i]! })))
          chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.5)', lineWidth: 1 })
            .setData(valid.map(i => ({ time: bars[i].time as never, value: bb.lower[i]! })))
          chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.25)', lineWidth: 1 })
            .setData(valid.map(i => ({ time: bars[i].time as never, value: bb.middle[i]! })))
        }
      }

      if (showMA) {
        const addMA = (data: (number | null)[], color: string) => {
          const valid = bars.reduce<number[]>((acc, _, i) => { if (data[i] !== null) acc.push(i); return acc }, [])
          if (valid.length > 1) {
            chart.addSeries(LineSeries, { color, lineWidth: 1 })
              .setData(valid.map(i => ({ time: bars[i].time as never, value: data[i]! })))
          }
        }
        addMA(computeSMA(closes, 20), '#ffffff')
        addMA(computeSMA(closes, 50), '#fbbf24')
        addMA(computeSMA(closes, 200), '#fb923c')
      }
    } else {
      chart.addSeries(LineSeries, { color: GREEN, lineWidth: 2 })
        .setData(bars.map(b => ({ time: b.time as never, value: b.close })))
    }

    const volSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume' })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
    volSeries.setData(bars.map(b => ({
      time: b.time as never, value: b.volume,
      color: b.close >= b.open ? `${GREEN}33` : `${RED}33`,
    })))

    chart.timeScale().fitContent()
    const el = chartRef.current
    const ro = new ResizeObserver(() => { if (el) chart.applyOptions({ width: el.clientWidth }) })
    ro.observe(el)
    return () => { ro.disconnect(); chart.remove(); chartInstanceRef.current = null }
  }, [bars, chartMode, showBB, showMA, timeframe])

  const closes = bars.map(b => b.close)
  const rsiValues = showRSI ? computeRSI(closes) : []
  const macdData = showMACD ? computeMACD(closes) : null

  const tfBtn = (tf: Timeframe): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontFamily: mono, fontSize: 13, fontWeight: 600,
    background: timeframe === tf ? GREEN : 'transparent',
    color: timeframe === tf ? '#fff' : '#666',
    transition: 'all 0.15s',
  })

  const indBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 6, border: active ? `1px solid ${GREEN}` : '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer', fontFamily: mono, fontSize: 11, fontWeight: 600,
    background: active ? `${GREEN}1a` : 'transparent',
    color: active ? GREEN : '#666',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ background: '#0a0a0a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      {/* Timeframes */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={tfBtn(tf)}>{tf}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2 }}>
          <button onClick={() => setChartMode('candle')} style={{
            padding: '6px 16px', borderRadius: 5, border: 'none', cursor: 'pointer',
            fontFamily: mono, fontSize: 11, fontWeight: 600,
            background: chartMode === 'candle' ? GREEN : 'transparent',
            color: chartMode === 'candle' ? '#fff' : '#666',
          }}>Candle</button>
          <button onClick={() => setChartMode('line')} style={{
            padding: '6px 16px', borderRadius: 5, border: 'none', cursor: 'pointer',
            fontFamily: mono, fontSize: 11, fontWeight: 600,
            background: chartMode === 'line' ? GREEN : 'transparent',
            color: chartMode === 'line' ? '#fff' : '#666',
          }}>Line</button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: 320, display: 'flex', alignItems: 'flex-end', padding: '0 20px 40px', gap: 2 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: `${20 + Math.sin(i * 0.3) * 15 + Math.random() * 30}%`, background: '#1a1a1a', borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: mono, fontSize: 12, color: '#555' }}>{error}</span>
        </div>
      ) : (
        <div ref={chartRef} />
      )}

      {/* Indicators */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontSize: 9, color: '#444', letterSpacing: '0.1em' }}>INDICATORS</span>
        <button onClick={() => setShowBB(v => !v)} style={indBtn(showBB)}>Bollinger</button>
        <button onClick={() => setShowMA(v => !v)} style={indBtn(showMA)}>Moving Avg</button>
        <button onClick={() => setShowRSI(v => !v)} style={indBtn(showRSI)}>RSI</button>
        <button onClick={() => setShowMACD(v => !v)} style={indBtn(showMACD)}>MACD</button>
      </div>

      {/* RSI */}
      {showRSI && rsiValues.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: mono, fontSize: 9, color: '#555' }}>RSI (14)</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: '#a855f7' }}>
              {rsiValues.filter(v => v !== null).slice(-1)[0]?.toFixed(1)}
            </span>
          </div>
          <div style={{ position: 'relative', height: 60 }}>
            <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, borderTop: `1px dashed ${RED}44` }}>
              <span style={{ fontFamily: mono, fontSize: 7, color: `${RED}88`, position: 'absolute', right: 0, top: -8 }}>70</span>
            </div>
            <div style={{ position: 'absolute', top: '70%', left: 0, right: 0, borderTop: `1px dashed ${GREEN}44` }}>
              <span style={{ fontFamily: mono, fontSize: 7, color: `${GREEN}88`, position: 'absolute', right: 0, top: -8 }}>30</span>
            </div>
            <svg width="100%" height="60" viewBox={`0 0 ${rsiValues.length} 100`} preserveAspectRatio="none">
              <polyline fill="none" stroke="#a855f7" strokeWidth="1.5"
                points={rsiValues.map((v, i) => v !== null ? `${i},${100 - v}` : '').filter(Boolean).join(' ')} />
            </svg>
          </div>
        </div>
      )}

      {/* MACD */}
      {showMACD && macdData && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontFamily: mono, fontSize: 9, color: '#555' }}>MACD (12, 26, 9)</span>
          <div style={{ height: 50, marginTop: 4 }}>
            <svg width="100%" height="50" viewBox={`0 0 ${macdData.histogram.length} 100`} preserveAspectRatio="none">
              {macdData.histogram.map((v, i) => {
                if (v === null) return null
                const maxH = Math.max(...macdData.histogram.filter((x): x is number => x !== null).map(Math.abs)) || 1
                const h = (Math.abs(v) / maxH) * 40
                const y = v >= 0 ? 50 - h : 50
                return <rect key={i} x={i} y={y} width="0.8" height={h} fill={v >= 0 ? `${GREEN}88` : `${RED}88`} />
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
