import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'http://localhost:8080'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()
  const isPro = request.headers.get('x-is-pro') ?? request.headers.get('X-Is-Pro') ?? 'false'
  const userId = request.headers.get('x-user-id') ?? request.headers.get('X-User-ID') ?? ''

  console.log(`[score proxy] ${sym} isPro=${isPro} userId=${userId.slice(0, 8)} backend=${RAILWAY}`)

  try {
    const res = await fetch(`${RAILWAY}/score/${sym}`, {
      headers: {
        'X-Is-Pro': isPro,
        'X-User-ID': userId,
        'X-Atlas-Tier': isPro === 'true' ? 'pro' : 'free',
      },
      signal: AbortSignal.timeout(20000),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error(`[score proxy] ${sym} backend ${res.status}`)
      return NextResponse.json(
        { symbol: sym, conviction: 0, tier: isPro === 'true' ? 'pro' : 'free', error: `Backend ${res.status}` },
        { status: 200 },
      )
    }

    return NextResponse.json(await res.json())
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error(`[score proxy] ${sym} error: ${msg}`)
    return NextResponse.json(
      { symbol: sym, conviction: 0, tier: isPro === 'true' ? 'pro' : 'free', error: msg },
      { status: 200 },
    )
  }
}
