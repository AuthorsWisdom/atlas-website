import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'https://web-production-e9e4b.up.railway.app'

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
  const timeframe = request.nextUrl.searchParams.get('timeframe') ?? '1M'

  const url = CRYPTO_SYMBOLS.has(sym)
    ? `${RAILWAY}/crypto/chart/${sym}?interval=${timeframe}`
    : `${RAILWAY}/chart/${sym}?timeframe=${timeframe}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return NextResponse.json({ bars: [], error: 'Chart data unavailable' }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ bars: [], error: 'Chart data unavailable' }, { status: 502 })
  }
}
