'use client'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    desc: 'Get started with delayed market intelligence.',
    features: [
      '15-min delayed quotes',
      'Macro regime view',
      '5 watchlist tickers',
      'Squeeze + macro scoring',
    ],
    ai: false,
    featured: false,
    cta: 'Download free',
  },
  {
    name: 'Free + AI',
    price: '$10',
    period: '/mo',
    desc: 'Add multi-AI analysis to your free plan.',
    features: [
      'Everything in Free',
      'BYOK any AI provider',
      'Claude, GPT-4o, Grok, Gemini',
      'Add custom AI providers',
      'Side-by-side AI comparison',
    ],
    ai: true,
    featured: false,
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    desc: 'Real-time data and full conviction scoring.',
    features: [
      'Real-time quotes via Finnhub',
      'Full 4-component conviction scorer',
      'Options flow + GEX analysis',
      'Unlimited watchlist',
      'Push alerts',
      'Priority email support',
    ],
    ai: false,
    featured: true,
    cta: 'Get Pro',
  },
  {
    name: 'Pro + AI',
    price: '$39',
    period: '/mo',
    desc: 'The full XATLAS experience.',
    features: [
      'Everything in Pro',
      'BYOK any AI provider',
      'Claude, GPT-4o, Grok, Gemini',
      'Add custom AI providers',
      'Side-by-side AI comparison',
    ],
    ai: true,
    featured: false,
    cta: 'Get Pro + AI',
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
          Start free. Add AI for $10. Upgrade to Pro when you need real-time data. Cancel anytime.
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
                width: 'fit-content',
              }}>
                Most popular
              </div>
            )}

            {plan.ai && (
              <div style={{
                display: 'inline-block',
                background: 'rgba(168,85,247,0.1)',
                color: '#a855f7',
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '99px',
                marginBottom: '1.25rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                border: '1px solid rgba(168,85,247,0.2)',
                width: 'fit-content',
              }}>
                ✦ AI powered
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

            <p style={{
              fontSize: '13px',
              color: 'var(--text-2)',
              marginBottom: '1.5rem',
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
                marginBottom: '1.5rem',
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
                      color: plan.ai ? '#a855f7' : 'var(--green)',
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
                  : plan.ai
                  ? 'rgba(168,85,247,0.12)'
                  : 'var(--bg-2)',
                color: plan.featured
                  ? '#052e16'
                  : plan.ai
                  ? '#a855f7'
                  : 'var(--text-2)',
                border: plan.ai && !plan.featured
                  ? '1px solid rgba(168,85,247,0.3)'
                  : 'none',
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
        Subscriptions managed through Apple. Cancel anytime. AI features require BYOK API keys.
      </p>
    </section>
  )
}
