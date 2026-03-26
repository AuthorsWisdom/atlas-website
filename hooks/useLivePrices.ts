'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

const CRYPTO_SET = new Set(['BTC','ETH','SOL','XRP','DOGE','ADA','AVAX','LINK','BNB','MATIC','LTC','DOT','UNI','ATOM'])

interface LiveQuote {
  symbol: string
  price: number
  change_percent: number
  timestamp: number
  is_live?: boolean
}

interface StreamEvent {
  quotes: Record<string, LiveQuote>
  stock_market_open: boolean
  timestamp: number
  error?: string
}

export function useLivePrices(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({})
  const [isLive, setIsLive] = useState(false)
  const [stockMarketOpen, setStockMarketOpen] = useState(false)
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down' | null>>({})
  const prevPrices = useRef<Record<string, number>>({})
  const binanceWsRef = useRef<WebSocket | null>(null)
  const binanceReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sseRef = useRef<EventSource | null>(null)
  const sseReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cryptoSymbols = symbols.filter(s => CRYPTO_SET.has(s.toUpperCase()))
  const stockSymbols = symbols.filter(s => !CRYPTO_SET.has(s.toUpperCase()))
  const cryptoKey = cryptoSymbols.join(',')
  const stockKey = stockSymbols.join(',')

  const updateQuote = useCallback((symbol: string, price: number, changePct: number) => {
    if (price === 0) return
    const prev = prevPrices.current[symbol]
    if (prev !== undefined && Math.abs(price - prev) > 0.001) {
      const dir = price > prev ? 'up' as const : 'down' as const
      setFlashes(f => ({ ...f, [symbol]: dir }))
      setTimeout(() => setFlashes(f => ({ ...f, [symbol]: null })), 800)
    }
    prevPrices.current[symbol] = price
    setQuotes(q => ({
      ...q,
      [symbol]: { symbol, price, change_percent: changePct, timestamp: Date.now(), is_live: true },
    }))
  }, [])

  // ── Binance WebSocket for crypto (direct, ~1s updates) ──
  useEffect(() => {
    if (cryptoSymbols.length === 0) return

    const connect = () => {
      if (binanceWsRef.current) { binanceWsRef.current.close(); binanceWsRef.current = null }

      const streams = cryptoSymbols.map(s => `${s.toLowerCase()}usdt@aggTrade`).join('/')
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`)
      binanceWsRef.current = ws

      ws.onopen = () => setIsLive(true)

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          const d = msg.data
          if (!d?.s || d.e !== 'aggTrade') return
          const sym = d.s.replace('USDT', '').toUpperCase()
          // aggTrade uses "p" for price, no change% — use last known
          const prev = prevPrices.current[sym]
          updateQuote(sym, parseFloat(d.p), 0) // change% comes from REST poll
        } catch { /* ignore */ }
      }

      ws.onerror = () => setIsLive(false)

      ws.onclose = () => {
        binanceWsRef.current = null
        binanceReconnectRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      binanceWsRef.current?.close()
      binanceWsRef.current = null
      if (binanceReconnectRef.current) clearTimeout(binanceReconnectRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoKey, updateQuote])

  // ── Railway SSE for stocks ──
  useEffect(() => {
    if (stockSymbols.length === 0) return

    const connect = () => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null }

      const es = new EventSource(`/api/stream?symbols=${stockKey}`)
      sseRef.current = es

      es.onopen = () => setIsLive(true)

      es.onmessage = (event) => {
        try {
          const data: StreamEvent = JSON.parse(event.data)
          if (data.error) return
          setStockMarketOpen(data.stock_market_open)
          if (data.quotes) {
            for (const [sym, q] of Object.entries(data.quotes)) {
              if (q.price) updateQuote(sym, q.price, q.change_percent ?? 0)
            }
          }
        } catch { /* ignore */ }
      }

      es.onerror = () => {
        sseRef.current?.close()
        sseRef.current = null
        setIsLive(false)
        sseReconnectRef.current = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      sseRef.current?.close()
      sseRef.current = null
      if (sseReconnectRef.current) clearTimeout(sseReconnectRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockKey, updateQuote])

  // ── REST polling fallback — only for symbols without recent WS data ──
  useEffect(() => {
    if (symbols.length === 0) return

    const poll = async () => {
      await Promise.allSettled(
        symbols.map(async s => {
          // Skip if WS updated within last 8 seconds
          const existing = prevPrices.current[s]
          if (existing !== undefined) {
            const q = quotes[s]
            if (q && Date.now() - q.timestamp < 8000) return
          }
          try {
            const res = await fetch(`/api/quote/${s}?t=${Date.now()}`, { cache: 'no-store' })
            const data = await res.json()
            if (data.price) updateQuote(s, data.price, data.change_percent ?? 0)
          } catch { /* ignore */ }
        })
      )
    }

    poll()
    const interval = setInterval(poll, 8000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(','), updateQuote])

  return { quotes, isLive, stockMarketOpen, flashes }
}
