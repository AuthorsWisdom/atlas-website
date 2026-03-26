'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi, type SeriesType } from 'lightweight-charts'
import { computeRSI, computeMACD, computeSMA, computeBollingerBands } from '@/lib/indicators'

const BACKEND = 'https://web-production-e9e4b.up.railway.app'
const mono = "'JetBrains Mono', monospace"

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number }
interface Props { symbol: string; isCrypto?: boolean }

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'] as const
type Timeframe = typeof TIMEFRAMES[number]

export default function StockChart({ symbol, isCrypto }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [chartMode, setChartMode] = useState<'candle' | 'line'>('candle')
  const [showBB, setShowBB] = useState(false)
  const [showMA, setShowMA] = useState(false)
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)
  const chartInstanceRef = useRef<IChartApi | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const endpoint = isCrypto
        ? `${BACKEND}/crypto/chart/${symbol}?interval=${timeframe}`
        : `${BACKEND}/chart/${symbol}?timeframe=${timeframe}`
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        setBars(data.bars ?? data.candles ?? [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [symbol, timeframe, isCrypto])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!chartRef.current || bars.length === 0) return

    // Clean up previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove()
      chartInstanceRef.current = null
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 300,
      layout: { background: { type: ColorType.Solid, color: '#0a0a0a' }, textColor: '#555', fontFamily: mono, fontSize: 10 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: timeframe === '1D' || timeframe === '1W' },
    })

    chartInstanceRef.current = chart
    const closes = bars.map(b => b.close)
    const timeData = bars.map(b => b.time as never)

    if (chartMode === 'candle') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#4ade80', downColor: '#f87171', borderDownColor: '#f87171', borderUpColor: '#4ade80',
        wickDownColor: '#f87171', wickUpColor: '#4ade80',
      })
      series.setData(bars.map(b => ({ time: b.time as never, open: b.open, high: b.high, low: b.low, close: b.close })))

      if (showBB) {
        const bb = computeBollingerBands(closes)
        const bbUpper = chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.4)', lineWidth: 1 })
        const bbLower = chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.4)', lineWidth: 1 })
        bbUpper.setData(bars.filter((_, i) => bb.upper[i] !== null).map((b, i) => ({ time: b.time as never, value: bb.upper[bars.indexOf(b)]! })))
        bbLower.setData(bars.filter((_, i) => bb.lower[i] !== null).map((b, i) => ({ time: b.time as never, value: bb.lower[bars.indexOf(b)]! })))
      }

      if (showMA) {
        const ma20 = computeSMA(closes, 20)
        const ma50 = computeSMA(closes, 50)
        const s20 = chart.addSeries(LineSeries, { color: '#22d3ee', lineWidth: 1 })
        const s50 = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 1 })
        s20.setData(bars.filter((_, i) => ma20[i] !== null).map(b => ({ time: b.time as never, value: ma20[bars.indexOf(b)]! })))
        s50.setData(bars.filter((_, i) => ma50[i] !== null).map(b => ({ time: b.time as never, value: ma50[bars.indexOf(b)]! })))
      }
    } else {
      const series = chart.addSeries(LineSeries, { color: '#4ade80', lineWidth: 2 })
      series.setData(bars.map(b => ({ time: b.time as never, value: b.close })))
    }

    // Volume
    const volSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(74,222,128,0.15)',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
    volSeries.setData(bars.map(b => ({
      time: b.time as never,
      value: b.volume,
      color: b.close >= b.open ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)',
    })))

    chart.timeScale().fitContent()

    const ro = new ResizeObserver(() => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth })
    })
    ro.observe(chartRef.current)

    return () => { ro.disconnect(); chart.remove(); chartInstanceRef.current = null }
  }, [bars, chartMode, showBB, showMA, timeframe])

  const closes = bars.map(b => b.close)
  const rsiValues = showRSI ? computeRSI(closes) : []
  const macdData = showMACD ? computeMACD(closes) : null

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
    fontFamily: mono, fontSize: 9, fontWeight: 600,
    background: active ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
    color: active ? '#4ade80' : '#666',
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: mono, fontSize: 9, fontWeight: 600,
              background: timeframe === tf ? 'rgba(74,222,128,0.15)' : 'transparent',
              color: timeframe === tf ? '#4ade80' : '#555',
            }}>{tf}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setChartMode(chartMode === 'candle' ? 'line' : 'candle')} style={toggleStyle(false)}>
            {chartMode === 'candle' ? 'Line' : 'Candle'}
          </button>
          <button onClick={() => setShowBB(!showBB)} style={toggleStyle(showBB)}>BB</button>
          <button onClick={() => setShowMA(!showMA)} style={toggleStyle(showMA)}>MA</button>
          <button onClick={() => setShowRSI(!showRSI)} style={toggleStyle(showRSI)}>RSI</button>
          <button onClick={() => setShowMACD(!showMACD)} style={toggleStyle(showMACD)}>MACD</button>
        </div>
      </div>

      {loading ? (
        <div style={{ height: 300, background: '#0a0a0a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#555' }}>Loading chart...</span>
        </div>
      ) : bars.length === 0 ? (
        <div style={{ height: 300, background: '#0a0a0a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#555' }}>No chart data available</span>
        </div>
      ) : (
        <div ref={chartRef} style={{ borderRadius: 8, overflow: 'hidden' }} />
      )}

      {showRSI && rsiValues.length > 0 && (
        <div style={{ marginTop: 8, background: '#0a0a0a', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ fontFamily: mono, fontSize: 8, color: '#555', marginBottom: 4 }}>RSI (14)</div>
          <div style={{ position: 'relative', height: 60 }}>
            <div style={{ position: 'absolute', top: `${((100 - 70) / 100) * 100}%`, left: 0, right: 0, borderTop: '1px dashed rgba(248,113,113,0.3)' }} />
            <div style={{ position: 'absolute', top: `${((100 - 30) / 100) * 100}%`, left: 0, right: 0, borderTop: '1px dashed rgba(74,222,128,0.3)' }} />
            <svg width="100%" height="60" viewBox={`0 0 ${rsiValues.length} 100`} preserveAspectRatio="none">
              <polyline fill="none" stroke="#a855f7" strokeWidth="1.5"
                points={rsiValues.map((v, i) => v !== null ? `${i},${100 - v}` : '').filter(Boolean).join(' ')} />
            </svg>
            <div style={{ position: 'absolute', right: 0, top: 0, fontFamily: mono, fontSize: 8, color: '#a855f7' }}>
              {rsiValues.filter(v => v !== null).slice(-1)[0]?.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {showMACD && macdData && (
        <div style={{ marginTop: 8, background: '#0a0a0a', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ fontFamily: mono, fontSize: 8, color: '#555', marginBottom: 4 }}>MACD (12, 26, 9)</div>
          <div style={{ height: 50 }}>
            <svg width="100%" height="50" viewBox={`0 0 ${macdData.histogram.length} 100`} preserveAspectRatio="none">
              {macdData.histogram.map((v, i) => {
                if (v === null) return null
                const maxH = Math.max(...macdData.histogram.filter((x): x is number => x !== null).map(Math.abs)) || 1
                const h = (Math.abs(v) / maxH) * 40
                const y = v >= 0 ? 50 - h : 50
                return <rect key={i} x={i} y={y} width="0.8" height={h} fill={v >= 0 ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'} />
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
