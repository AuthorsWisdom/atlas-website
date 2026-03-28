import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'http://localhost:8080'

const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK',
  'BNB', 'MATIC', 'LTC', 'DOT', 'UNI', 'ATOM', 'APT', 'ARB',
  'NEAR', 'OP', 'SHIB', 'FIL',
])

export const dynamic = 'force-dynamic'

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
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ bars: [], error: `Chart unavailable (${res.status})` })
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ bars: [], error: 'Chart timeout' })
  }
}
