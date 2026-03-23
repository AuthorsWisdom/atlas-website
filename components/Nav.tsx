'use client'

export default function Nav() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      background: 'rgba(8,8,8,0.8)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.2em',
          color: 'var(--text)',
        }}>
          ATLAS
        </span>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: '13px', color: 'var(--text-2)', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
            Features
          </a>
          <a href="#pricing" style={{ fontSize: '13px', color: 'var(--text-2)', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
            Pricing
          </a>
          <a href="#waitlist" style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--bg)',
            background: 'var(--text)',
            padding: '7px 16px',
            borderRadius: '6px',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Early access
          </a>
        </div>
      </div>
    </nav>
  )
}
