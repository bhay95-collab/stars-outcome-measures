import LogoWordmark from '../components/LogoWordmark'

export default function Terms() {
  return (
    <>
      <style jsx>{pageStyles}</style>
      <div className="page">
        <div className="content">
          <div className="nav">
            <LogoWordmark href="/" className="wordmark" size="sm" />
          </div>

          <h1 className="title">Terms of Service</h1>
          <p className="meta">Last updated: July 2026</p>

          <p className="intro">
            Please read these Terms of Service carefully before using RehabMetrics IQ. By creating an account,
            subscribing, or using the service on any platform (web or mobile), you agree to be bound by these
            terms. If you do not agree, do not use the service.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using RehabMetrics IQ, you agree to these Terms of Service, our{' '}
            <a href="/privacy">Privacy Policy</a>, and our <a href="/clinical-use">Clinical Use &amp; Limitations</a>{' '}
            statement, which together form the entire agreement between you and RehabMetrics
            (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;).
          </p>

          <h2>2. Description of Service</h2>
          <p>
            RehabMetrics IQ is a clinical documentation and decision-support tool that helps physiotherapists
            and rehabilitation clinicians record, score, track, and contextualise standardised outcome measures
            against published reference values. The service is provided on a subscription basis following a
            14-day free trial.
          </p>
          <p>
            The service is a <strong>supportive tool only</strong>. It informs — and never replaces — the
            clinical reasoning, professional judgement, and legal responsibility of the treating clinician.
          </p>

          <h2>3. Eligibility and Professional Use</h2>
          <p>
            RehabMetrics IQ is intended exclusively for qualified healthcare professionals. By creating an
            account, you confirm that:
          </p>
          <ul>
            <li>You are a registered or licensed clinician in your jurisdiction (for Australian users, AHPRA-registered), or a student or assistant acting under the direct supervision of one.</li>
            <li>You will use the service only within your scope of practice and in accordance with your professional registration, codes of conduct, employer policies, and applicable law.</li>
            <li>You hold, and will maintain, appropriate professional indemnity insurance covering your clinical practice.</li>
            <li>You will not provide patients or members of the public with direct access to the service, other than the patient-reported questionnaire links the service itself generates.</li>
          </ul>

          <h2>4. Clinical Disclaimer — No Medical Advice, No Diagnosis, No Clearance</h2>
          <p>
            RehabMetrics IQ is a documentation and scoring assistance tool. It is <strong>not a medical
            device</strong> and is not registered with the Therapeutic Goods Administration or any equivalent
            regulator. It does not provide diagnoses, does not recommend or prescribe treatment, and does not
            constitute medical or clinical advice to you or to any patient.
          </p>
          <ul>
            <li>All scores, interpretations, threshold flags, MCID/MDC indicators, trend summaries, rehabilitation-pathway displays, and test-battery statuses are <strong>informational context derived from published literature</strong>, presented to assist — not direct — your clinical reasoning.</li>
            <li>The service never determines patient readiness for any activity. In particular, return-to-sport test batteries and rehabilitation phase trackers <strong>do not constitute a clearance, discharge, or fitness determination</strong> of any kind. Any progression, clearance, or discharge decision is made solely by the treating clinician.</li>
            <li>Published reference values, MCIDs, and cut-offs vary between studies and populations, are updated as literature evolves, and may not apply to an individual patient. You are responsible for confirming that any value you rely upon is appropriate for your patient.</li>
            <li>Despite careful validation, software can contain errors. You must not rely on the service as your sole basis for any clinical decision, and you should report suspected calculation errors to us immediately.</li>
          </ul>
          <p>
            <strong>All clinical decisions, and their consequences, are the sole responsibility of the treating
            clinician.</strong> To the maximum extent permitted by law, we accept no liability for clinical
            decisions, patient outcomes, or patient care made or influenced by information produced by the service.
          </p>

          <h2>5. Not for Emergency or Time-Critical Use</h2>
          <p>
            The service is not designed, intended, or warranted for emergency care, urgent triage, patient
            monitoring, or any time-critical clinical use. Patient-reported questionnaire links and follow-up
            emails are asynchronous, unmonitored documentation tools. You are responsible for ensuring patients
            understand that these channels must not be used for urgent symptoms, emergencies, or new medical
            concerns.
          </p>

          <h2>6. Patient Data, Consent, and Your Obligations</h2>
          <p>
            As between you and us, <strong>you are the health information custodian</strong> of all patient data
            you enter. You are responsible for:
          </p>
          <ul>
            <li>Ensuring you have any patient consent or other lawful basis required to record patient information in the service and to send patient follow-up emails.</li>
            <li>Complying with the privacy, health-records, and record-keeping laws applicable in your jurisdiction (including, for Australian users, the <em>Privacy Act 1988</em> (Cth) and applicable state health-records legislation).</li>
            <li>Entering the minimum patient information needed for your workflow. We recommend patient initials rather than full names, and you must not enter Medicare numbers, insurance numbers, or other government identifiers.</li>
            <li>The accuracy of all data you enter, including entering the correct patient email address before sending any follow-up.</li>
            <li>Maintaining your own primary clinical record in accordance with your professional obligations. The service supplements, and does not replace, your official patient health record.</li>
          </ul>

          <h2>7. Your Data — Export, Backup, and Deletion</h2>
          <p>
            You may request an export of your data at any time, and you can delete your account and its data
            from within the mobile app (see our <a href="/data-deletion">Data Deletion</a> page). Deletion is
            permanent and cannot be reversed by us. Before cancelling a subscription or deleting an account,
            you are responsible for exporting any records you are required to retain under your professional
            record-keeping obligations.
          </p>

          <h2>8. Trial and Subscription</h2>
          <ul>
            <li>New accounts receive a 14-day free trial with full access to all features.</li>
            <li>No credit card is required to start a trial.</li>
            <li>After the trial period, continued access requires a paid subscription.</li>
            <li>Subscription fees are billed monthly or annually through Stripe on the web or Apple&apos;s App Store on iOS.</li>
            <li>App Store subscriptions renew automatically unless cancelled at least 24 hours before the end of the current billing period.</li>
            <li>You may cancel at any time through the billing provider used to purchase your subscription. Access continues until the end of the paid billing period.</li>
            <li>Deleting your RehabMetrics IQ account does not automatically cancel an App Store subscription. You must cancel it separately in your Apple subscription settings.</li>
          </ul>

          <h2>9. Account Security and Acceptable Use</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and for all
            activity under your account. Notify us immediately if you suspect unauthorised access.
            You agree not to:
          </p>
          <ul>
            <li>Use the service for any unlawful purpose or in breach of your professional obligations.</li>
            <li>Share your account credentials or allow anyone else to practise under your account.</li>
            <li>Attempt to reverse-engineer, copy, scrape, resell, or provide the service to third parties.</li>
            <li>Upload content that is false, misleading, malicious, or violates third-party rights.</li>
            <li>Attempt to access data belonging to other accounts, probe or test the security of the service without our written consent, or interfere with its operation.</li>
          </ul>

          <h2>10. Intellectual Property</h2>
          <p>
            All content, design, and software comprising RehabMetrics IQ is the property of RehabMetrics and
            is protected by copyright. Clinical outcome measure scoring algorithms are derived from publicly
            available published literature and referenced accordingly.
          </p>
          <p>
            Standardised outcome measures remain the intellectual property of their respective authors and
            rights holders. The service includes only instruments that are freely available for clinical use
            or for which appropriate licences are held. You must not use the service to reproduce, distribute,
            or administer any licensed instrument beyond what the service itself provides.
          </p>

          <h2>11. Service Availability and Changes</h2>
          <p>
            We aim for a reliable service but do not guarantee uninterrupted or error-free availability.
            The service may be temporarily unavailable during maintenance, upgrades, or events outside our
            reasonable control. Plan your clinical workflow so that a service interruption cannot compromise
            patient care.
          </p>
          <p>
            We may add, modify, or remove features, and may update scoring rules, reference values, and
            thresholds as published literature evolves. If we discontinue the service entirely, we will give
            at least 30 days&apos; notice and a reasonable opportunity to export your data.
          </p>

          <h2>12. Warranty Disclaimer</h2>
          <p>
            To the maximum extent permitted by law, the service is provided <strong>&ldquo;as is&rdquo; and
            &ldquo;as available&rdquo;</strong>, and we exclude all warranties, conditions, and guarantees not
            expressly stated in these terms, including any implied warranty of fitness for a particular
            purpose. Nothing in these terms excludes, restricts, or modifies any consumer guarantee or other
            right under the Australian Consumer Law or other law that cannot lawfully be excluded.
          </p>

          <h2>13. Indemnity</h2>
          <p>
            To the extent permitted by law, you agree to indemnify us against any claim, loss, or liability
            (including reasonable legal costs) brought by a third party — including a patient — arising from:
            (a) your clinical decisions, treatment, or professional conduct; (b) your breach of these terms;
            (c) patient data you entered without consent or other lawful basis; or (d) your breach of privacy,
            health-records, or professional-registration obligations. This indemnity does not apply to the
            extent a claim arises from our negligence or breach of these terms.
          </p>

          <h2>14. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, RehabMetrics shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, loss of profits, loss of data, or loss of goodwill
            arising from your use of (or inability to use) the service, including any clinical outcomes or
            patient care decisions.
          </p>
          <p>
            Where liability cannot be excluded but can lawfully be limited (including under section 64A of the
            Australian Consumer Law), our liability for a failure relating to the service is limited, at our
            option, to resupplying the service or paying the cost of having the service resupplied.
          </p>
          <p>
            Subject to the above, our total aggregate liability to you shall not exceed the amount you paid
            for the service in the three months preceding the claim.
          </p>

          <h2>15. Suspension and Termination</h2>
          <p>
            You may stop using the service and cancel your subscription at any time. We may suspend or
            terminate your account if you materially breach these terms (including use by non-clinicians,
            credential sharing, or misuse of patient data), if required by law, or if your subscription
            payment fails after reasonable notice. Where practical, we will give you notice and an
            opportunity to export your data before termination. Sections 4, 5, 6, 10, 12, 13, and 14
            survive termination.
          </p>

          <h2>16. Changes to These Terms</h2>
          <p>
            We may update these terms from time to time. We will notify you by email of material changes at
            least 14 days before they take effect. Continued use of the service after changes take effect
            constitutes acceptance of the updated terms; if you do not agree, you may cancel before the
            changes take effect.
          </p>

          <h2>17. General</h2>
          <p>
            If any provision of these terms is found invalid or unenforceable, the remaining provisions
            continue in full force. Our failure to enforce a provision is not a waiver of it. You may not
            assign these terms without our consent; we may assign them as part of a business sale or
            restructure with notice to you. Neither party is liable for delay or failure caused by events
            beyond its reasonable control.
          </p>

          <h2>18. Governing Law</h2>
          <p>
            These terms are governed by the laws of Victoria, Australia. Any disputes shall be subject to the
            exclusive jurisdiction of the courts of Victoria, Australia.
          </p>

          <h2>19. Contact</h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a href="mailto:Support@RehabMetricsIQ.com">Support@RehabMetricsIQ.com</a>.
          </p>

          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/data-deletion">Data Deletion</a>
            <a href="/">Back to home</a>
          </div>
        </div>
      </div>
    </>
  )
}

const pageStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --color-primary:      #236499;
    --color-ink:          #1F2933;
    --color-muted:        #5F6B7A;
    --color-subtle:       #8A96A3;
    --color-surface:      #FFFFFF;
    --color-surface-soft: #F7FAFC;
    --color-border:       #D8E2EC;
  }

  body { font-family: 'Inter', sans-serif; background: var(--color-surface-soft); }

  .page { min-height: 100vh; padding: 48px 24px 80px; }

  .content {
    max-width: 720px;
    margin: 0 auto;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 48px 56px;
  }

  .nav { margin-bottom: 40px; }

  .wordmark { text-decoration: none; }

  .title {
    font-family: 'Source Serif 4', serif;
    font-size: 32px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .meta {
    font-size: 13px;
    color: var(--color-subtle);
    margin-bottom: 32px;
  }

  .intro {
    font-size: 16px;
    color: var(--color-muted);
    line-height: 1.7;
    margin-bottom: 40px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--color-border);
  }

  h2 {
    font-family: 'Source Serif 4', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-ink);
    margin-top: 36px;
    margin-bottom: 12px;
  }

  p {
    font-size: 15px;
    color: var(--color-muted);
    line-height: 1.7;
    margin-bottom: 14px;
  }

  ul { margin: 0 0 14px 20px; }

  li {
    font-size: 15px;
    color: var(--color-muted);
    line-height: 1.7;
    margin-bottom: 6px;
  }

  strong { color: var(--color-ink); font-weight: 500; }

  a { color: var(--color-primary); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .footer-links {
    display: flex;
    gap: 24px;
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--color-border);
    font-size: 13px;
  }

  @media (max-width: 640px) {
    .content { padding: 32px 24px; }
    .title { font-size: 26px; }
    .footer-links { flex-direction: column; gap: 12px; }
  }
`
