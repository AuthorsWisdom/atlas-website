import { NextResponse } from 'next/server'

const BACKEND = 'https://web-production-e9e4b.up.railway.app'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/macro`, { next: { revalidate: 300 } })
    if (!res.ok) return NextResponse.json({ error: 'Failed' }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch macro data' }, { status: 502 })
  }
}
