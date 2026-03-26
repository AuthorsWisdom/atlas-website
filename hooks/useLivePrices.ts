'use client'

import { useEffect, useState, useRef } from 'react'

interface LiveQuote {
  symbol: string
  price: number
  change_percent: number
  timestamp: number
  type?: string
}

interface StreamEvent {
  quotes: Record<string, LiveQuote>
  market_open: boolean
  timestamp: number
  error?: string
}

export function useLivePrices(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({})
  const [isLive, setIsLive] = useState(false)
  const [marketOpen, setMarketOpen] = useState(true)
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down' | null>>({})
  const prevPrices = useRef<Record<string, number>>({})
  const esRef = useRef<EventSource | null>(null)
  const symbolsKey = symbols.join(',')

  useEffect(() => {
    if (symbols.length === 0) return

    // Close existing connection
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const es = new EventSource(`/api/stream?symbols=${symbolsKey}`)
    esRef.current = es

    es.onopen = () => setIsLive(true)

    es.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data)
        if (data.error) return

        setMarketOpen(data.market_open)

        if (data.quotes) {
          // Detect price flashes
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
            // Clear flashes after 600ms
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
      } catch { /* ignore parse errors */ }
    }

    es.onerror = () => {
      setIsLive(false)
      // EventSource auto-reconnects
    }

    return () => {
      es.close()
      esRef.current = null
      setIsLive(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey])

  return { quotes, isLive, marketOpen, flashes }
}
