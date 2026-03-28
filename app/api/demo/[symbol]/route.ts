import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'http://localhost:8080'

export const revalidate = 60

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

function mockData(sym: string) {
  return {
    symbol: sym,
    price: null,
    change_percent: null,
    conviction: 0,
    tier: 'NOISE',
    factors: [],
    squeeze_score: 0,
    options_flow_score: 0,
    macro_score: 50,
    gex_score: 0,
    regime: 'Unknown',
    vix: null,
    gex_regime: 'unknown',
    short_interest: null,
    _stale: true,
  }
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

  // 5-second timeout — fall back to mock data if Railway is slow
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const [scoreRes, quoteRes] = await Promise.all([
      fetch(`${BACKEND}/score/${sym}`, {
        headers: { 'X-Atlas-Tier': 'free' },
        signal: controller.signal,
        next: { revalidate: 60 },
      }),
      fetch(`${BACKEND}/quote/${sym}`, {
        signal: controller.signal,
        next: { revalidate: 60 },
      }),
    ])
    clearTimeout(timeout)

    if (!scoreRes.ok) {
      return NextResponse.json({ error: 'Symbol not found' }, { status: 404 })
    }

    const score = await scoreRes.json()
    const quote = quoteRes.ok ? await quoteRes.json() : null

    const macro = score.components?.macro || {}
    const gex = score.components?.gex || {}

    const body = {
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
      short_interest: score.components?.squeeze?.short_interest_pct || null,
    }

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (err) {
    clearTimeout(timeout)
    // Timeout or network error — return mock data so widget never blanks
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json(mockData(sym), {
        headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60' },
      })
    }
    console.error('Demo proxy error:', err)
    return NextResponse.json(mockData(sym), {
      headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60' },
    })
  }
}
