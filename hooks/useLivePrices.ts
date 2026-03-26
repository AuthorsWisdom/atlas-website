'use client'

import { useEffect, useState, useRef } from 'react'

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
  const prevPrices = useRef<Record<string, number>>({})
  const esRef = useRef<EventSource | null>(null)
  const symbolsKey = symbols.join(',')

  useEffect(() => {
    if (symbols.length === 0) return

    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const es = new EventSource(`/api/stream?symbols=${symbolsKey}`)
    esRef.current = es

    es.onopen = () => setIsConnected(true)

    es.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data)
        if (data.error) return

        setStockMarketOpen(data.stock_market_open)

        if (data.quotes) {
          const newFlashes: Record<string, 'up' | 'down' | null> = {}
          for (const [sym, q] of Object.entries(data.quotes)) {
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
            }, 600)
          }

          setQuotes(prev => ({ ...prev, ...data.quotes }))
        }
      } catch { /* ignore */ }
    }

    es.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      es.close()
      esRef.current = null
      setIsConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey])

  // Global "isLive" = true if any symbol in the watchlist is actively trading
  const anyLive = Object.values(quotes).some(q => q.is_live)
  const isLive = isConnected && anyLive

  return { quotes, isLive, isConnected, stockMarketOpen, flashes }
}
