import { NextResponse } from 'next/server'

const RAILWAY = process.env.FLY_URL || 'https://atlas-backend-silent-log-2366.fly.dev'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = request.headers.get('X-User-ID') ?? ''
    const res = await fetch(`${RAILWAY}/ai/council/debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-ID': userId },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(110000),
    })
    return NextResponse.json(await res.json())
  } catch (e) {
    return NextResponse.json({ error: 'Debate request failed' }, { status: 502 })
  }
}
