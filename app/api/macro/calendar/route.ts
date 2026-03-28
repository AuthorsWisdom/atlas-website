import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND = 'http://localhost:8080'

export async function GET() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${BACKEND}/macro/calendar`, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timeout)
    if (!res.ok) return NextResponse.json([])
    return NextResponse.json(await res.json())
  } catch {
    clearTimeout(timeout)
    return NextResponse.json([])
  }
}
