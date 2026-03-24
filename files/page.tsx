export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)', marginBottom: '3rem' }}>
          Effective March 23, 2026 · Last updated March 23, 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          <Section title="1. Introduction">
            Welcome to XATLAS. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website. Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
          </Section>

          <Section title="2. Information We Collect">
            <b style={{ color: 'var(--text)' }}>Information You Provide:</b> account email and password, API keys under our BYOK architecture, subscription information processed through Apple, and support communications.
            <br /><br />
            <b style={{ color: 'var(--text)' }}>Collected Automatically:</b> usage data, device information, and anonymous crash reports to improve stability.
            <br /><br />
            <b style={{ color: 'var(--text)' }}>What We Do NOT Collect:</b> we do not collect your trading activity, investment decisions, or precise geolocation. We do not sell your personal information.
          </Section>

          <Section title="3. How We Store Your API Keys">
            XATLAS uses a Bring Your Own Key (BYOK) architecture. Your API keys are encrypted at rest, stored in your device's Keychain, never transmitted in plain text, and used only to make requests on your behalf. You may delete your keys at any time from Settings.
          </Section>

          <Section title="4. How We Use Your Information">
            We use your information to provide and maintain the Service, process subscriptions, respond to support requests, improve features, and comply with legal obligations.
          </Section>

          <Section title="5. How We Share Your Information">
            We do not sell or rent your data. We may share information with service providers bound by confidentiality, Apple for payment processing, third-party data providers you designate via API keys, and authorities when required by law.
          </Section>

          <Section title="6. Data Retention">
            We retain your information while your account is active. To request deletion, email privacy@xatlas.io. We will respond within 30 days.
          </Section>

          <Section title="7. Your Rights">
            You have the right to access, correct, delete, and port your personal data. To exercise these rights, contact privacy@xatlas.io.
          </Section>

          <Section title="8. Children's Privacy">
            XATLAS is intended for users 17 and older. We do not knowingly collect data from children under 13. Contact us immediately if you believe this has occurred.
          </Section>

          <Section title="9. Security">
            We implement appropriate technical measures to protect your data. However, no method of transmission over the internet is 100% secure.
          </Section>

          <Section title="10. Third-Party Services">
            The Service integrates with Polygon.io, Anthropic, and Apple. We are not responsible for their privacy practices. Review their policies at their respective websites.
          </Section>

          <Section title="11. Changes to This Policy">
            We may update this policy and will notify you of material changes via the app or email.
          </Section>

          <Section title="12. Contact Us">
            Email: privacy@xatlas.io · Website: xatlas.io
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
