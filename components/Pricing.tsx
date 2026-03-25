'use client'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    desc: 'Get started with basic market intelligence.',
    features: [
      '3 watchlist symbols',
      'Delayed conviction scores',
      'Basic macro regime view',
    ],
    limits: [
      'No options flow or GEX data',
      'No AI analysis',
      'No push alerts',
    ],
    badge: null,
    featured: false,
    cta: 'Download free',
  },
  {
    name: 'Pro Monthly',
    price: '$29.99',
    period: '/mo',
    desc: 'Real-time data, full scoring, and AI analysis.',
    trial: '7-day free trial',
    features: [
      'Real-time conviction scores',
      'Full options flow & GEX data',
      'Macro regime classifier with 16 live FRED indicators',
      'AI portfolio analysis across entire watchlist',
      'Push alerts for high-conviction setups',
      'Unlimited watchlist symbols',
    ],
    limits: [],
    badge: 'most-popular',
    featured: true,
    cta: 'Start free trial',
  },
  {
    name: 'Pro Annual',
    price: '$199.99',
    period: '/yr',
    desc: 'Everything in Pro at ~$16.67/mo. Save $159.89/year.',
    trial: '7-day free trial',
    features: [
      'Everything in Pro Monthly',
      'Save 44% vs monthly billing',
    ],
    limits: [],
    badge: 'best-value',
    featured: false,
    cta: 'Start free trial',
  },
  {
    name: 'Founding Member',
    price: '$499.99',
    period: ' once',
    desc: 'One-time payment. Pro access forever. Founding members only.',
    features: [
      'Everything in Pro Monthly',
      'No recurring charges — ever',
      'Founding member status',
    ],
    limits: [],
    badge: 'founding',
    featured: false,
    cta: 'Claim founding member access',
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
          Simple pricing.<br />No surprises.
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '400px', lineHeight: 1.7 }}>
          Start free. Upgrade to Pro when you need real-time data and AI analysis. Cancel anytime.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '12px',
      }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            background: 'var(--bg-1)',
            border: plan.featured
              ? '2px solid rgba(74,222,128,0.4)'
              : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1.75rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>

            {plan.badge === 'most-popular' && (
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
                width: 'fit-content',
              }}>
                Most popular
              </div>
            )}

            {plan.badge === 'best-value' && (
              <div style={{
                display: 'inline-block',
                background: 'rgba(56,189,248,0.1)',
                color: '#38bdf8',
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '99px',
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                border: '1px solid rgba(56,189,248,0.2)',
                width: 'fit-content',
              }}>
                Best value
              </div>
            )}

            {plan.badge === 'founding' && (
              <div style={{
                display: 'inline-block',
                background: 'rgba(251,191,36,0.1)',
                color: '#fbbf24',
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '99px',
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                border: '1px solid rgba(251,191,36,0.2)',
                width: 'fit-content',
              }}>
                Limited time — founding members only
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

            <div style={{
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.2rem',
                fontWeight: 500,
                color: 'var(--text)',
                lineHeight: 1,
              }}>
                {plan.price}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>
                {plan.period}
              </span>
            </div>

            {'trial' in plan && plan.trial && (
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--green)',
                marginTop: '4px',
                marginBottom: '0',
              }}>
                {plan.trial}
              </p>
            )}

            {plan.badge === 'founding' && (
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#fbbf24',
                marginTop: '4px',
                marginBottom: '0',
              }}>
                Available until June 23, 2026
              </p>
            )}

            <p style={{
              fontSize: '13px',
              color: 'var(--text-2)',
              marginBottom: '1.5rem',
              marginTop: '0.75rem',
              lineHeight: 1.5,
            }}>
              {plan.desc}
            </p>

            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1.25rem',
              flex: 1,
            }}>
              <ul style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: plan.limits && plan.limits.length > 0 ? '12px' : '1.5rem',
              }}>
                {plan.features.map(f => (
                  <li key={f} style={{
                    fontSize: '13px',
                    color: 'var(--text-2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}>
                    <span style={{
                      color: 'var(--green)',
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.limits && plan.limits.length > 0 && (
                <ul style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '1.5rem',
                }}>
                  {plan.limits.map(l => (
                    <li key={l} style={{
                      fontSize: '13px',
                      color: 'var(--text-3)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}>
                      <span style={{
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}>
                        ✗
                      </span>
                      {l}
                    </li>
                  ))}
                </ul>
              )}

              <a href="#waitlist" style={{
                display: 'block',
                textAlign: 'center',
                padding: '10px 0',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                textDecoration: 'none',
                background: plan.featured
                  ? 'var(--green)'
                  : 'var(--bg-2)',
                color: plan.featured
                  ? '#052e16'
                  : 'var(--text-2)',
              }}>
                {plan.cta}
              </a>
            </div>
          </div>
        ))}
      </div>

      <p style={{
        marginTop: '2rem',
        fontSize: '12px',
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        textAlign: 'center',
      }}>
        Subscriptions managed through Apple. Cancel anytime. All Pro plans include the same features.
      </p>
    </section>
  )
}
