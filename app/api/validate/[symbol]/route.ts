import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'http://localhost:8080'

const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK',
  'BNB', 'MATIC', 'LTC', 'DOT', 'UNI', 'ATOM', 'APT', 'ARB',
  'NEAR', 'OP', 'SHIB', 'FIL',
])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const url = CRYPTO_SYMBOLS.has(sym)
    ? `${RAILWAY}/crypto/quote/${sym}`
    : `${RAILWAY}/quote/${sym}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) {
      return NextResponse.json({ valid: false, error: 'Ticker not found' }, { status: 404 })
    }
    const data = await res.json()
    if (data.price == null) {
      return NextResponse.json({ valid: false, error: 'Ticker not found' }, { status: 404 })
    }
    return NextResponse.json({
      valid: true,
      symbol: sym,
      price: data.price,
      change_percent: data.change_percent ?? data.change_pct ?? null,
      type: CRYPTO_SYMBOLS.has(sym) ? 'crypto' : 'stock',
    })
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === 'AbortError'
    return NextResponse.json(
      { valid: false, error: isTimeout ? 'Service unavailable, try again' : 'Validation failed' },
      { status: isTimeout ? 504 : 502 },
    )
  }
}
