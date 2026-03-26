'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase will auto-exchange the token from the URL hash on page load
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/app')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--border-2)',
    borderRadius: '8px',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: 'var(--font-display)',
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '2rem',
    }}>
      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border-2)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '0.5rem',
        }}>
          Set new password
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Enter your new password below.
        </p>

        {!ready ? (
          <p style={{ color: 'var(--text-2)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
            Verifying reset link...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                cursor: loading ? 'wait' : 'pointer',
                border: 'none',
                background: 'var(--green)',
                color: '#052e16',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
