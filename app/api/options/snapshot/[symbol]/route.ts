import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

const RAILWAY = 'https://atlas-backend-silent-log-2366.fly.dev'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(
      `${RAILWAY}/options/snapshot/active/${symbol.toUpperCase()}`,
      { signal: controller.signal, cache: 'no-store' },
    )
    clearTimeout(timeout)
    if (!res.ok) {
      console.error(`Options snapshot ${symbol}: Railway returned ${res.status}`)
      return NextResponse.json({ active_contracts: [] }, { status: 200 })
    }
    return NextResponse.json(await res.json())
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ active_contracts: [] }, { status: 200 })
  }
}
