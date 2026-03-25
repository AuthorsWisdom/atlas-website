'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Don't show if already dismissed or already installed
    if (localStorage.getItem('xatlas-install-dismissed')) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    if (ios) {
      // On iOS, show after a delay if not in standalone
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    // Android / desktop: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShow(false)
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShow(false)
    localStorage.setItem('xatlas-install-dismissed', '1')
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 9999, padding: '12px 16px',
      background: 'rgba(17,17,17,0.95)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(74,222,128,0.15)',
    }}>
      <div style={{
        maxWidth: '600px', margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <img src="/icon-192.png" alt="XAtlas" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '12px',
            fontWeight: 600, color: '#f0ede6', marginBottom: 2,
          }}>
            Install XAtlas
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: '#888', lineHeight: 1.4,
          }}>
            {isIOS
              ? 'Tap the share button, then "Add to Home Screen"'
              : 'Add to your home screen for the full experience'
            }
          </p>
        </div>
        {!isIOS && deferredPrompt && (
          <button onClick={handleInstall} style={{
            padding: '8px 16px', borderRadius: 8,
            background: '#4ade80', color: '#052e16',
            border: 'none', fontFamily: 'var(--font-mono)',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            Install
          </button>
        )}
        <button onClick={handleDismiss} style={{
          background: 'none', border: 'none',
          color: '#555', cursor: 'pointer', fontSize: '18px',
          padding: '4px 8px', flexShrink: 0, lineHeight: 1,
        }}>
          ×
        </button>
      </div>
    </div>
  )
}
