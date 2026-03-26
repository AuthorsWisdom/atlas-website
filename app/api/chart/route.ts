import { NextRequest, NextResponse } from 'next/server'

const POLYGON_KEY = process.env.POLYGON_API_KEY

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')
  const timeframe = request.nextUrl.searchParams.get('timeframe') ?? '1M'

  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
  }

  const now = new Date()
  const to = now.toISOString().split('T')[0]

  const ranges: Record<string, { from: string; multiplier: number; span: string }> = {
    '1D': { from: to, multiplier: 5, span: 'minute' },
    '1W': { from: daysAgo(7), multiplier: 15, span: 'minute' },
    '1M': { from: daysAgo(30), multiplier: 1, span: 'day' },
    '3M': { from: daysAgo(90), multiplier: 1, span: 'day' },
    '1Y': { from: daysAgo(365), multiplier: 1, span: 'day' },
  }

  const r = ranges[timeframe] ?? ranges['1M']

  if (!POLYGON_KEY) {
    return NextResponse.json({ error: 'POLYGON_API_KEY not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${r.multiplier}/${r.span}/${r.from}/${to}?adjusted=true&sort=asc&apiKey=${POLYGON_KEY}`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 502 })
    }
    const data = await res.json()
    const bars = (data.results ?? []).map((b: { t: number; o: number; h: number; l: number; c: number; v: number }) => ({
      time: Math.floor(b.t / 1000),
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
      volume: b.v,
    }))
    return NextResponse.json({ bars })
  } catch {
    return NextResponse.json({ error: 'Chart data fetch failed' }, { status: 500 })
  }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
