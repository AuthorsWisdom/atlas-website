import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const isPro = request.headers.get('X-Is-Pro') ?? 'false'
  const userId = request.headers.get('X-User-ID') ?? ''

  console.log(`[score proxy] ${symbol} isPro=${isPro} userId=${userId.slice(0,8)}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(
      `${process.env.FLY_URL}/score/${symbol.toUpperCase()}`,
      {
        headers: {
          'X-Is-Pro': isPro,
          'X-User-ID': userId,
        },
        signal: controller.signal,
        cache: 'no-store',
      }
    )
    clearTimeout(timeout)
    if (!res.ok) {
      return NextResponse.json({ symbol, conviction: 0, tier: 'free', error: 'Score unavailable' })
    }
    return NextResponse.json(await res.json())
  } catch (e) {
    clearTimeout(timeout)
    return NextResponse.json({ symbol, conviction: 0, tier: 'free', error: 'Score unavailable' })
  }
}
