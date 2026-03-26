'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import AuthModal from './AuthModal'

export default function Nav() {
  const { user, isLoading, signOut } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

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
              <>
                <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  onMouseEnter={leaveLink}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
                  style={{ fontSize: '12px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', padding: 0 }}
                >
                  Sign out
                </button>
              </>
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
