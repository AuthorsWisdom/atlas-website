export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '3rem 2rem',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.2em',
          color: 'var(--text-2)',
        }}>
          ATLAS
        </span>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-3)',
          textAlign: 'center',
        }}>
          © 2026 XATLAS · xatlas.io · Not financial advice. For informational purposes only.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="/privacy" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)', textDecoration: 'none' }}>Privacy</a>
          <a href="/terms" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)', textDecoration: 'none' }}>Terms</a>
        </div>
      </div>
    </footer>
  )
}