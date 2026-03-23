'use client'
const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    desc: 'Get started. See what institutional intelligence feels like.',
    features: ['15-min delayed quotes', 'Macro regime view', '5 watchlist tickers', 'Community access'],
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    desc: 'Real-time data and full conviction scoring for active traders.',
    features: ['Real-time quotes via Polygon', 'Full conviction scorer', 'Options flow + GEX', 'Unlimited watchlist', 'Push alerts', 'BYOK AI integration'],
    featured: true,
  },
  {
    name: 'Institutional',
    price: '$79',
    period: '/mo',
    desc: 'Everything in Pro, plus deeper data and priority support.',
    features: ['All Pro features', 'Extended history', 'Portfolio-level analysis', 'Priority support', 'Early feature access'],
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '5rem 2rem',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{ marginBottom: '3rem' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--green)',
          marginBottom: '1rem',
        }}>
          Pricing
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
          marginBottom: '1rem',
          lineHeight: 1.15,
        }}>
          Start free.<br />Upgrade when we earn it.
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '380px', lineHeight: 1.7 }}>
          No lock-ins. Cancel any time. Every tier includes the iOS app.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
      }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            background: plan.featured ? 'var(--bg-2)' : 'var(--bg-1)',
            border: plan.featured ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '2rem',
            position: 'relative',
          }}>
            {plan.featured && (
              <div style={{
                display: 'inline-block',
                background: 'rgba(74,222,128,0.12)',
                color: 'var(--green)',
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '99px',
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                border: '1px solid rgba(74,222,128,0.2)',
              }}>
                Most popular
              </div>
            )}

            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.75rem',
            }}>
              {plan.name}
            </p>

            <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.5rem',
                fontWeight: 500,
                color: 'var(--text)',
                lineHeight: 1,
              }}>
                {plan.price}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>{plan.period}</span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              {plan.desc}
            </p>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '13px', color: 'var(--text-2)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
