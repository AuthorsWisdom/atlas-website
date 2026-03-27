'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import AuthModal from '@/components/AuthModal'
import { getSupabase } from '@/lib/supabase-browser'

const mono = "'JetBrains Mono', monospace"
const sans = "'DM Sans', sans-serif"
const D = {
  bg: '#060810', surface: '#0B0E1A', card: '#0F1220', border: '#1A2038',
  accent: '#00C896', red: '#E24B4A', text: '#E8EDFF', muted: '#4A5575',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: `1px solid ${D.border}`,
  background: D.bg,
  color: D.text,
  fontFamily: mono,
  fontSize: 13,
  outline: 'none',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: D.surface, borderRadius: 12, padding: '24px', border: `1px solid ${D.border}`, marginBottom: 16 }}>
      <div style={{ fontFamily: sans, fontSize: 11, color: D.muted, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ label, value, badge }: { label: string; value: string; badge?: { text: string; color: string } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontFamily: sans, fontSize: 13, color: D.muted }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: D.text }}>{value}</span>
        {badge && (
          <span style={{
            fontFamily: sans, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: badge.color === 'green' ? `${D.accent}15` : badge.color === 'red' ? `${D.red}15` : '#fbbf2415',
            color: badge.color === 'green' ? D.accent : badge.color === 'red' ? D.red : '#fbbf24',
            border: `1px solid ${badge.color === 'green' ? `${D.accent}30` : badge.color === 'red' ? `${D.red}30` : '#fbbf2430'}`,
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
  const [anthropicKey, setAnthropicKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [keysSaving, setKeysSaving] = useState<string | null>(null)
  const [keysError, setKeysError] = useState('')
  const [keyStatus, setKeyStatus] = useState<{ anthropic: boolean; openai: boolean; preferred: string }>({ anthropic: false, openai: false, preferred: 'anthropic' })
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [pageError, setPageError] = useState('')

  if (authLoading) {
    return (
      <div style={{ background: D.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: sans, fontSize: 14, color: D.muted }}>Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ background: D.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        {showAuth && <AuthModal open={true} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
        <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', color: D.text, marginBottom: 24 }}>XATLAS</span>
        <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: D.text, marginBottom: 12 }}>Sign in to manage your account</h1>
        <button onClick={() => setShowAuth(true)} style={{
          padding: '12px 32px', borderRadius: 8, border: 'none', background: D.accent, color: '#000',
          fontFamily: sans, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>Sign In</button>
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

  // Load key status on mount
  useEffect(() => {
    if (!user) return
    fetch(`/api/keys?userId=${user.id}`, {
      signal: AbortSignal.timeout(8000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setKeyStatus(d) })
      .catch(e => { console.error('Key status fetch failed:', e) })
  }, [user])

  async function handleSaveKey(provider: 'anthropic' | 'openai') {
    const key = provider === 'anthropic' ? anthropicKey : openaiKey
    if (!key) return
    setKeysSaving(provider)
    setKeysError('')
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, provider, key }),
      })
      const data = await res.json()
      if (!res.ok) { setKeysError(data.error || 'Failed to save'); setKeysSaving(null); return }
      setKeyStatus(prev => ({ ...prev, [provider]: true }))
      if (provider === 'anthropic') setAnthropicKey('')
      else setOpenaiKey('')
    } catch { setKeysError('Failed to save key') }
    setKeysSaving(null)
  }

  async function handleRemoveKey(provider: 'anthropic' | 'openai') {
    setKeysSaving(provider)
    try {
      await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, provider }),
      })
      setKeyStatus(prev => ({ ...prev, [provider]: false }))
    } catch { setKeysError('Failed to remove key') }
    setKeysSaving(null)
  }

  return (
    <div style={{ background: D.bg, minHeight: '100vh' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: `1px solid ${D.border}`, marginBottom: 24 }}>
          <a href="/" style={{ fontFamily: sans, fontSize: 16, fontWeight: 800, color: D.text, textDecoration: 'none', letterSpacing: '-0.3px' }}>XATLAS</a>
          <a href="/app" style={{ fontFamily: sans, fontSize: 13, color: D.accent, textDecoration: 'none', fontWeight: 600 }}>Back to Dashboard</a>
        </div>

        <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 800, color: D.text, marginBottom: 4 }}>Account</h1>
        <p style={{ fontFamily: sans, fontSize: 13, color: D.muted, marginBottom: 24 }}>Manage your subscription, API keys, and settings.</p>

        {pageError && (
          <div style={{ background: `${D.red}10`, border: `1px solid ${D.red}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontFamily: sans, fontSize: 12, color: D.red }}>{pageError}</p>
          </div>
        )}

        {/* Account info */}
        <Section title="Profile">
          <Row label="Email" value={user.email ?? '—'} />
          <Row label="User ID" value={user.id.slice(0, 8) + '...'} />
        </Section>

        {/* Subscription */}
        <Section title="Subscription">
          <Row label="Plan" value={getPlanName()} badge={getStatusBadge()} />
          <Row label="Source" value={source === 'stripe' ? 'Stripe' : source === 'apple' || source === 'revenuecat' ? 'Apple' : 'None'} />

          {/* Stripe users */}
          {isPro && source === 'stripe' && (
            <button onClick={handlePortal} disabled={portalLoading} style={{
              width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${D.border}`,
              background: 'none', color: D.text,
              fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: portalLoading ? 'wait' : 'pointer',
              opacity: portalLoading ? 0.6 : 1, marginTop: 8,
            }}>
              {portalLoading ? 'Opening...' : 'Manage Billing & Cancel'}
            </button>
          )}

          {/* Apple users */}
          {isPro && (source === 'apple' || source === 'revenuecat') && (
            <div style={{ marginTop: 8 }}>
              <a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noopener noreferrer" style={{
                display: 'block', textAlign: 'center', width: '100%', padding: 12, borderRadius: 8,
                border: `1px solid ${D.border}`, background: 'none', color: D.text,
                fontFamily: sans, fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>
                Manage in iPhone Settings
              </a>
              <p style={{ fontFamily: sans, fontSize: 11, color: D.muted, marginTop: 6, textAlign: 'center' }}>
                Or go to Settings &gt; Apple ID &gt; Subscriptions on your iPhone
              </p>
            </div>
          )}

          {/* Free users */}
          {!isPro && (
            <a href="/#pricing" style={{
              display: 'block', textAlign: 'center', width: '100%', padding: 12, borderRadius: 8,
              background: D.accent, color: '#000', border: 'none',
              fontFamily: sans, fontSize: 14, fontWeight: 700, textDecoration: 'none', marginTop: 8,
            }}>
              Upgrade to Pro
            </a>
          )}
        </Section>

        {/* API Keys (BYOK) */}
        <Section title="API Keys (BYOK)">
          {isPro ? (
            <>
              {keysError && <p style={{ fontFamily: sans, fontSize: 12, color: D.red, marginBottom: 10 }}>{keysError}</p>}

              {/* Anthropic */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontFamily: sans, fontSize: 13, color: D.text, fontWeight: 600 }}>Anthropic Claude</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: keyStatus.anthropic ? D.accent : D.border }} />
                    <span style={{ fontFamily: sans, fontSize: 11, color: keyStatus.anthropic ? D.accent : D.muted }}>
                      {keyStatus.anthropic ? 'Your key' : 'XAtlas key'}
                    </span>
                  </div>
                </div>
                {keyStatus.anthropic ? (
                  <button onClick={() => handleRemoveKey('anthropic')} disabled={keysSaving === 'anthropic'} style={{
                    width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${D.red}30`,
                    background: `${D.red}08`, color: D.red, fontFamily: sans, fontSize: 12, cursor: 'pointer',
                    opacity: keysSaving === 'anthropic' ? 0.5 : 1,
                  }}>{keysSaving === 'anthropic' ? 'Removing...' : 'Remove Anthropic key'}</button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type={showAnthropicKey ? 'text' : 'password'}
                      placeholder="sk-ant-..."
                      value={anthropicKey}
                      onChange={e => setAnthropicKey(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={() => setShowAnthropicKey(v => !v)} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 8, padding: '0 10px', color: D.muted, fontFamily: sans, fontSize: 11, cursor: 'pointer' }}>
                      {showAnthropicKey ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleSaveKey('anthropic')} disabled={!anthropicKey || keysSaving === 'anthropic'} style={{
                      padding: '10px 16px', borderRadius: 8, border: 'none', background: D.accent, color: '#000',
                      fontFamily: sans, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      opacity: !anthropicKey || keysSaving === 'anthropic' ? 0.5 : 1,
                    }}>{keysSaving === 'anthropic' ? '...' : 'Save'}</button>
                  </div>
                )}
              </div>

              {/* OpenAI */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontFamily: sans, fontSize: 13, color: D.text, fontWeight: 600 }}>OpenAI GPT-4</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: keyStatus.openai ? D.accent : D.border }} />
                    <span style={{ fontFamily: sans, fontSize: 11, color: keyStatus.openai ? D.accent : D.muted }}>
                      {keyStatus.openai ? 'Your key' : 'XAtlas key'}
                    </span>
                  </div>
                </div>
                {keyStatus.openai ? (
                  <button onClick={() => handleRemoveKey('openai')} disabled={keysSaving === 'openai'} style={{
                    width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${D.red}30`,
                    background: `${D.red}08`, color: D.red, fontFamily: sans, fontSize: 12, cursor: 'pointer',
                    opacity: keysSaving === 'openai' ? 0.5 : 1,
                  }}>{keysSaving === 'openai' ? 'Removing...' : 'Remove OpenAI key'}</button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type={showOpenaiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={() => setShowOpenaiKey(v => !v)} style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 8, padding: '0 10px', color: D.muted, fontFamily: sans, fontSize: 11, cursor: 'pointer' }}>
                      {showOpenaiKey ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleSaveKey('openai')} disabled={!openaiKey || keysSaving === 'openai'} style={{
                      padding: '10px 16px', borderRadius: 8, border: 'none', background: D.accent, color: '#000',
                      fontFamily: sans, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      opacity: !openaiKey || keysSaving === 'openai' ? 0.5 : 1,
                    }}>{keysSaving === 'openai' ? '...' : 'Save'}</button>
                  </div>
                )}
              </div>

              <p style={{ fontFamily: sans, fontSize: 11, color: D.muted, textAlign: 'center', lineHeight: 1.6 }}>
                Your API keys are encrypted at rest. AI costs are billed directly by your provider — XAtlas has no markup.
              </p>
            </>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: sans, fontSize: 13, color: D.muted, display: 'block', marginBottom: 6 }}>Anthropic Claude</label>
                  <input type="password" disabled placeholder="sk-ant-..." style={{ ...inputStyle, cursor: 'not-allowed' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: sans, fontSize: 13, color: D.muted, display: 'block', marginBottom: 6 }}>OpenAI GPT-4</label>
                  <input type="password" disabled placeholder="sk-..." style={{ ...inputStyle, cursor: 'not-allowed' }} />
                </div>
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                <p style={{ fontFamily: sans, fontSize: 12, color: D.muted, textAlign: 'center' }}>API Keys require Pro</p>
                <a href="/#pricing" style={{ padding: '8px 20px', borderRadius: 8, background: D.accent, color: '#000', fontFamily: sans, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Upgrade to Pro</a>
              </div>
            </div>
          )}
        </Section>

        {/* Sign out */}
        <button onClick={signOut} style={{
          width: '100%', padding: 12, borderRadius: 8,
          border: `1px solid ${D.border}`, background: 'none',
          color: D.muted, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          marginBottom: 16,
        }}>
          Sign Out
        </button>

        {/* Danger zone */}
        <Section title="Danger Zone">
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{
              width: '100%', padding: 12, borderRadius: 8,
              border: `1px solid ${D.red}30`, background: `${D.red}08`,
              color: D.red, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Delete Account
            </button>
          ) : (
            <div style={{ background: `${D.red}08`, borderRadius: 8, padding: 16, border: `1px solid ${D.red}30` }}>
              <p style={{ fontFamily: sans, fontSize: 14, color: D.red, fontWeight: 700, marginBottom: 8 }}>
                Are you sure?
              </p>
              <p style={{ fontFamily: sans, fontSize: 13, color: D.muted, lineHeight: 1.6, marginBottom: 14 }}>
                This will permanently delete your account, profile, and all data. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDeleteConfirm(false)} style={{
                  flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${D.border}`,
                  background: 'transparent', color: D.muted, fontFamily: sans, fontSize: 13, cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteLoading} style={{
                  flex: 1, padding: 12, borderRadius: 8, border: 'none',
                  background: D.red, color: '#fff', fontFamily: sans, fontSize: 13,
                  fontWeight: 700, cursor: deleteLoading ? 'wait' : 'pointer', opacity: deleteLoading ? 0.6 : 1,
                }}>
                  {deleteLoading ? 'Deleting...' : 'Delete Forever'}
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
