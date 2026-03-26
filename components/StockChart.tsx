'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries, type IChartApi } from 'lightweight-charts'
import { computeRSI, computeMACD, computeSMA, computeBollingerBands } from '@/lib/indicators'

const BACKEND = 'https://web-production-e9e4b.up.railway.app'
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
      } else {
        setBars([])
      }
    } catch { setBars([]) }
    setLoading(false)
  }, [symbol, timeframe, isCrypto])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!chartRef.current || bars.length === 0) return
    if (chartInstanceRef.current) { chartInstanceRef.current.remove(); chartInstanceRef.current = null }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 320,
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

      // Bollinger Bands
      if (showBB) {
        const bb = computeBollingerBands(closes)
        const validIdx = bars.reduce<number[]>((acc, _, i) => { if (bb.upper[i] !== null) acc.push(i); return acc }, [])
        if (validIdx.length > 1) {
          const upper = chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.5)', lineWidth: 1 })
          const lower = chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.5)', lineWidth: 1 })
          const mid = chart.addSeries(LineSeries, { color: 'rgba(168,85,247,0.25)', lineWidth: 1 })
          upper.setData(validIdx.map(i => ({ time: bars[i].time as never, value: bb.upper[i]! })))
          lower.setData(validIdx.map(i => ({ time: bars[i].time as never, value: bb.lower[i]! })))
          mid.setData(validIdx.map(i => ({ time: bars[i].time as never, value: bb.middle[i]! })))
        }
      }

      // Moving averages
      if (showMA) {
        const ma20 = computeSMA(closes, 20)
        const ma50 = computeSMA(closes, 50)
        const ma200 = computeSMA(closes, 200)
        const addMA = (data: (number | null)[], color: string) => {
          const valid = bars.reduce<number[]>((acc, _, i) => { if (data[i] !== null) acc.push(i); return acc }, [])
          if (valid.length > 1) {
            const s = chart.addSeries(LineSeries, { color, lineWidth: 1 })
            s.setData(valid.map(i => ({ time: bars[i].time as never, value: data[i]! })))
          }
        }
        addMA(ma20, '#ffffff')
        addMA(ma50, '#fbbf24')
        addMA(ma200, '#fb923c')
      }
    } else {
      const series = chart.addSeries(LineSeries, { color: GREEN, lineWidth: 2 })
      series.setData(bars.map(b => ({ time: b.time as never, value: b.close })))
    }

    // Volume
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' }, priceScaleId: 'volume',
    })
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

  const btn = (active: boolean): React.CSSProperties => ({
    padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
    fontFamily: mono, fontSize: 9, fontWeight: 600,
    background: active ? `${GREEN}26` : 'rgba(255,255,255,0.04)',
    color: active ? GREEN : '#666',
  })

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              ...btn(timeframe === tf),
              background: timeframe === tf ? `${GREEN}26` : 'transparent',
              color: timeframe === tf ? GREEN : '#555',
            }}>{tf}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <button onClick={() => setChartMode(m => m === 'candle' ? 'line' : 'candle')} style={btn(false)}>
            {chartMode === 'candle' ? 'Line' : 'Candle'}
          </button>
          <button onClick={() => setShowBB(v => !v)} style={btn(showBB)}>BB</button>
          <button onClick={() => setShowMA(v => !v)} style={btn(showMA)}>MA</button>
          <button onClick={() => setShowRSI(v => !v)} style={btn(showRSI)}>RSI</button>
          <button onClick={() => setShowMACD(v => !v)} style={btn(showMACD)}>MACD</button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: 320, background: '#000', borderRadius: 8, display: 'flex', alignItems: 'flex-end', padding: '0 20px 40px', gap: 2 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: `${20 + Math.sin(i * 0.3) * 15 + Math.random() * 30}%`, background: '#1a1a1a', borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
      ) : bars.length === 0 ? (
        <div style={{ height: 320, background: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#555' }}>No chart data available</span>
        </div>
      ) : (
        <div ref={chartRef} style={{ borderRadius: 8, overflow: 'hidden' }} />
      )}

      {/* RSI */}
      {showRSI && rsiValues.length > 0 && (
        <div style={{ marginTop: 6, background: '#000', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: mono, fontSize: 8, color: '#555' }}>RSI (14)</span>
            <span style={{ fontFamily: mono, fontSize: 8, color: '#a855f7' }}>
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
        <div style={{ marginTop: 6, background: '#000', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ fontFamily: mono, fontSize: 8, color: '#555' }}>MACD (12, 26, 9)</span>
          <div style={{ height: 50, marginTop: 4 }}>
            <svg width="100%" height="50" viewBox={`0 0 ${macdData.histogram.length} 100`} preserveAspectRatio="none">
              {macdData.histogram.map((v, i) => {
                if (v === null) return null
                const maxH = Math.max(...macdData.histogram.filter((x): x is number => x !== null).map(Math.abs)) || 1
                const h = (Math.abs(v) / maxH) * 40
                const y = v >= 0 ? 50 - h : 50
                return <rect key={i} x={i} y={y} width="0.8" height={h} fill={v >= 0 ? `${GREEN}88` : `${RED}88`} />
              })}
              <polyline fill="none" stroke={GREEN} strokeWidth="0.8"
                points={macdData.macd.map((v, i) => v !== null ? `${i},${50 - (v / (Math.max(...macdData.macd.filter((x): x is number => x !== null).map(Math.abs)) || 1)) * 40}` : '').filter(Boolean).join(' ')} />
              <polyline fill="none" stroke="#fb923c" strokeWidth="0.8"
                points={macdData.signal.map((v, i) => v !== null ? `${i},${50 - (v / (Math.max(...macdData.signal.filter((x): x is number => x !== null).map(Math.abs)) || 1)) * 40}` : '').filter(Boolean).join(' ')} />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
