export default function TermsOfService() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem' }}>

        <a href="/" style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-2)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '3rem',
        }}>
          ← Back to XATLAS
        </a>

        <h1 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)', marginBottom: '3rem' }}>
          Effective March 23, 2026 · Last updated March 23, 2026
        </p>

        {/* Investment Disclaimer — highlighted */}
        <div style={{
          border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: '12px',
          padding: '1.5rem',
          background: 'rgba(74,222,128,0.04)',
          marginBottom: '2.5rem',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--green)',
            letterSpacing: '0.12em',
            marginBottom: '0.75rem',
          }}>
            INVESTMENT DISCLAIMER
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
            XATLAS is provided for <strong style={{ color: 'var(--text)' }}>informational and educational purposes only</strong>. Nothing in this application constitutes financial, investment, legal, or tax advice. Conviction scores, signals, and market analysis are <strong style={{ color: 'var(--text)' }}>not recommendations</strong> to buy, sell, or hold any security. Past performance is not indicative of future results. XATLAS is not a registered investment advisor. <strong style={{ color: 'var(--text)' }}>You are solely responsible for your own investment decisions.</strong>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          <Section title="1. Agreement to Terms">
            By downloading, installing, or using XATLAS, you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </Section>

          <Section title="2. Eligibility">
            You must be at least 17 years old to use XATLAS. By using the Service, you represent that you meet this requirement and have the legal capacity to enter into these Terms.
          </Section>

          <Section title="3. Subscriptions and Billing">
            XATLAS offers Free ($0/mo), Pro ($29/mo), and Institutional ($79/mo) plans. Subscriptions are billed through Apple's in-app purchase system and renew automatically unless cancelled at least 24 hours before the renewal date. We do not offer refunds for partial periods except where required by law.
          </Section>

          <Section title="4. Bring Your Own Key (BYOK)">
            By providing API keys, you confirm you have the right to use them, accept the terms of the respective providers, and understand that third-party usage costs are your responsibility.
          </Section>

          <Section title="5. Acceptable Use">
            You agree not to use the Service for unlawful purposes, reverse engineer the app, scrape data with automated tools, share account credentials, manipulate markets, or circumvent security controls.
          </Section>

          <Section title="6. Intellectual Property">
            XATLAS and all its content are owned by XATLAS and protected by applicable intellectual property laws. You may not reproduce or distribute any part without written permission.
          </Section>

          <Section title="7. Third-Party Data">
            We rely on third-party data providers including Polygon.io and FRED. We do not guarantee the accuracy or completeness of market data and are not responsible for decisions made based on that data.
          </Section>

          <Section title="8. Disclaimer of Warranties">
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
          </Section>

          <Section title="9. Limitation of Liability">
            XATLAS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES INCLUDING LOSS OF PROFITS OR INVESTMENTS. OUR TOTAL LIABILITY SHALL NOT EXCEED AMOUNTS PAID IN THE 12 MONTHS PRECEDING THE CLAIM.
          </Section>

          <Section title="10. Governing Law">
            These Terms are governed by the laws of the State of Texas. Disputes shall be resolved in the courts of San Antonio, Texas.
          </Section>

          <Section title="11. Changes to Terms">
            We may modify these Terms at any time with notice via the app or email. Continued use constitutes acceptance.
          </Section>

          <Section title="12. Contact Us">
            Email: legal@xatlas.io · Website: xatlas.io
          </Section>

        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: 700,
        color: 'var(--green)',
        letterSpacing: '0.08em',
        marginBottom: '0.75rem',
        textTransform: 'uppercase',
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: '14px',
        color: 'var(--text-2)',
        lineHeight: 1.8,
      }}>
        {children}
      </p>
    </div>
  )
}
