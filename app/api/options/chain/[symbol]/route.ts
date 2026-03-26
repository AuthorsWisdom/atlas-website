import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'https://web-production-e9e4b.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const expiration = request.nextUrl.searchParams.get('expiration') ?? ''
  const url = `${RAILWAY}/options/chain/${symbol.toUpperCase()}${expiration ? `?expiration_date=${expiration}` : ''}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return NextResponse.json({ error: 'Options data unavailable' }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Options data unavailable' }, { status: 502 })
  }
}
