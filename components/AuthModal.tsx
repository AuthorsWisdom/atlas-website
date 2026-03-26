'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type View = 'sign_in' | 'sign_up' | 'forgot_password'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultView?: View
}

export default function AuthModal({ open, onClose, onSuccess, defaultView = 'sign_in' }: Props) {
  const [view, setView] = useState<View>(defaultView)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  if (!open) return null

  function reset() {
    setEmail('')
    setPassword('')
    setError('')
    setResetSent(false)
  }

  function switchView(v: View) {
    reset()
    setView(v)
  }

  function handleClose() {
    onClose()
  }

  function handleSuccess() {
    if (onSuccess) {
      onSuccess()
    } else {
      onClose()
    }
  }

  async function handleSignUp() {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        // If user exists (e.g. from waitlist OTP), try signing in instead
        const msg = error.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
          if (signInError) {
            setError('An account with this email already exists. Try signing in instead.')
            setLoading(false)
            return
          }
          setLoading(false)
          handleSuccess()
          return
        }
        setError(error.message)
        setLoading(false)
        return
      }
      // Supabase may return a user with a fake session if email confirmation is required
      // Check if the user identity was actually created
      if (data.user?.identities?.length === 0) {
        setError('An account with this email already exists. Try signing in instead.')
        setLoading(false)
        return
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
      setLoading(false)
      handleSuccess()
    } catch {
      setError('Unable to create account. Please try again.')
      setLoading(false)
    }
  }

  async function handleSignIn() {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setLoading(false)
      handleSuccess()
    } catch {
      setError('Unable to sign in. Please try again.')
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://xatlas.io/reset-password',
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      setResetSent(true)
    } catch (err) {
      setError('Unable to send reset email. Please try again.')
    }
    setLoading(false)
  }

  async function handleApple() {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: 'https://xatlas.io/app' },
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch {
      setError('Unable to sign in with Apple. Please try again.')
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (view === 'sign_up') handleSignUp()
    else if (view === 'sign_in') handleSignIn()
    else handleForgotPassword()
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

  const btnStyle: React.CSSProperties = {
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
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border-2)',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--text)',
          }}>
            {view === 'sign_in' && 'Sign in to XATLAS'}
            {view === 'sign_up' && 'Create your account'}
            {view === 'forgot_password' && 'Reset password'}
          </h2>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
          >
            x
          </button>
        </div>

        {/* Forgot password — sent confirmation */}
        {view === 'forgot_password' && resetSent ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>&#9993;</div>
            <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem' }}>Check your email</p>
            <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              We sent a password reset link to <strong style={{ color: 'var(--text)' }}>{email}</strong>
            </p>
            <button onClick={() => switchView('sign_in')} style={{ ...btnStyle, background: 'var(--bg-2)', color: 'var(--text-2)' }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div style={{ marginBottom: '12px' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* Password field (not shown for forgot password) */}
            {view !== 'forgot_password' && (
              <div style={{ marginBottom: '4px' }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>
            )}

            {/* Forgot password link */}
            {view === 'sign_in' && (
              <div style={{ textAlign: 'right', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => switchView('forgot_password')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-3)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {view === 'forgot_password' && <div style={{ height: '12px' }} />}

            {/* Error message */}
            {error && (
              <p style={{
                color: 'var(--red)',
                fontSize: '13px',
                marginBottom: '12px',
                fontFamily: 'var(--font-mono)',
              }}>
                {error}
              </p>
            )}

            {/* Submit button */}
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? '...' : view === 'sign_in' ? 'Sign in' : view === 'sign_up' ? 'Create account' : 'Send reset link'}
            </button>

            {/* Continue with Apple */}
            {view !== 'forgot_password' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                <button
                  type="button"
                  onClick={handleApple}
                  disabled={loading}
                  style={{
                    ...btnStyle,
                    background: '#fff',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </button>
              </>
            )}

            {/* Toggle view */}
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
              {view === 'sign_in' ? (
                <>Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => switchView('sign_up')} style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    Sign up
                  </button>
                </>
              ) : view === 'sign_up' ? (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => switchView('sign_in')} style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    Sign in
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => switchView('sign_in')} style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  Back to sign in
                </button>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
