export const dynamic = 'force-dynamic'

const BACKEND = process.env.RAILWAY_URL || 'https://web-production-e9e4b.up.railway.app'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'all'
  const symbol = searchParams.get('symbol') ?? ''
  const limit = searchParams.get('limit') ?? '40'

  let endpoint = `${BACKEND}/news/${type}`
  const params = new URLSearchParams()
  if (symbol) params.set('symbol', symbol)
  params.set('limit', limit)
  endpoint += `?${params.toString()}`

  try {
    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 300 },
    })
    if (!res.ok) return Response.json([], { status: res.status })
    return Response.json(await res.json())
  } catch {
    return Response.json([], { status: 502 })
  }
}
