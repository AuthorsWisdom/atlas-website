import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'https://web-production-e9e4b.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  try {
    const res = await fetch(
      `${RAILWAY}/options/snapshot/active/${symbol.toUpperCase()}`,
      { signal: AbortSignal.timeout(10000) },
    )
    if (!res.ok) return NextResponse.json({ active_contracts: [] }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ active_contracts: [] }, { status: 502 })
  }
}
