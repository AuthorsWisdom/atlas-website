export const dynamic = 'force-dynamic'
export const revalidate = 0

const BACKEND = process.env.RAILWAY_URL || 'https://web-production-e9e4b.up.railway.app'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'all'
  const symbol = searchParams.get('symbol') ?? ''
  const limit = searchParams.get('limit') ?? '40'

  const url = symbol
    ? `${BACKEND}/news/${type}?symbol=${encodeURIComponent(symbol)}&limit=${limit}`
    : `${BACKEND}/news/${type}?limit=${limit}`

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!res.ok) return Response.json([], { status: 200 })
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json([])
  }
}
