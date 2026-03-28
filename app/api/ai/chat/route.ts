import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const RAILWAY = 'http://localhost:8080'

/* ── Model mapping: frontend names → AI Gateway model IDs ──────── */
const GATEWAY_MODELS: Record<string, string> = {
  // Anthropic
  'claude-haiku-4-5':          'anthropic/claude-haiku-4-5-20251001',
  'claude-haiku-4-5-20251001': 'anthropic/claude-haiku-4-5-20251001',
  'claude-sonnet-4-5':         'anthropic/claude-sonnet-4-5-20250514',
  'claude-sonnet-4-5-20250514':'anthropic/claude-sonnet-4-5-20250514',
  'claude-opus-4-5':           'anthropic/claude-opus-4-5-20250514',
  'claude-opus-4-5-20250514':  'anthropic/claude-opus-4-5-20250514',
  // OpenAI
  'gpt-4o':      'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'o1-mini':     'openai/o1-mini',
}

const DEFAULT_MODEL_FREE = 'anthropic/claude-haiku-4-5-20251001'
const DEFAULT_MODEL_PRO  = 'anthropic/claude-sonnet-4-5-20250514'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('X-User-ID') ?? ''
  const isPro  = request.headers.get('X-Is-Pro') === 'true'

  /* ── If no gateway key, go straight to Fly.io backend ────────── */
  if (!process.env.AI_GATEWAY_API_KEY) {
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
    return proxyToRailway(request, body, userId, isPro)
  }

  let body: {
    messages?: { role: string; content: string }[]
    context?: string
    symbol?: string
    model?: string
    provider?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { messages = [], context = '', model: requestedModel = '', provider = 'anthropic' } = body

  if (!messages.length) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  /* ── Check BYOK status — if user has own key, delegate to Railway
       (Railway holds the encrypted key, we never expose it) ──── */
  if (userId) {
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 3000)
      const keyRes = await fetch(`${RAILWAY}/keys/status/${userId}`, {
        signal: controller.signal,
      })
      clearTimeout(t)
      if (keyRes.ok) {
        const keyData = await keyRes.json()
        const hasByok = provider === 'openai' ? keyData.openai : keyData.anthropic
        if (hasByok) {
          // BYOK user — route through Railway where key is decrypted securely
          return proxyToRailway(request, body, userId, isPro)
        }
      }
    } catch {
      // Fall through to gateway
    }
  }

  /* ── Rate limit via Railway (preserves existing limits) ──────── */
  if (userId) {
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 3000)
      await fetch(`${RAILWAY}/usage/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, is_pro: isPro }),
        signal: controller.signal,
      })
      clearTimeout(t)
    } catch {
      // Don't block on rate limit errors
    }
  }

  /* ── Resolve model ───────────────────────────────────────────── */
  const gatewayModel = GATEWAY_MODELS[requestedModel]
    ?? (isPro ? DEFAULT_MODEL_PRO : DEFAULT_MODEL_FREE)

  /* ── Build system prompt ─────────────────────────────────────── */
  const tierNote = isPro
    ? 'You are assisting a Pro subscriber with full access.'
    : 'You are assisting a free tier user. Be helpful but concise.'

  const systemPrompt = `You are XAtlas AI, an expert financial analyst assistant embedded in a professional trading terminal.
${tierNote}

You have access to the following real-time context:
${context}

Guidelines:
- Be concise and data-driven. Traders want signal, not noise.
- Reference specific data from the context when relevant.
- For technical analysis, reference conviction scores and components.
- For macro questions, reference the current regime.
- Keep responses under 300 words unless the user asks for detail.
- Always remind users this is not financial advice when making specific recommendations.
- Use markdown-style formatting sparingly — bold for emphasis only.`

  const formatted = messages.slice(-10).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  /* ── Call AI Gateway (server key via AI_GATEWAY_API_KEY env) ── */
  try {
    const result = await generateText({
      model: gatewayModel,
      system: systemPrompt,
      messages: formatted,
      maxOutputTokens: 1024,
    })

    return NextResponse.json({
      response: result.text,
      model: gatewayModel,
      gateway: true,
    })
  } catch (err) {
    console.error(`AI Gateway error (${gatewayModel}):`, err)

    // Fallback to Railway if gateway fails
    try {
      return await proxyToRailway(request, body, userId, isPro)
    } catch {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 503 },
      )
    }
  }
}

/* ── Fallback: proxy to Railway (handles BYOK + legacy path) ──── */
async function proxyToRailway(
  request: NextRequest,
  body: Record<string, unknown>,
  userId: string,
  isPro: boolean,
): Promise<NextResponse> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 25000)

  const res = await fetch(`${RAILWAY}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
      'X-Is-Pro': isPro ? 'true' : 'false',
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
  clearTimeout(t)

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'AI request failed' }))
    return NextResponse.json({ error: err.detail ?? 'AI request failed' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ ...data, gateway: false })
}
