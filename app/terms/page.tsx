export default function TermsOfService() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem' }}>
        <a href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-2)', textDecoration: 'none', display: 'block', marginBottom: '3rem' }}>← Back to XAtlas</a>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Terms of Service</h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)', marginBottom: '1.5rem' }}>Effective March 23, 2026 · Last updated March 25, 2026</p>

        <div style={{ border: '1px solid var(--border-2)', borderRadius: '12px', padding: '1.25rem', background: 'var(--bg-1)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-2)' }}>Also available on iubenda:</span>
          <a href="https://www.iubenda.com/terms-and-conditions/19345970" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)', textDecoration: 'none' }}>View Terms on iubenda →</a>
        </div>

        {/* Investment Disclaimer */}
        <div style={{ border: '1px solid rgba(74,222,128,0.3)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(74,222,128,0.04)', marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--green)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>INVESTMENT DISCLAIMER — READ CAREFULLY</p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8 }}>
            XAtlas is provided for <strong style={{ color: 'var(--text)' }}>informational and educational purposes only</strong>. Nothing in this application constitutes financial, investment, legal, or tax advice. Conviction scores, signals, macro analysis, and all market intelligence provided by XAtlas are <strong style={{ color: 'var(--text)' }}>not recommendations</strong> to buy, sell, or hold any security, financial instrument, or asset of any kind. Past performance is not indicative of future results. All investments involve risk, including the possible loss of principal. Market data and signals may be delayed, inaccurate, or incomplete. XAtlas is <strong style={{ color: 'var(--text)' }}>not a registered investment advisor</strong>, broker-dealer, financial planner, or fiduciary under any applicable law. Use of this Service does not create any advisory, fiduciary, or professional relationship between XAtlas and you. <strong style={{ color: 'var(--text)' }}>You are solely and entirely responsible for your own investment decisions.</strong> Always consult a qualified, licensed financial professional before making any investment decision.
          </p>
        </div>

        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 2, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <Section title="1. Agreement to Terms">
            By downloading, installing, accessing, or using the XAtlas mobile application or website (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy, which is incorporated herein by reference. If you do not agree to all of these Terms, you are prohibited from using the Service and must discontinue use immediately. These Terms constitute a legally binding agreement between you and XAtlas.
          </Section>

          <Section title="2. Eligibility">
            You must be at least 17 years old to use XAtlas, consistent with our App Store rating. By using the Service, you represent and warrant that: (a) you are at least 17 years of age; (b) you have the legal capacity and authority to enter into these Terms; (c) you are not prohibited from using the Service under applicable law; and (d) you will comply with all applicable laws and regulations in your use of the Service.
          </Section>

          <Section title="3. Account Registration and Security">
            To access certain features, you must create an account. You agree to: provide accurate, current, and complete information; maintain and promptly update your account information; maintain the security and confidentiality of your login credentials; notify us immediately at legal@xatlas.io of any unauthorized access or security breach; and accept full responsibility for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these Terms, at our sole discretion, with or without notice.
          </Section>

          <Section title="4. Subscriptions and Billing">
            <strong style={{ color: 'var(--text)' }}>Subscription Tiers:</strong> XAtlas offers Free ($0/month), Pro Monthly ($29.99/month with 7-day free trial), Pro Annual ($199.99/year with 7-day free trial), and Founding Member Lifetime ($499.99 one-time payment, available until June 23, 2026) plans with features as described on our website.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Billing:</strong> All subscriptions are billed through Apple&apos;s in-app purchase system. By subscribing, you authorize Apple to charge your Apple ID account on a recurring basis. Payment is charged upon confirmation of purchase.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Auto-Renewal:</strong> Subscriptions automatically renew at the end of each billing period unless cancelled. You will be charged for renewal within 24 hours before the end of the current period at the same price unless the price has changed.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Cancellation:</strong> You may cancel your subscription at any time through your Apple ID account settings (Settings → Apple ID → Subscriptions → XAtlas → Cancel Subscription). Cancellation takes effect at the end of the current billing period. You will continue to have access to paid features until the end of the period for which you have already paid. Deleting the app does not cancel your subscription — you must cancel through Apple ID settings.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Refunds:</strong> All purchases are final and non-refundable except where required by applicable law or Apple&apos;s refund policies. To request a refund, contact Apple directly at reportaproblem.apple.com.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Free Trial:</strong> Pro Monthly and Pro Annual plans include a 7-day free trial. The trial will automatically convert to a paid subscription at the end of the trial period unless cancelled at least 24 hours before the trial ends. The Founding Member Lifetime plan does not include a free trial and is available for a limited time only (until June 23, 2026).
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Price Changes:</strong> We reserve the right to change subscription prices. We will provide at least 30 days&apos; notice of any price changes via email or in-app notification. If you do not cancel before the price change takes effect, your continued use constitutes acceptance of the new price.
          </Section>

          <Section title="5. Bring Your Own Key (BYOK)">
            XAtlas supports integration with third-party services through a Bring Your Own Key (BYOK) architecture. By providing API keys, you represent and warrant that: you have the legal right and authority to use those API keys; you accept and will comply with the terms of service of the respective third-party providers; you understand that all usage costs, fees, and charges from third-party providers are solely your responsibility; and you grant XAtlas a limited license to use those keys solely to provide the Service to you. You are solely responsible for the security of API keys you provide and for any actions taken using those keys.
          </Section>

          <Section title="6. Acceptable Use Policy">
            You agree not to use the Service to: violate any applicable local, state, national, or international law or regulation; engage in any fraudulent, deceptive, or manipulative market activity; attempt to reverse engineer, decompile, disassemble, or derive source code from the Service; use automated tools, bots, or scripts to scrape, extract, or collect data from the Service; share, sell, or transfer your account credentials to any third party; upload or transmit viruses, malware, or other harmful code; interfere with or disrupt the integrity or performance of the Service or its servers; circumvent any technical measures or security controls; impersonate any person or entity or misrepresent your affiliation; or use the Service in any manner that could damage, disable, or impair the Service.
          </Section>

          <Section title="7. Intellectual Property">
            The Service and all of its content, features, and functionality — including but not limited to the XAtlas name, logo, design, text, graphics, interfaces, code, algorithms, conviction scoring methodology, and all other materials — are owned by XAtlas and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to use the Service solely for your personal, non-commercial use in accordance with these Terms. You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, or otherwise use any materials from the Service without our prior written consent.
          </Section>

          <Section title="8. Third-Party Data and Services">
            The Service relies on third-party data providers including Polygon.io, the Federal Reserve Bank of St. Louis (FRED), and others. We make no representations or warranties regarding the accuracy, completeness, timeliness, or reliability of any third-party data. Market data may be delayed, erroneous, or unavailable. We are not responsible for any errors or omissions in third-party data or for any trading losses, investment decisions, or other damages arising from your reliance on such data. Third-party services are subject to their own terms of service and privacy policies.
          </Section>

          <Section title="9. Disclaimer of Warranties">
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, XATLAS EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. XATLAS DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. XATLAS DOES NOT WARRANT THE ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY INFORMATION PROVIDED THROUGH THE SERVICE. NO ADVICE OR INFORMATION OBTAINED FROM XATLAS SHALL CREATE ANY WARRANTY NOT EXPRESSLY STATED IN THESE TERMS.
          </Section>

          <Section title="10. Limitation of Liability">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL XATLAS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO: LOSS OF PROFITS, REVENUE, OR DATA; INVESTMENT LOSSES OR TRADING LOSSES; LOSS OF GOODWILL; BUSINESS INTERRUPTION; COST OF SUBSTITUTE SERVICES; OR ANY OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            <br /><br />
            IN NO EVENT SHALL XATLAS&apos;S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE EXCEED THE GREATER OF: (A) THE TOTAL AMOUNT YOU PAID TO XATLAS IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100.00).
            <br /><br />
            SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
          </Section>

          <Section title="11. Indemnification">
            You agree to indemnify, defend, and hold harmless XAtlas and its officers, directors, employees, agents, and successors from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising from or relating to: your use of or inability to use the Service; your violation of these Terms; your violation of any third-party right, including any intellectual property right or privacy right; your violation of any applicable law or regulation; any content you submit or transmit through the Service; or any investment decisions or trading activity you undertake based on information from the Service.
          </Section>

          <Section title="12. Dispute Resolution and Binding Arbitration">
            PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Informal Resolution:</strong> Before initiating arbitration, you agree to first contact us at legal@xatlas.io and attempt to resolve the dispute informally for at least 30 days.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Binding Arbitration:</strong> If informal resolution fails, any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall be finally resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. The arbitration shall be conducted in San Antonio, Texas, or via videoconference. The arbitrator&apos;s decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Class Action Waiver:</strong> YOU AND XATLAS AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. The arbitrator may not consolidate more than one person&apos;s claims.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Exceptions:</strong> Either party may seek emergency injunctive relief in a court of competent jurisdiction to prevent irreparable harm pending arbitration. Claims of intellectual property infringement may be brought in court.
            <br /><br />
            <strong style={{ color: 'var(--text)' }}>Opt-Out:</strong> You may opt out of binding arbitration within 30 days of first accepting these Terms by emailing legal@xatlas.io with the subject &quot;Arbitration Opt-Out.&quot;
          </Section>

          <Section title="13. Force Majeure">
            XAtlas shall not be liable for any failure or delay in performance of its obligations under these Terms arising out of or caused by events beyond its reasonable control, including but not limited to: acts of God, natural disasters, earthquakes, floods, or severe weather; war, terrorism, riots, or civil unrest; government actions, sanctions, embargoes, or regulatory changes; pandemics, epidemics, or public health emergencies; strikes, labor disputes, or industrial action; failure of third-party infrastructure, internet outages, or utility disruptions; cyberattacks, hacking, or denial-of-service attacks; or market closures, trading halts, or exchange outages. In such events, XAtlas will use commercially reasonable efforts to resume performance as soon as practicable.
          </Section>

          <Section title="14. Governing Law and Jurisdiction">
            These Terms are governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law principles. Subject to the arbitration agreement above, any legal action or proceeding not subject to arbitration shall be brought exclusively in the state or federal courts located in Bexar County, Texas, and you consent to the personal jurisdiction of such courts.
          </Section>

          <Section title="15. Termination">
            We may suspend or terminate your access to the Service at any time, with or without cause, and with or without notice, including for violation of these Terms. Upon termination: your right to use the Service immediately ceases; any outstanding subscription payments remain due; provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, limitations of liability, and dispute resolution.
          </Section>

          <Section title="16. Changes to Terms">
            We reserve the right to modify these Terms at any time. We will notify you of material changes by: updating the &quot;Last Updated&quot; date at the top; sending an email to your registered address; and/or providing prominent notice within the Service. Changes become effective upon posting unless otherwise stated. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the Service.
          </Section>

          <Section title="17. Severability and Waiver">
            If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect. Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision unless acknowledged and agreed to by us in writing.
          </Section>

          <Section title="18. Entire Agreement">
            These Terms, together with our Privacy Policy and any other legal notices or agreements published by XAtlas in connection with the Service, constitute the entire agreement between you and XAtlas regarding your use of the Service and supersede all prior agreements, understandings, negotiations, and discussions between the parties relating to the subject matter herein.
          </Section>

          <Section title="19. Contact Us">
            For questions about these Terms or the Service:
            <br /><br />
            General: legal@xatlas.io<br />
            Privacy: privacy@xatlas.io<br />
            Support: <a href="https://xatlas.io/support" style={{ color: 'var(--green)', textDecoration: 'none' }}>xatlas.io/support</a><br />
            Response time: within 30 business days
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
