export default function TermsOfService() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem' }}>
        <a href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-2)', textDecoration: 'none', marginBottom: '3rem', display: 'block' }}>← Back to XATLAS</a>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Terms of Service</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)', marginBottom: '3rem' }}>Effective March 23, 2026</p>
        <div style={{ border: '1px solid rgba(74,222,128,0.3)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(74,222,128,0.04)', marginBottom: '2.5rem', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--green)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>INVESTMENT DISCLAIMER</p>
          XATLAS is for informational purposes only. Nothing constitutes financial advice. Signals and scores are not recommendations to buy or sell. You are solely responsible for your investment decisions. XATLAS is not a registered investment advisor.
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p><strong style={{ color: 'var(--text)' }}>1. Agreement</strong><br />By using XATLAS you agree to these Terms.</p>
          <p><strong style={{ color: 'var(--text)' }}>2. Eligibility</strong><br />You must be 17+ with legal capacity to enter these Terms.</p>
          <p><strong style={{ color: 'var(--text)' }}>3. Subscriptions</strong><br />Free ($0/mo), Pro ($29/mo), Institutional ($79/mo) — billed via Apple. Cancel anytime in Apple ID settings. No partial refunds.</p>
          <p><strong style={{ color: 'var(--text)' }}>4. BYOK</strong><br />You confirm you have rights to any API keys provided. Third-party costs are your responsibility.</p>
          <p><strong style={{ color: 'var(--text)' }}>5. Acceptable Use</strong><br />No unlawful use, reverse engineering, data scraping, market manipulation, or security circumvention.</p>
          <p><strong style={{ color: 'var(--text)' }}>6. Disclaimers</strong><br />Service provided AS IS. No warranties. Not liable for indirect damages or investment losses.</p>
          <p><strong style={{ color: 'var(--text)' }}>7. Governing Law</strong><br />State of Texas. Disputes in San Antonio, TX.</p>
          <p><strong style={{ color: 'var(--text)' }}>8. Contact</strong><br />legal@xatlas.io · xatlas.io</p>
        </div>
      </div>
    </main>
  )
}
