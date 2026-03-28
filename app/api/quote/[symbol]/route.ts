import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'http://localhost:8080'
const CRYPTO = new Set(['BTC','ETH','SOL','XRP','DOGE','ADA','AVAX','LINK','BNB','MATIC','LTC','DOT','UNI','ATOM','APT','ARB','NEAR','OP','SHIB','FIL'])

export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const url = CRYPTO.has(sym)
    ? `${RAILWAY}/crypto/quote/${sym}`
    : `${RAILWAY}/quote/${sym}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeout)
    if (!res.ok) {
      console.error(`Quote ${sym}: Railway returned ${res.status}`)
      return NextResponse.json({ symbol: sym, price: null, change_percent: null, error: 'Quote unavailable' }, { status: 200 })
    }
    const data = await res.json()
    return new NextResponse(JSON.stringify({
      symbol: sym,
      price: data.price ?? data.lastPrice ?? null,
      change_percent: data.change_percent ?? data.change_pct ?? data.priceChangePercent ?? null,
      conviction: data.conviction ?? 0,
      squeeze_score: data.squeeze_score ?? 0,
      options_flow_score: data.options_flow_score ?? 0,
      macro_score: data.macro_score ?? 0,
      factors: data.factors ?? [],
      regime: data.regime ?? '',
      vix: data.vix ?? null,
      type: CRYPTO.has(sym) ? 'crypto' : 'stock',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    })
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ symbol: sym, price: null, change_percent: null, error: 'Quote unavailable' }, { status: 200 })
  }
}
