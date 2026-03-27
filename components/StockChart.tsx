'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries, LineStyle, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { computeRSI, computeMACD, computeSMA, computeBollingerBands } from '@/lib/indicators'

const mono = "'JetBrains Mono', monospace"
const GREEN = '#1D9E75'
const RED = '#E24B4A'

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number }
interface Props {
  symbol: string
  isCrypto?: boolean
  livePrice?: number
  isLive?: boolean
}

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y'] as const
type Timeframe = typeof TIMEFRAMES[number]

export default function StockChart({ symbol, isCrypto, livePrice, isLive }: Props) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null)
  const lastCandleRef = useRef<Bar | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceLineRef = useRef<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
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

  // Clear stale data immediately on symbol change so chart doesn't render old data
  useEffect(() => {
    setBars([])
    setLoading(true)
    setError('')
  }, [symbol])

  useEffect(() => { fetchData() }, [fetchData])

  // Build chart
  useEffect(() => {
    if (!chartRef.current || bars.length === 0) return
    // Clean up previous chart instance safely
    if (chartInstanceRef.current) {
      try { chartInstanceRef.current.remove() } catch { /* already removed */ }
      chartInstanceRef.current = null
    }
    seriesRef.current = null
    lastCandleRef.current = null
    priceLineRef.current = null

    const desktop = window.innerWidth >= 768
    const h = desktop ? 420 : 320

    const isMobile = window.innerWidth < 768
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: h,
      layout: { background: { type: ColorType.Solid, color: '#060810' }, textColor: '#8892B0', fontFamily: mono, fontSize: 12, attributionLogo: false },
      grid: { vertLines: { color: '#1a1a1a' }, horzLines: { color: '#1a1a1a' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#1a1a1a', minimumWidth: 70 },
      timeScale: { borderColor: '#1a1a1a', timeVisible: timeframe === '1D' || timeframe === '1W' },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: !isMobile,
        horzTouchDrag: false,
        vertTouchDrag: false,
      },
      handleScale: {
        mouseWheel: false,
        pinch: false,
        axisPressedMouseMove: false,
      },
    })
    chartInstanceRef.current = chart

    const closes = bars.map(b => b.close)
    const times = bars.map(b => b.time)

    const buildData = (values: (number | null)[]) =>
      values.reduce<{ time: never; value: number }[]>((acc, v, i) => {
        if (v !== null) acc.push({ time: times[i] as never, value: v })
        return acc
      }, [])

    if (chartMode === 'candle') {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: GREEN, downColor: RED, borderDownColor: RED, borderUpColor: GREEN,
        wickDownColor: RED, wickUpColor: GREEN,
      })
      s.setData(bars.map(b => ({ time: b.time as never, open: b.open, high: b.high, low: b.low, close: b.close })))
      seriesRef.current = s
      lastCandleRef.current = bars[bars.length - 1]
    } else {
      const s = chart.addSeries(LineSeries, {
        color: GREEN, lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineWidth: 1,
        priceLineColor: `${GREEN}88`,
        priceLineStyle: LineStyle.Dotted,
      })
      s.setData(bars.map(b => ({ time: b.time as never, value: b.close })))
      seriesRef.current = s
      lastCandleRef.current = bars[bars.length - 1]
    }

    // Bollinger Bands
    if (showBB && closes.length >= 20) {
      const bb = computeBollingerBands(closes)
      const upper = buildData(bb.upper)
      const lower = buildData(bb.lower)
      const mid = buildData(bb.middle)
      if (upper.length > 1) {
        chart.addSeries(LineSeries, { color: '#4a9eff88', lineWidth: 1 }).setData(upper)
        chart.addSeries(LineSeries, { color: '#4a9eff88', lineWidth: 1 }).setData(lower)
        chart.addSeries(LineSeries, { color: '#88888844', lineWidth: 1 }).setData(mid)
      }
    }

    // Moving Averages
    if (showMA) {
      const addMA = (data: (number | null)[], color: string) => {
        const d = buildData(data)
        if (d.length > 1) chart.addSeries(LineSeries, { color, lineWidth: 1 }).setData(d)
      }
      if (closes.length >= 20) addMA(computeSMA(closes, 20), '#ffffff')
      if (closes.length >= 50) addMA(computeSMA(closes, 50), '#fbbf24')
      if (closes.length >= 200) addMA(computeSMA(closes, 200), '#fb923c')
    }

    // Volume
    const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
    vol.setData(bars.map(b => ({ time: b.time as never, value: b.volume, color: b.close >= b.open ? `${GREEN}33` : `${RED}33` })))

    // MACD
    if (showMACD && closes.length >= 26) {
      const macd = computeMACD(closes)
      const macdValid = buildData(macd.macd)
      const sigValid = buildData(macd.signal)
      if (macdValid.length > 1) {
        chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
        chart.addSeries(LineSeries, { color: GREEN, lineWidth: 1, priceScaleId: 'macd' }).setData(macdValid)
        if (sigValid.length > 1) chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1, priceScaleId: 'macd' }).setData(sigValid)
        const histData = macd.histogram.reduce<{ time: never; value: number; color: string }[]>((acc, v, i) => {
          if (v !== null) acc.push({ time: times[i] as never, value: v, color: v >= 0 ? `${GREEN}88` : `${RED}88` })
          return acc
        }, [])
        if (histData.length > 1) chart.addSeries(HistogramSeries, { priceScaleId: 'macd' }).setData(histData)
      }
    }

    chart.timeScale().fitContent()
    const el = chartRef.current
    const ro = new ResizeObserver(() => { if (el) chart.applyOptions({ width: el.clientWidth }) })
    ro.observe(el)
    return () => { ro.disconnect(); try { chart.remove() } catch { /* already removed */ }; chartInstanceRef.current = null; seriesRef.current = null }
  }, [symbol, bars, chartMode, showBB, showMA, showMACD, timeframe])

  // ── Live price updates ──
  useEffect(() => {
    const series = seriesRef.current
    const chart = chartInstanceRef.current
    const last = lastCandleRef.current
    if (!series || !chart || !last) return

    const price = typeof livePrice === 'string' ? parseFloat(livePrice) : livePrice
    if (!price || isNaN(price) || price <= 0) return

    try {
      if (chartMode === 'candle') {
        const updated = {
          time: last.time as never,
          open: last.open,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          close: price,
        }
        series.update(updated)
        lastCandleRef.current = { ...last, high: updated.high, low: updated.low, close: price }
      } else {
        series.update({ time: last.time as never, value: price })
        lastCandleRef.current = { ...last, close: price }
      }
    } catch {
      // series may have been destroyed between render cycles
    }
  }, [livePrice, timeframe, chartMode])

  // RSI
  const closes = bars.map(b => b.close)
  const rsiValues = showRSI ? computeRSI(closes) : []

  return (
    <div style={{ background: '#0a0a0a', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      {/* Controls */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)} style={{
              padding: '10px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: mono, fontSize: 15, fontWeight: 600,
              background: timeframe === tf ? GREEN : 'transparent',
              color: timeframe === tf ? '#fff' : '#666',
            }}>{tf}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse-dot 2s infinite' }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: GREEN }}>LIVE</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
            {(['candle', 'line'] as const).map(m => (
              <button key={m} onClick={() => setChartMode(m)} style={{
                padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: mono, fontSize: 15, fontWeight: 600,
                background: chartMode === m ? GREEN : 'transparent',
                color: chartMode === m ? '#fff' : '#666',
              }}>{m === 'candle' ? 'Candle' : 'Line'}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: 320, display: 'flex', alignItems: 'flex-end', padding: '0 20px 40px', gap: 2 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{ flex: 1, height: `${25 + Math.sin(i * 0.3) * 15 + i % 3 * 10}%`, background: '#1a1a1a', borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: mono, fontSize: 14, color: '#555' }}>{error}</span>
        </div>
      ) : (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div ref={chartRef} />
        </div>
      )}

      {/* Indicator toggles */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: '#444', letterSpacing: '0.1em' }}>INDICATORS</span>
        {[
          { key: 'bb', label: 'Bollinger', active: showBB, toggle: () => setShowBB(v => !v) },
          { key: 'ma', label: 'Moving Avg', active: showMA, toggle: () => setShowMA(v => !v) },
          { key: 'rsi', label: 'RSI', active: showRSI, toggle: () => setShowRSI(v => !v) },
          { key: 'macd', label: 'MACD', active: showMACD, toggle: () => setShowMACD(v => !v) },
        ].map(ind => (
          <button key={ind.key} onClick={ind.toggle} style={{
            padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
            fontFamily: mono, fontSize: 14, fontWeight: 600,
            border: ind.active ? `1px solid ${GREEN}` : '1px solid rgba(255,255,255,0.1)',
            background: ind.active ? `${GREEN}1a` : 'transparent',
            color: ind.active ? GREEN : '#666',
          }}>{ind.label}</button>
        ))}
      </div>

      {/* RSI panel */}
      {showRSI && rsiValues.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: mono, fontSize: 13, color: '#555' }}>RSI (14)</span>
            <span style={{ fontFamily: mono, fontSize: 13, color: '#a855f7', fontWeight: 600 }}>
              {rsiValues.filter(v => v !== null).slice(-1)[0]?.toFixed(1)}
            </span>
          </div>
          <div style={{ position: 'relative', height: 70 }}>
            <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, borderTop: `1px dashed ${RED}44` }}>
              <span style={{ fontFamily: mono, fontSize: 10, color: `${RED}88`, position: 'absolute', right: 0, top: -10 }}>70</span>
            </div>
            <div style={{ position: 'absolute', top: '70%', left: 0, right: 0, borderTop: `1px dashed ${GREEN}44` }}>
              <span style={{ fontFamily: mono, fontSize: 10, color: `${GREEN}88`, position: 'absolute', right: 0, top: -10 }}>30</span>
            </div>
            <svg width="100%" height="70" viewBox={`0 0 ${rsiValues.length} 100`} preserveAspectRatio="none">
              <polyline fill="none" stroke="#a855f7" strokeWidth="1.5"
                points={rsiValues.map((v, i) => v !== null ? `${i},${100 - v}` : '').filter(Boolean).join(' ')} />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
