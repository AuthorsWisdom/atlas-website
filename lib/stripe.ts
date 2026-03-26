import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      console.warn('[stripe] STRIPE_SECRET_KEY not set')
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables.')
    }
    _stripe = new Stripe(key)
  }
  return _stripe
}
