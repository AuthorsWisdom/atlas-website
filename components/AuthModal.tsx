'use client'

import { useState } from 'react'
import { useAuth } from './AuthContext'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const err = mode === 'login' ? await signIn(email, password) : await signUp(email, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      setLoading(false)
      onSuccess()
    }
  }

  const mono = 'var(--font-mono)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111', borderRadius: 16, padding: 28,
        border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: 380,
      }}>
        <h3 style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: '#f0ede6', marginBottom: 4 }}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h3>
        <p style={{ fontFamily: mono, fontSize: 11, color: '#888', marginBottom: 20 }}>
          {mode === 'login' ? 'Sign in to continue to checkout' : 'Create an account to subscribe'}
        </p>

        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, marginBottom: 8,
            border: '1px solid rgba(255,255,255,0.1)', background: '#080808',
            color: '#f0ede6', fontFamily: mono, fontSize: 13, outline: 'none',
          }}
        />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, marginBottom: 12,
            border: '1px solid rgba(255,255,255,0.1)', background: '#080808',
            color: '#f0ede6', fontFamily: mono, fontSize: 13, outline: 'none',
          }}
        />

        {error && (
          <p style={{ fontFamily: mono, fontSize: 11, color: '#f87171', marginBottom: 10 }}>{error}</p>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: '#4ade80', color: '#052e16', fontFamily: mono,
          fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1, marginBottom: 12,
        }}>
          {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p style={{ fontFamily: mono, fontSize: 11, color: '#666', textAlign: 'center' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontFamily: mono, fontSize: 11 }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
