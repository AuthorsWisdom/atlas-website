
'use client'

export default function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(8,8,8,0.8)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="36" height="36" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="21" cy="21" r="19" stroke="#4ade80" strokeWidth="1.5" fill="#0d1f14"/>
            <ellipse cx="21" cy="21" rx="19" ry="7.5" stroke="#4ade80" strokeWidth="0.7" fill="none" opacity="0.5"/>
            <ellipse cx="21" cy="21" rx="7.5" ry="19" stroke="#4ade80" strokeWidth="0.7" fill="none" opacity="0.5"/>
            <line x1="2" y1="21" x2="40" y2="21" stroke="#4ade80" strokeWidth="0.7" opacity="0.5"/>
            <line x1="21" y1="2" x2="21" y2="40" stroke="#4ade80" strokeWidth="0.7" opacity="0.5"/>
            <text x="21" y="27" textAnchor="middle" fontFamily="monospace" fontSize="17" fontWeight="700" fill="#4ade80">$</text>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, letterSpacing: '0.2em', color: '#f0ede6', lineHeight: '1' }}>ATLAS</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4ade80', letterSpacing: '0.3em', lineHeight: '1' }}>INTELLIGENCE</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: '13px', color: 'var(--text-2)', transition: 'color 0.2s', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)' }}>Features</a>
          <a href="#pricing" style={{ fontSize: '13px', color: 'var(--text-2)', transition: 'color 0.2s', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)' }}>Pricing</a>
          <a href="#waitlist" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--bg)', background: 'var(--text)', padding: '7px 16px', borderRadius: '6px', transition: 'opacity 0.2s', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>Early access</a>
        </div>

      </div>
    </nav>
  )
}