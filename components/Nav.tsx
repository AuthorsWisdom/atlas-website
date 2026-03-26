'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import AuthModal from './AuthModal'

export default function Nav() {
  const { user, isLoading, signOut } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function enterLink(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    e.currentTarget.style.color = 'var(--text)'
  }
  function leaveLink(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    e.currentTarget.style.color = 'var(--text-2)'
  }
  function enterBtn(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    e.currentTarget.style.opacity = '0.85'
  }
  function leaveBtn(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    e.currentTarget.style.opacity = '1'
  }

  const menuItemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-2)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.15s',
  }

  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(8,8,8,0.8)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="XATLAS" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, letterSpacing: '0.2em', color: '#f0ede6', lineHeight: '1' }}>XATLAS</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#4ade80', letterSpacing: '0.3em', lineHeight: '1' }}>INTELLIGENCE</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#features" style={{ fontSize: '13px', color: 'var(--text-2)', transition: 'color 0.2s', textDecoration: 'none' }} onMouseEnter={enterLink} onMouseLeave={leaveLink}>Features</a>
            <a href="#pricing" style={{ fontSize: '13px', color: 'var(--text-2)', transition: 'color 0.2s', textDecoration: 'none' }} onMouseEnter={enterLink} onMouseLeave={leaveLink}>Pricing</a>

            {isLoading ? null : user ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'var(--bg-1)', border: '1px solid var(--border-2)',
                    borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-2)',
                    maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user.email}
                  </span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M2 4l3 3 3-3" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {menuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    background: 'var(--bg-1)', border: '1px solid var(--border-2)',
                    borderRadius: '10px', minWidth: '180px', overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em' }}>SIGNED IN AS</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </div>
                    </div>

                    <div style={{ padding: '4px 0' }}>
                      <a href="/app" style={menuItemStyle} onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)' }} onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                        Open App
                      </a>
                      <a href="/account" style={menuItemStyle} onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)' }} onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                        Account &amp; Billing
                      </a>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', padding: '4px 0' }}>
                      <button
                        onClick={() => { setMenuOpen(false); signOut() }}
                        style={menuItemStyle}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                onMouseEnter={enterBtn}
                onMouseLeave={leaveBtn}
                style={{ fontSize: '13px', fontWeight: 500, color: 'var(--bg)', background: 'var(--text)', padding: '7px 16px', borderRadius: '6px', transition: 'opacity 0.2s', border: 'none', cursor: 'pointer' }}
              >
                Sign in
              </button>
            )}
          </div>

        </div>
      </nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
