import { NextRequest } from 'next/server'

const RAILWAY = 'https://web-production-e9e4b.up.railway.app'

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get('symbols') ?? ''

  try {
    const upstream = await fetch(
      `${RAILWAY}/stream/quotes?symbols=${encodeURIComponent(symbols)}`,
      {
        headers: { Accept: 'text/event-stream' },
        signal: request.signal,
      },
    )

    if (!upstream.ok || !upstream.body) {
      return new Response('Stream unavailable', { status: 502 })
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch {
    return new Response('Stream connection failed', { status: 502 })
  }
}
