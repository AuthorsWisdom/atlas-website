import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { plan, email, userId } = await req.json()

    if (!plan || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const PRICES: Record<string, string | undefined> = {
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      annual: process.env.STRIPE_PRICE_ANNUAL,
      lifetime: process.env.STRIPE_PRICE_LIFETIME,
    }
    const priceId = PRICES[plan]
    if (!priceId) {
      return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 })
    }

    const isLifetime = plan === 'lifetime'

    const session = await getStripe().checkout.sessions.create({
      mode: isLifetime ? 'payment' : 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://xatlas.io/subscribed',
      cancel_url: 'https://xatlas.io/#pricing',
      metadata: {
        userId: userId || '',
        plan,
      },
      ...(isLifetime ? {} : {
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId: userId || '', plan },
        },
      }),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Stripe checkout error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
