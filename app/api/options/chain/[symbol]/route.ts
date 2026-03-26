import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

const RAILWAY = 'https://web-production-e9e4b.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const expiration = request.nextUrl.searchParams.get('expiration') ?? ''
  const url = `${RAILWAY}/options/chain/${symbol.toUpperCase()}${expiration ? `?expiration_date=${expiration}` : ''}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timeout)
    if (!res.ok) {
      console.error(`Options chain ${symbol}: Railway returned ${res.status}`)
      return NextResponse.json({ error: 'Options data unavailable', status: res.status }, { status: 200 })
    }
    return NextResponse.json(await res.json())
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ error: 'Options data unavailable' }, { status: 200 })
  }
}
