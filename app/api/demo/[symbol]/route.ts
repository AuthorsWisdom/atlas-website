import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'https://web-production-e9e4b.up.railway.app'

// Simple in-memory rate limiter: 10 req/min per IP
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const window = 60_000
  const limit = 10
  const timestamps = (hits.get(ip) || []).filter(t => now - t < window)
  if (timestamps.length >= limit) return true
  timestamps.push(now)
  hits.set(ip, timestamps)
  return false
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limited — try again in a minute' },
      { status: 429 }
    )
  }

  const sym = symbol.toUpperCase().replace(/[^A-Z.]/g, '')
  if (!sym || sym.length > 10) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  }

  try {
    const [scoreRes, quoteRes] = await Promise.all([
      fetch(`${BACKEND}/score/${sym}`, {
        headers: { 'X-Atlas-Tier': 'free' },
      }),
      fetch(`${BACKEND}/quote/${sym}`),
    ])

    if (!scoreRes.ok) {
      return NextResponse.json({ error: 'Symbol not found' }, { status: 404 })
    }

    const score = await scoreRes.json()
    const quote = quoteRes.ok ? await quoteRes.json() : null

    const macro = score.components?.macro || {}
    const squeeze = score.components?.squeeze || {}
    const options = score.components?.options || {}
    const gex = score.components?.gex || {}

    return NextResponse.json({
      symbol: sym,
      price: quote?.price || null,
      change_percent: quote?.change_pct || null,
      conviction: score.conviction || 0,
      tier: score.tier || 'NOISE',
      factors: score.factors || [],
      squeeze_score: score.squeeze_score ?? 0,
      options_flow_score: score.options_flow_score ?? 0,
      macro_score: macro.risk_on_score ?? 0,
      gex_score: gex.net_gex ?? 0,
      regime: macro.regime || 'Unknown',
      vix: macro.vix || null,
      gex_regime: gex.gex_regime || 'unknown',
      short_interest: squeeze.short_interest_pct || null,
    })
  } catch (error) {
    console.error('Demo proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 502 })
  }
}
