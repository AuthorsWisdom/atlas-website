'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface LiveQuote {
  symbol: string
  price: number
  change_percent: number
  timestamp: number
  type?: string
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
  const [isConnected, setIsConnected] = useState(false)
  const [stockMarketOpen, setStockMarketOpen] = useState(false)
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down' | null>>({})
  const [reconnectCount, setReconnectCount] = useState(0)
  const prevPrices = useRef<Record<string, number>>({})
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const symbolsKey = symbols.join(',')

  // Flash detection helper
  const detectFlashes = useCallback((updates: Record<string, LiveQuote>) => {
    const newFlashes: Record<string, 'up' | 'down' | null> = {}
    for (const [sym, q] of Object.entries(updates)) {
      if (q.price == null) continue
      const prev = prevPrices.current[sym]
      if (prev !== undefined && q.price !== prev) {
        newFlashes[sym] = q.price > prev ? 'up' : 'down'
      }
      prevPrices.current[sym] = q.price
    }
    if (Object.keys(newFlashes).length > 0) {
      setFlashes(prev => ({ ...prev, ...newFlashes }))
      setTimeout(() => {
        setFlashes(prev => {
          const next = { ...prev }
          for (const sym of Object.keys(newFlashes)) next[sym] = null
          return next
        })
      }, 800)
    }
  }, [])

  // SSE connection
  useEffect(() => {
    if (symbols.length === 0) return

    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }

    const es = new EventSource(`/api/stream?symbols=${symbolsKey}`)
    esRef.current = es

    es.onopen = () => setIsConnected(true)

    es.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data)
        if (data.error) return

        setStockMarketOpen(data.stock_market_open)

        if (data.quotes && Object.keys(data.quotes).length > 0) {
          detectFlashes(data.quotes)
          // Create brand new object to guarantee React re-render
          setQuotes(prev => {
            const next: Record<string, LiveQuote> = {}
            for (const key of Object.keys(prev)) next[key] = prev[key]
            for (const [key, val] of Object.entries(data.quotes)) next[key] = val
            return next
          })
        }
      } catch { /* ignore parse errors */ }
    }

    es.onerror = () => {
      setIsConnected(false)
      es.close()
      esRef.current = null
      // Reconnect after 5 seconds
      reconnectTimer.current = setTimeout(() => {
        setReconnectCount(c => c + 1)
      }, 5000)
    }

    return () => {
      es.close()
      esRef.current = null
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      setIsConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, reconnectCount, detectFlashes])

  // REST polling fallback — refreshes every 10s regardless of SSE
  useEffect(() => {
    if (symbols.length === 0) return

    const poll = async () => {
      const results = await Promise.allSettled(
        symbols.map(s => fetch(`/api/quote/${s}`).then(r => r.ok ? r.json() : null))
      )
      const updates: Record<string, LiveQuote> = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value && r.value.price != null) {
          updates[symbols[i]] = {
            symbol: symbols[i],
            price: r.value.price,
            change_percent: r.value.change_percent ?? 0,
            timestamp: Date.now() / 1000,
            type: r.value.type,
            is_live: true,
          }
        }
      })
      if (Object.keys(updates).length > 0) {
        detectFlashes(updates)
        setQuotes(prev => {
          const next: Record<string, LiveQuote> = {}
          for (const key of Object.keys(prev)) next[key] = prev[key]
          for (const [key, val] of Object.entries(updates)) next[key] = val
          return next
        })
      }
    }

    poll() // immediate
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey, detectFlashes])

  const anyLive = Object.values(quotes).some(q => q.is_live)
  const isLive = isConnected || anyLive

  return { quotes, isLive, isConnected, stockMarketOpen, flashes }
}
