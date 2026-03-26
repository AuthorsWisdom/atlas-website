'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthContext'
import AuthModal from '@/components/AuthModal'
import { getSupabase } from '@/lib/supabase-browser'

const mono = "'JetBrains Mono', monospace"
const display = "'Outfit', sans-serif"

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: '#080808',
  color: '#f0ede6',
  fontFamily: mono,
  fontSize: 13,
  outline: 'none',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#111', borderRadius: 12, padding: '20px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, badge }: { label: string; value: string; badge?: { text: string; color: string } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontFamily: mono, fontSize: 12, color: '#888' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: '#f0ede6' }}>{value}</span>
        {badge && (
          <span style={{
            fontFamily: mono, fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
            background: badge.color === 'green' ? 'rgba(74,222,128,0.1)' : badge.color === 'red' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
            color: badge.color === 'green' ? '#4ade80' : badge.color === 'red' ? '#f87171' : '#fbbf24',
            border: `1px solid ${badge.color === 'green' ? 'rgba(74,222,128,0.2)' : badge.color === 'red' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}`,
          }}>{badge.text}</span>
        )}
      </div>
    </div>
  )
}

export default function AccountClient() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [polygonKey, setPolygonKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [keysSaving, setKeysSaving] = useState(false)
  const [keysSaved, setKeysSaved] = useState(false)

  if (authLoading) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: mono, fontSize: 12, color: '#555' }}>Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        {showAuth && <AuthModal open={true} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
        <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', color: '#4ade80', marginBottom: 24 }}>XATLAS</span>
        <h1 style={{ fontFamily: display, fontSize: '1.5rem', fontWeight: 700, color: '#f0ede6', marginBottom: 12 }}>Sign in to manage your account</h1>
        <button onClick={() => setShowAuth(true)} style={{
          padding: '12px 32px', borderRadius: 8, border: 'none', background: '#4ade80', color: '#052e16',
          fontFamily: mono, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>Sign in</button>
      </div>
    )
  }

  const isPro = profile?.is_pro ?? false
  const source = profile?.subscription_source ?? 'none'
  const status = profile?.subscription_status ?? 'inactive'

  function getPlanName() {
    if (!isPro) return 'Free'
    if (source === 'apple' || source === 'revenuecat') return 'Pro (iOS)'
    return 'Pro'
  }

  function getStatusBadge() {
    if (status === 'active') return { text: 'ACTIVE', color: 'green' }
    if (status === 'past_due') return { text: 'PAST DUE', color: 'yellow' }
    if (status === 'cancelled') return { text: 'CANCELLED', color: 'red' }
    return { text: 'INACTIVE', color: 'red' }
  }

  async function handlePortal() {
    if (!profile?.stripe_customer_id) return
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: profile.stripe_customer_id }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      console.error('Portal error:', err)
    }
    setPortalLoading(false)
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id }),
      })
      if (res.ok) {
        await signOut()
        window.location.href = '/'
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
    setDeleteLoading(false)
    setDeleteConfirm(false)
  }

  async function handleSaveKeys() {
    setKeysSaving(true)
    setKeysSaved(false)
    try {
      await getSupabase()
        .from('profiles')
        .update({
          polygon_api_key: polygonKey || null,
          anthropic_api_key: anthropicKey || null,
        })
        .eq('id', user!.id)
      setKeysSaved(true)
      setTimeout(() => setKeysSaved(false), 3000)
    } catch (err) {
      console.error('Save keys error:', err)
    }
    setKeysSaving(false)
  }

  return (
    <div style={{ background: '#080808', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
          <a href="/" style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#f0ede6', textDecoration: 'none' }}>XATLAS</a>
          <a href="/app" style={{ fontFamily: mono, fontSize: 11, color: '#4ade80', textDecoration: 'none' }}>Back to app</a>
        </div>

        <h1 style={{ fontFamily: display, fontSize: '1.6rem', fontWeight: 700, color: '#f0ede6', marginBottom: 4 }}>Account</h1>
        <p style={{ fontFamily: mono, fontSize: 12, color: '#555', marginBottom: 24 }}>Manage your XAtlas account and subscription.</p>

        {/* Account info */}
        <Section title="Account">
          <Row label="Email" value={user.email} />
          <Row label="User ID" value={user.id.slice(0, 8) + '...'} />
          <button onClick={signOut} style={{
            width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#888', fontFamily: mono, fontSize: 11, cursor: 'pointer', marginTop: 4,
          }}>Sign out</button>
        </Section>

        {/* Subscription */}
        <Section title="Subscription">
          <Row label="Plan" value={getPlanName()} badge={getStatusBadge()} />
          <Row label="Source" value={source === 'stripe' ? 'Stripe' : source === 'apple' || source === 'revenuecat' ? 'Apple' : 'None'} />

          {/* Stripe users */}
          {isPro && source === 'stripe' && (
            <button onClick={handlePortal} disabled={portalLoading} style={{
              width: '100%', padding: 10, borderRadius: 8, border: 'none',
              background: 'rgba(74,222,128,0.1)', color: '#4ade80',
              fontFamily: mono, fontSize: 11, fontWeight: 600, cursor: portalLoading ? 'wait' : 'pointer',
              opacity: portalLoading ? 0.6 : 1, marginTop: 8,
            }}>
              {portalLoading ? 'Opening...' : 'Manage billing'}
            </button>
          )}

          {/* Apple users */}
          {isPro && (source === 'apple' || source === 'revenuecat') && (
            <div style={{ marginTop: 8 }}>
              <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noopener noreferrer" style={{
                display: 'block', textAlign: 'center', width: '100%', padding: 10, borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,0.06)', color: '#aaa',
                fontFamily: mono, fontSize: 11, fontWeight: 600, textDecoration: 'none',
              }}>
                Manage in iPhone Settings
              </a>
              <p style={{ fontFamily: mono, fontSize: 9, color: '#444', marginTop: 6, textAlign: 'center' }}>
                Or go to Settings &gt; Apple ID &gt; Subscriptions on your iPhone
              </p>
            </div>
          )}

          {/* Free users */}
          {!isPro && (
            <a href="/#pricing" style={{
              display: 'block', textAlign: 'center', width: '100%', padding: 10, borderRadius: 8,
              background: '#4ade80', color: '#052e16', border: 'none',
              fontFamily: mono, fontSize: 11, fontWeight: 700, textDecoration: 'none', marginTop: 8,
            }}>
              Upgrade to Pro
            </a>
          )}
        </Section>

        {/* API Keys */}
        <Section title="API Keys (BYOK)">
          {isPro ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: mono, fontSize: 10, color: '#666', display: 'block', marginBottom: 6 }}>Polygon.io API Key</label>
                <input
                  type="password"
                  placeholder="Enter key..."
                  value={polygonKey}
                  onChange={e => setPolygonKey(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: mono, fontSize: 10, color: '#666', display: 'block', marginBottom: 6 }}>Anthropic API Key</label>
                <input
                  type="password"
                  placeholder="Enter key..."
                  value={anthropicKey}
                  onChange={e => setAnthropicKey(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button onClick={handleSaveKeys} disabled={keysSaving} style={{
                width: '100%', padding: 10, borderRadius: 8, border: 'none',
                background: keysSaved ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)',
                color: keysSaved ? '#4ade80' : '#aaa',
                fontFamily: mono, fontSize: 11, fontWeight: 600, cursor: keysSaving ? 'wait' : 'pointer',
                opacity: keysSaving ? 0.6 : 1,
              }}>
                {keysSaving ? 'Saving...' : keysSaved ? 'Saved' : 'Save keys'}
              </button>
              <p style={{ fontFamily: mono, fontSize: 9, color: '#333', marginTop: 8, textAlign: 'center' }}>
                Keys are encrypted and stored securely. Never sent to XAtlas servers.
              </p>
            </>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: mono, fontSize: 10, color: '#666', display: 'block', marginBottom: 6 }}>Polygon.io API Key</label>
                  <input type="password" disabled placeholder="Enter key..." style={{ ...inputStyle, cursor: 'not-allowed' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: mono, fontSize: 10, color: '#666', display: 'block', marginBottom: 6 }}>Anthropic API Key</label>
                  <input type="password" disabled placeholder="Enter key..." style={{ ...inputStyle, cursor: 'not-allowed' }} />
                </div>
              </div>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <p style={{ fontFamily: mono, fontSize: 11, color: '#888', textAlign: 'center' }}>
                  API Keys require a Pro subscription or free trial
                </p>
                <a href="/#pricing" style={{
                  padding: '8px 20px', borderRadius: 6, background: '#4ade80', color: '#052e16',
                  fontFamily: mono, fontSize: 10, fontWeight: 700, textDecoration: 'none',
                }}>Start free trial</a>
              </div>
            </div>
          )}
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone">
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{
              width: '100%', padding: 10, borderRadius: 8,
              border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.05)',
              color: '#f87171', fontFamily: mono, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>
              Delete account
            </button>
          ) : (
            <div style={{ background: 'rgba(248,113,113,0.05)', borderRadius: 8, padding: 16, border: '1px solid rgba(248,113,113,0.2)' }}>
              <p style={{ fontFamily: mono, fontSize: 12, color: '#f87171', fontWeight: 600, marginBottom: 8 }}>
                Are you sure?
              </p>
              <p style={{ fontFamily: mono, fontSize: 11, color: '#888', lineHeight: 1.6, marginBottom: 14 }}>
                This will permanently delete your account, profile, and all data. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDeleteConfirm(false)} style={{
                  flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#888', fontFamily: mono, fontSize: 11, cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteLoading} style={{
                  flex: 1, padding: 10, borderRadius: 8, border: 'none',
                  background: '#f87171', color: '#fff', fontFamily: mono, fontSize: 11,
                  fontWeight: 700, cursor: deleteLoading ? 'wait' : 'pointer', opacity: deleteLoading ? 0.6 : 1,
                }}>
                  {deleteLoading ? 'Deleting...' : 'Delete forever'}
                </button>
              </div>
            </div>
          )}
        </Section>

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
