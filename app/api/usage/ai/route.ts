import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'https://web-production-e9e4b.up.railway.app'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id') ?? ''
  try {
    const res = await fetch(`${RAILWAY}/usage/ai`, {
      headers: { 'X-User-ID': userId },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json({ daily_used: 0, monthly_used: 0, daily_limit: 5, monthly_limit: 50 })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ daily_used: 0, monthly_used: 0, daily_limit: 5, monthly_limit: 50 })
  }
}
