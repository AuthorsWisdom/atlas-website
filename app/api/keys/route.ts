import { NextRequest, NextResponse } from 'next/server'

const RAILWAY = 'https://atlas-backend-silent-log-2366.fly.dev'

export async function POST(request: NextRequest) {
  try {
    const { userId, provider, key } = await request.json()

    if (!userId || !provider || !key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
      return NextResponse.json({ error: 'Invalid Anthropic API key format. Must start with sk-ant-' }, { status: 400 })
    }
    if (provider === 'openai' && !key.startsWith('sk-')) {
      return NextResponse.json({ error: 'Invalid OpenAI API key format. Must start with sk-' }, { status: 400 })
    }

    const res = await fetch(`${RAILWAY}/keys/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, provider, key }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save key' }))
      return NextResponse.json(err, { status: res.status })
    }

    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ error: 'Failed to save key' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, provider } = await request.json()

    if (!userId || !provider) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const res = await fetch(`${RAILWAY}/keys/clear`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, provider }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to remove key' }, { status: res.status })
    }

    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ error: 'Failed to remove key' }, { status: 500 })
  }
}
