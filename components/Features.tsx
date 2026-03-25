'use client'

const FEATURES = [
  { id: '01', label: 'SCANNER', title: 'Tactical market scanner', desc: 'Real-time squeeze detection, options flow, and GEX analysis across the full market universe.' },
  { id: '02', label: 'MACRO', title: 'Macro command center', desc: 'FRED-powered regime classifier — know whether conditions favor risk-on or risk-off positioning.' },
  { id: '03', label: 'AI', title: 'Conviction scorer', desc: 'AI agent synthesizes squeeze, flow, GEX, and macro into a single 0–100 score per ticker.' },
  { id: '04', label: 'ALERTS', title: 'Smart notifications', desc: 'Push alerts fire only when high-conviction setups form. No noise, no spam — only signal.' },
  { id: '05', label: 'PRIVACY', title: 'BYOK architecture', desc: 'Your API keys, encrypted at rest, never stored client-side. Your data stays completely yours.' },
  { id: '06', label: 'NATIVE', title: 'iOS-first design', desc: 'Built for the device in your pocket. Fast, fluid, designed around how traders actually work.' },
]

const STEPS = [
  {
    number: '01',
    title: 'Connect your data',
    desc: 'Add your Polygon.io and Anthropic API keys in Settings. Keys are encrypted and stored in your device Keychain — never on our servers.',
    icon: '⌨',
  },
  {
    number: '02',
    title: 'Scanner detects setups',
    desc: 'XATLAS scans the market in real time, analyzing squeeze conditions, options flow, and gamma exposure across hundreds of tickers simultaneously.',
    icon: '⌖',
  },
  {
    number: '03',
    title: 'Macro engine sets the stage',
    desc: 'Our FRED-powered macro classifier reads 16 economic indicators to determine the current regime — risk-on, risk-off, or cautious — giving every signal its proper context.',
    icon: '◎',
  },
  {
    number: '04',
    title: 'AI scores conviction',
    desc: 'The AI agent synthesizes squeeze, options flow, GEX, and macro into a single 0–100 conviction score. Above 75 is a high-conviction setup worth watching.',
    icon: '◈',
  },
  {
    number: '05',
    title: 'You get the alert',
    desc: 'When a ticker crosses your conviction threshold, XATLAS sends a push notification. No noise — only the setups that meet your criteria.',
    icon: '◉',
  },
]

export default function Features() {
  return (
    <>
      {/* Features grid */}
      <section id="features" style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '5rem 2rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--green)', marginBottom: '1rem' }}>
            Features
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: '1rem', lineHeight: 1.15 }}>
            One platform.<br />Every edge.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.7 }}>
            Stop juggling five apps. XAtlas synthesizes the signals that matter into a single, actionable view.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {FEATURES.map(f => (
            <div key={f.id} style={{
              background: 'var(--bg-1)',
              padding: '2rem',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-1)')}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>
                {f.id} / {f.label}
              </p>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '5rem 2rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--green)', marginBottom: '1rem' }}>
            How it works
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: '1rem', lineHeight: 1.15 }}>
            From signal to alert<br />in seconds.
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.7 }}>
            XATLAS runs a continuous analysis loop so you never miss a high-conviction setup.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {STEPS.map((step, i) => (
            <div key={step.number} style={{
              display: 'flex',
              gap: '2rem',
              padding: '2rem 0',
              borderBottom: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'flex-start',
            }}>
              {/* Step number + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', flexShrink: 0 }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-2)',
                  background: 'var(--bg-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--green)',
                }}>
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: '10px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.01em',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '560px' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}