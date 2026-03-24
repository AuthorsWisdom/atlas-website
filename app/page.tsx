export default function PrivacyPolicy() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem' }}>
        <a href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-2)', textDecoration: 'none', display: 'block', marginBottom: '3rem' }}>← Back to XATLAS</a>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Privacy Policy</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)', marginBottom: '3rem' }}>Effective March 23, 2026 · Last updated March 23, 2026</p>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 2, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <Section title="1. Introduction">
            XATLAS ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the XATLAS mobile application and website (collectively, the "Service"). This policy complies with the California Consumer Privacy Act (CCPA), the General Data Protection Regulation (GDPR), and other applicable privacy laws. Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
          </Section>

          <Section title="2. Information We Collect">
            <strong style={{ color: 'var(--text)' }}>Information You Provide:</strong> account email address and password, third-party API keys provided under our BYOK architecture, subscription and billing information processed through Apple, and any communications you send us via support channels.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Information Collected Automatically:</strong> usage data (features accessed, screens viewed, session duration), device information (device type, operating system version, app version), and anonymous crash diagnostic reports to improve stability.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>What We Do NOT Collect:</strong> We do not collect your trading activity, investment decisions, precise geolocation data, financial account numbers, or Social Security numbers. We do not sell, rent, or trade your personal information to third parties under any circumstances.
          </Section>

          <Section title="3. How We Store Your API Keys">
            XATLAS uses a Bring Your Own Key (BYOK) architecture designed for maximum security. When you provide third-party API keys: they are encrypted at rest using AES-256 encryption; stored exclusively in your device Keychain (iOS secure enclave); never transmitted to XATLAS servers in plain text; used only to make authorized requests to the services you have designated; and may be deleted by you at any time from the Settings screen. XATLAS employees cannot access your decrypted API keys.
          </Section>

          <Section title="4. How We Use Your Information">
            We use collected information to: provide, operate, and maintain the Service; process your subscription and manage your account; send transactional communications (receipts, account notices, security alerts); respond to your customer support requests; analyze usage patterns to improve features and user experience; detect and prevent fraud, abuse, or security incidents; and comply with applicable legal obligations.
          </Section>

          <Section title="5. Legal Basis for Processing (GDPR)">
            If you are located in the European Economic Area (EEA), we process your personal data under the following legal bases: <strong style={{ color: 'var(--text)' }}>Contract Performance</strong> — processing necessary to provide the Service you subscribed to; <strong style={{ color: 'var(--text)' }}>Legitimate Interests</strong> — improving our Service, preventing fraud, and ensuring security; <strong style={{ color: 'var(--text)' }}>Legal Obligation</strong> — complying with applicable laws; and <strong style={{ color: 'var(--text)' }}>Consent</strong> — where you have explicitly provided consent, which you may withdraw at any time.
          </Section>

          <Section title="6. How We Share Your Information">
            We do not sell, rent, or trade your personal information. We may share information only in the following limited circumstances: with service providers who assist us in operating the Service and are bound by confidentiality agreements; with Apple for subscription and payment processing; with third-party data providers you have designated via API keys, whose use of data is governed by their own privacy policies; with law enforcement or regulatory authorities when required by applicable law, court order, or governmental authority; and in connection with a merger, acquisition, or sale of assets, with prior notice to you and subject to the same privacy protections.
          </Section>

          <Section title="7. California Privacy Rights (CCPA)">
            If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Know:</strong> You have the right to request information about the categories and specific pieces of personal information we collect, use, disclose, and sell (we do not sell personal information).
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Delete:</strong> You have the right to request deletion of your personal information, subject to certain exceptions.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Opt-Out:</strong> You have the right to opt out of the sale of personal information. We do not sell personal information.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.
            <br /><br />
            To exercise your California privacy rights, contact us at privacy@xatlas.io with the subject line "CCPA Request." We will respond within 45 days.
          </Section>

          <Section title="8. European Privacy Rights (GDPR)">
            If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have the following rights under GDPR:
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right of Access:</strong> Request a copy of the personal data we hold about you.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Rectification:</strong> Request correction of inaccurate or incomplete personal data.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten") where there is no compelling reason for its continued processing.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Restrict Processing:</strong> Request that we restrict processing of your personal data in certain circumstances.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Data Portability:</strong> Receive your personal data in a structured, machine-readable format and transmit it to another controller.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing purposes.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Rights Related to Automated Decision-Making:</strong> Not be subject to solely automated decisions that produce significant legal effects.
            <br /><br />
            To exercise any GDPR rights, contact privacy@xatlas.io. We will respond within 30 days. You also have the right to lodge a complaint with your local supervisory authority.
          </Section>

          <Section title="9. Data Retention">
            We retain your personal information for as long as your account is active or as needed to provide the Service. Upon account deletion, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal, tax, or regulatory purposes, in which case we will retain it for the minimum period required by law and restrict its use to that purpose only.
          </Section>

          <Section title="10. Data Breach Notification">
            In the event of a data breach that affects your personal information, we will notify you and applicable regulatory authorities as required by law. For GDPR purposes, we will notify the relevant supervisory authority within 72 hours of becoming aware of the breach if it is likely to result in a risk to your rights and freedoms. We will notify affected users without undue delay if the breach is likely to result in a high risk to your rights and freedoms. Notification will be provided via email to your registered address and/or prominent notice within the Service.
          </Section>

          <Section title="11. International Data Transfers">
            XATLAS is based in the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States. For users in the EEA, UK, or Switzerland, such transfers are made pursuant to appropriate safeguards including Standard Contractual Clauses approved by the European Commission. By using the Service, you consent to the transfer of your information to the United States.
          </Section>

          <Section title="12. Children's Privacy">
            XATLAS is intended for users 17 years of age and older and is rated 17+ on the Apple App Store. We do not knowingly collect personal information from children under 13 years of age. If we discover we have collected information from a child under 13, we will delete it immediately. If you believe we have inadvertently collected such information, please contact us immediately at privacy@xatlas.io.
          </Section>

          <Section title="13. Security">
            We implement industry-standard technical and organizational security measures including AES-256 encryption at rest, TLS 1.3 encryption in transit, iOS Keychain for API key storage, regular security assessments, and access controls limiting employee access to personal data. However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security and encourage you to use a strong, unique password and enable two-factor authentication where available.
          </Section>

          <Section title="14. Third-Party Services">
            The Service integrates with third-party services. We are not responsible for the privacy practices of these services and encourage you to review their policies: Polygon.io (polygon.io/privacy), Anthropic (anthropic.com/privacy), Apple App Store (apple.com/legal/privacy), FRED Federal Reserve Bank of St. Louis (research.stlouisfed.org/privacy.html).
          </Section>

          <Section title="15. Changes to This Policy">
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of material changes by updating the "Last Updated" date at the top of this policy, sending an email to your registered address, and/or providing prominent notice within the Service. Your continued use of the Service after the effective date of the updated policy constitutes acceptance of the changes.
          </Section>

          <Section title="16. Contact Us and Data Controller">
            XATLAS is the data controller for purposes of GDPR. For privacy-related inquiries, requests, or complaints:
            <br /><br />
            Email: privacy@xatlas.io<br />
            Website: xatlas.io<br />
            Response time: within 30 days (45 days for CCPA requests)
          </Section>

        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>{title}</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.8 }}>{children}</p>
    </div>
  )
}
