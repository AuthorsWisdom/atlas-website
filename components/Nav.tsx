'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import AuthModal from './AuthModal'

function getInitials(email: string | undefined | null): string {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}

export default function Nav() {
  const { user, isLoading, signOut } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const mono = 'var(--font-mono)'

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '9px 14px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontFamily: mono,
    fontSize: '12px',
    color: 'var(--text-2)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.15s',
  }

  function hoverIn(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    e.currentTarget.style.background = 'var(--bg-2)'
  }
  function hoverOut(e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    e.currentTarget.style.background = 'none'
  }

  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(8,8,8,0.8)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="XATLAS" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontFamily: mono, fontSize: '16px', fontWeight: 700, letterSpacing: '0.2em', color: '#f0ede6', lineHeight: '1' }}>XATLAS</span>
              <span style={{ fontFamily: mono, fontSize: '9px', color: '#4ade80', letterSpacing: '0.3em', lineHeight: '1' }}>INTELLIGENCE</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#features" style={{ fontSize: '13px', color: 'var(--text-2)', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)' }}>Features</a>
            <a href="#pricing" style={{ fontSize: '13px', color: 'var(--text-2)', transition: 'color 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)' }}>Pricing</a>

            {isLoading ? null : user ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                {/* Avatar button */}
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: mono, fontSize: '13px', fontWeight: 700, color: '#4ade80',
                  }}>
                    {getInitials(user.email)}
                  </div>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M2 4l3 3 3-3" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', minWidth: '220px', overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                    zIndex: 200,
                  }}>
                    {/* Email header */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily: mono, fontSize: '11px', color: '#f0ede6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '4px 0' }}>
                      <a href="/account" style={menuItemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3.5-7 7-7s7 3 7 7"/></svg>
                        My Account
                      </a>
                      <a href="/account#subscription" style={menuItemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                        Billing
                      </a>
                      <a href="/app" style={menuItemStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                        Open App
                      </a>
                    </div>

                    {/* Sign out */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 0' }}>
                      <button
                        onClick={() => { setMenuOpen(false); signOut() }}
                        style={menuItemStyle}
                        onMouseEnter={hoverIn}
                        onMouseLeave={hoverOut}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
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
