import { NextResponse } from 'next/server'

const BACKEND = 'http://localhost:8080'

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
