'use client'
const FEATURES = [
  { id: '01', label: 'SCANNER', title: 'Tactical market scanner', desc: 'Real-time squeeze detection, options flow, and GEX analysis across the full market universe.' },
  { id: '02', label: 'MACRO', title: 'Macro command center', desc: 'FRED-powered regime classifier — know whether conditions favor risk-on or risk-off positioning.' },
  { id: '03', label: 'AI', title: 'Conviction scorer', desc: 'AI agent synthesizes squeeze, flow, GEX, and macro into a single 0–100 score per ticker.' },
  { id: '04', label: 'ALERTS', title: 'Smart notifications', desc: 'Push alerts fire only when high-conviction setups form. No noise, no spam — only signal.' },
  { id: '05', label: 'PRIVACY', title: 'BYOK architecture', desc: 'Your API keys, encrypted at rest, never stored client-side. Your data stays completely yours.' },
  { id: '06', label: 'NATIVE', title: 'iOS-first design', desc: 'Built for the device in your pocket. Fast, fluid, designed around how traders actually work.' },
]

export default function Features() {
  return (
    <section id="features" style={{
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
          Features
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
          marginBottom: '1rem',
          maxWidth: '520px',
          lineHeight: 1.15,
        }}>
          One platform.<br />Every edge.
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', maxWidth: '440px', lineHeight: 1.7 }}>
          Stop juggling five apps. ATLAS synthesizes the signals that matter into a single, actionable view — built for the speed of real markets.
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
            cursor: 'default',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-1)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-3)',
                letterSpacing: '0.12em',
              }}>
                {f.id} / {f.label}
              </span>
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '0.6rem',
              letterSpacing: '-0.01em',
            }}>
              {f.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
