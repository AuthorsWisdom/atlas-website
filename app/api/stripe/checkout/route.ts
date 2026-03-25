import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_IDS } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { priceId, email, userId, plan } = await req.json()

    if (!priceId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine if this is a one-time payment (lifetime) or subscription
    const isLifetime = priceId === PRICE_IDS.lifetime

    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? 'payment' : 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://xatlas.io/app?subscribed=true',
      cancel_url: 'https://xatlas.io/#pricing',
      metadata: {
        userId: userId || '',
        plan: plan || 'pro',
      },
      ...(isLifetime ? {} : {
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId: userId || '', plan: plan || 'pro' },
        },
      }),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
