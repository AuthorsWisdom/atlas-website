import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'https://atlas-backend-silent-log-2366.fly.dev'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()
  const isPro = request.headers.get('x-is-pro') ?? request.headers.get('X-Is-Pro') ?? 'false'
  const userId = request.headers.get('x-user-id') ?? request.headers.get('X-User-ID') ?? ''

  console.log(`[score proxy] ${sym} isPro=${isPro} userId=${userId.slice(0, 8)}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(`${RAILWAY}/score/${sym}`, {
      headers: {
        'X-Is-Pro': isPro,
        'X-User-ID': userId,
      },
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`Score ${sym}: backend returned ${res.status}`)
      return NextResponse.json(
        { symbol: sym, conviction: 0, tier: 'free', error: 'Score unavailable' },
        { status: 200 },
      )
    }

    return NextResponse.json(await res.json())
  } catch (e) {
    clearTimeout(timeout)
    console.error(`Score proxy error for ${sym}:`, e)
    return NextResponse.json(
      { symbol: sym, conviction: 0, tier: 'free', error: 'Score unavailable' },
      { status: 200 },
    )
  }
}
