'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface Quote {
  symbol: string
  price: number
  change_percent: number
  timestamp: number
  is_live?: boolean
}

export function useLivePrices(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [isLive, setIsLive] = useState(false)
  const [stockMarketOpen, setStockMarketOpen] = useState(false)
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down' | null>>({})
  const [reconnectCount, setReconnectCount] = useState(0)
  const prevPrices = useRef<Record<string, number>>({})
  const esRef = useRef<EventSource | null>(null)
  const symbolsKey = symbols.join(',')

  const updateQuote = useCallback((symbol: string, price: number, changePct: number) => {
    if (!price || price <= 0) return
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

  // Railway SSE for ALL symbols (crypto comes from Binance aggTrade via Railway)
  useEffect(() => {
    if (symbols.length === 0) return

    if (esRef.current) { esRef.current.close(); esRef.current = null }

    const es = new EventSource(`/api/stream?symbols=${symbolsKey}`)
    esRef.current = es

    es.onopen = () => setIsLive(true)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.error) return
        if (data.stock_market_open !== undefined) setStockMarketOpen(data.stock_market_open)
        const updates = data.quotes ?? data
        if (updates && typeof updates === 'object') {
          for (const [sym, q] of Object.entries(updates)) {
            const quote = q as Quote
            if (quote?.price) updateQuote(sym.toUpperCase(), quote.price, quote.change_percent ?? 0)
          }
        }
      } catch { /* ignore */ }
    }

    es.onerror = () => {
      setIsLive(false)
      es.close()
      esRef.current = null
      setTimeout(() => setReconnectCount(c => c + 1), 5000)
    }

    return () => {
      es.close()
      esRef.current = null
      setIsLive(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, reconnectCount, updateQuote])

  // REST polling fallback — only for symbols with stale data
  useEffect(() => {
    if (symbols.length === 0) return

    const poll = async () => {
      await Promise.allSettled(
        symbols.map(async s => {
          const existing = quotes[s]
          if (existing && Date.now() - existing.timestamp < 8000) return
          try {
            const res = await fetch(`/api/quote/${s}?t=${Date.now()}`, { cache: 'no-store' })
            const data = await res.json()
            if (data?.price) updateQuote(s, data.price, data.change_percent ?? 0)
          } catch { /* ignore */ }
        })
      )
    }

    poll()
    const interval = setInterval(poll, 8000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, updateQuote])

  return { quotes, isLive, stockMarketOpen, flashes }
}
