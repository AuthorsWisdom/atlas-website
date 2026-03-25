import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

function supabaseHeaders() {
  return {
    'apikey': SUPABASE_SERVICE_KEY!,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  }
}

async function getCount(): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/waitlist?select=id`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'count=exact',
        'Range': '0-0',
      },
    }
  )
  const range = res.headers.get('content-range')
  if (range) {
    const total = range.split('/')[1]
    return total === '*' ? 0 : parseInt(total, 10)
  }
  return 0
}

export async function GET() {
  try {
    const count = await getCount()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Insert into Supabase — upsert to handle duplicates gracefully
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/waitlist`,
      {
        method: 'POST',
        headers: {
          ...supabaseHeaders(),
          'Prefer': 'return=minimal,resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          source: 'website',
        }),
      }
    )

    if (!res.ok && res.status !== 409) {
      const body = await res.text()
      console.error('Supabase insert error:', res.status, body)
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }

    const count = await getCount()
    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
