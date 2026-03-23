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
          © 2026 ATLAS · atlasapp.io · Not financial advice. For informational purposes only.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)' }}>Privacy</a>
          <a href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)' }}>Terms</a>
        </div>
      </div>
    </footer>
  )
}
