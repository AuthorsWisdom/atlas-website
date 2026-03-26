import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'https://web-production-e9e4b.up.railway.app'
const CRYPTO = new Set(['BTC','ETH','SOL','XRP','DOGE','ADA','AVAX','LINK','BNB','MATIC','LTC','DOT','UNI','ATOM','APT','ARB','NEAR','OP','SHIB','FIL'])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  const url = CRYPTO.has(sym)
    ? `${RAILWAY}/crypto/quote/${sym}`
    : `${RAILWAY}/quote/${sym}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return NextResponse.json({ error: 'Quote unavailable' }, { status: res.status })
    const data = await res.json()
    return NextResponse.json({
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
    })
  } catch {
    return NextResponse.json({ error: 'Quote unavailable' }, { status: 502 })
  }
}
