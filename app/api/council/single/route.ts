import { NextResponse } from 'next/server'

const RAILWAY = process.env.FLY_URL || 'https://atlas-backend-silent-log-2366.fly.dev'

export const dynamic = 'force-dynamic'
export const maxDuration = 45

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const res = await fetch(`${RAILWAY}/ai/single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) {
      return NextResponse.json({ result: { error: `Backend error: ${res.status}`, response: null } }, { status: 200 })
    }
    return NextResponse.json(await res.json())
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ result: { error: msg, response: null } }, { status: 200 })
  }
}
