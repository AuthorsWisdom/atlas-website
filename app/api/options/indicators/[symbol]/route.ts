import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

const RAILWAY = 'https://web-production-e9e4b.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(
      `${RAILWAY}/options/indicators/${symbol.toUpperCase()}`,
      { signal: controller.signal, cache: 'no-store' },
    )
    clearTimeout(timeout)
    if (!res.ok) {
      console.error(`Options indicators ${symbol}: Railway returned ${res.status}`)
      return NextResponse.json({ rsi: [], macd: [] }, { status: 200 })
    }
    return NextResponse.json(await res.json())
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ rsi: [], macd: [] }, { status: 200 })
  }
}
