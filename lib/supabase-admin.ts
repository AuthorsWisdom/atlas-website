const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

function headers() {
  return {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  }
}

export async function grantPro(userId: string, stripeCustomerId: string, source: string = 'stripe') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({
      is_pro: true,
      subscription_source: source,
      stripe_customer_id: stripeCustomerId,
      subscription_status: 'active',
    }),
  })
  if (!res.ok) {
    console.error('Failed to grant pro:', await res.text())
  }
}

export async function revokePro(stripeCustomerId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${stripeCustomerId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({
      is_pro: false,
      subscription_status: 'cancelled',
    }),
  })
  if (!res.ok) {
    console.error('Failed to revoke pro:', await res.text())
  }
}

export async function markPastDue(stripeCustomerId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${stripeCustomerId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({
      subscription_status: 'past_due',
    }),
  })
  if (!res.ok) {
    console.error('Failed to mark past_due:', await res.text())
  }
}

export async function getProfile(userId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  })
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] || null
}
