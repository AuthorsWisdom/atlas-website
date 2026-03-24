export default function PrivacyPolicy() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem' }}>
        <a href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-2)', textDecoration: 'none', marginBottom: '3rem', display: 'block' }}>← Back to XATLAS</a>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)', marginBottom: '3rem' }}>Effective March 23, 2026</p>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p><strong style={{ color: 'var(--text)' }}>1. Introduction</strong><br />XATLAS collects minimal data to provide the Service. We do not sell your personal information.</p>
          <p><strong style={{ color: 'var(--text)' }}>2. What We Collect</strong><br />Account email, API keys (BYOK — encrypted in Keychain), subscription info via Apple, and anonymous crash reports.</p>
          <p><strong style={{ color: 'var(--text)' }}>3. API Keys</strong><br />Keys are encrypted at rest, stored in your device Keychain only, never transmitted in plain text, and deletable from Settings at any time.</p>
          <p><strong style={{ color: 'var(--text)' }}>4. How We Use Data</strong><br />To provide the Service, process subscriptions, respond to support, and improve features.</p>
          <p><strong style={{ color: 'var(--text)' }}>5. Sharing</strong><br />We do not sell data. We share only with Apple (payments), designated third-party providers you connect, and authorities when legally required.</p>
          <p><strong style={{ color: 'var(--text)' }}>6. Your Rights</strong><br />Access, correct, or delete your data by emailing privacy@xatlas.io. We respond within 30 days.</p>
          <p><strong style={{ color: 'var(--text)' }}>7. Children</strong><br />XATLAS is for users 17+. We do not knowingly collect data from children under 13.</p>
          <p><strong style={{ color: 'var(--text)' }}>8. Contact</strong><br />privacy@xatlas.io · xatlas.io</p>
        </div>
      </div>
    </main>
  )
}
