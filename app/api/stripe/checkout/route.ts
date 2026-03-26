import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { plan, email, userId } = await req.json()

    console.log('[stripe/checkout] plan:', plan, 'email:', email, 'userId:', userId)
    console.log('[stripe/checkout] STRIPE_SECRET_KEY set:', !!process.env.STRIPE_SECRET_KEY)
    console.log('[stripe/checkout] STRIPE_PRICE_MONTHLY set:', !!process.env.STRIPE_PRICE_MONTHLY)
    console.log('[stripe/checkout] STRIPE_PRICE_ANNUAL set:', !!process.env.STRIPE_PRICE_ANNUAL)
    console.log('[stripe/checkout] STRIPE_PRICE_LIFETIME set:', !!process.env.STRIPE_PRICE_LIFETIME)

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
      return NextResponse.json({ error: `Invalid plan: ${plan}. Price ID not configured — set STRIPE_PRICE_${plan.toUpperCase()} in environment variables.` }, { status: 400 })
    }

    const isLifetime = plan === 'lifetime'

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
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
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
