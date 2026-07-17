import LogoWordmark from '../components/LogoWordmark'

const MEASURE_REFERENCES = [
  ['10MWT',   '10 Metre Walk Test',                                        'Wade DT. Measurement in Neurological Rehabilitation. Oxford University Press, 1992. MCID: Perera S et al. J Am Geriatr Soc. 2006;54(5):743-9.'],
  ['TUG',     'Timed Up and Go',                                           'Podsiadlo D, Richardson S. J Am Geriatr Soc. 1991;39(2):142-8. Fall-risk threshold: Shumway-Cook A et al. Phys Ther. 2000;80(9):896-903.'],
  ['BBS',     'Berg Balance Scale',                                        'Berg KO et al. Can J Public Health. 1992;83 Suppl 2:S7-11. MCID: Stevenson TJ. Aust J Physiother. 2001;47(1):29-38.'],
  ['6MWT',    '6 Minute Walk Test',                                        'ATS Committee. Am J Respir Crit Care Med. 2002;166(1):111-7. MCID: Perera S et al. J Am Geriatr Soc. 2006;54(5):743-9.'],
  ['FAC',     'Functional Ambulation Classification',                       'Holden MK et al. Phys Ther. 1984;64(1):35-40.'],
  ['FGA',     'Functional Gait Assessment',                                'Wrisley DM et al. Phys Ther. 2004;84(10):906-18.'],
  ['PASS',    'Postural Assessment Scale for Stroke',                       'Benaim C et al. Stroke. 1999;30(9):1862-8.'],
  ['TIS',     'Trunk Impairment Scale',                                    'Verheyden G et al. Clin Rehabil. 2004;18(3):326-34.'],
  ['MAS',     'Motor Assessment Scale',                                    'Carr JH et al. Phys Ther. 1985;65(2):175-80.'],
  ['HiMAT',   'High-Level Mobility Assessment Tool',                        'Williams G et al. Arch Phys Med Rehabil. 2005;86(3):395-400.'],
  ['SARA',    'Scale for the Assessment and Rating of Ataxia',              'Schmitz-Hübsch T et al. Neurology. 2006;66(11):1717-20.'],
  ['Step',    'Step Test',                                                  'Hill KD et al. Arch Phys Med Rehabil. 1996;77(11):1066-70.'],
  ['AMP',     'Amputee Mobility Predictor',                                 'Gailey RS et al. Arch Phys Med Rehabil. 2002;83(5):613-27.'],
  ['BOOMER',  'Balance Outcome Measure for Elder Rehabilitation',           'Haines T et al. Arch Phys Med Rehabil. 2007;88(4):541-7.'],
  ['COVS',    'Clinical Outcome Variation Scale',                           'Seaby L, Torrance G. Physiother Can. 1989;41(5):264-71.'],
  ['Barthel', 'Barthel Index',                                              'Mahoney FI, Barthel DW. Md State Med J. 1965;14:61-5.'],
  ['SCIM',    'Spinal Cord Independence Measure III',                       'Catz A et al. Disabil Rehabil. 2007;29(24):1926-33.'],
  ['ABC',     'Activities-Specific Balance Confidence Scale',               'Powell LE, Myers AM. J Gerontol A Biol Sci Med Sci. 1995;50A(1):M28-34.'],
  ['FSS',     'Fatigue Severity Scale',                                     'Krupp LB et al. Arch Neurol. 1989;46(10):1121-3.'],
  ['HADS',    'Hospital Anxiety and Depression Scale',                      'Zigmond AS, Snaith RP. Acta Psychiatr Scand. 1983;67(6):361-70.'],
  ['PDQ-8',   "Parkinson's Disease Questionnaire (8-item)",                 'Jenkinson C et al. Psychol Health. 1997;12(6):805-14.'],
  ['RPQ',     'Rivermead Post Concussion Symptoms Questionnaire',           'King NS et al. J Neurol. 1995;242(9):587-92.'],
  ['ISNCSCI', 'International Standards for Neurological Classification of SCI', 'American Spinal Injury Association. ASIA International Standards Worksheet, 2019 revision.'],
  ['ACLSigns', 'ACL Clinical Signs (Extension & Effusion)',                  'Effusion (modified stroke test): Sturgill LP et al. J Orthop Sports Phys Ther. 2009;39(12):845-9. Gate criteria: van Melick N et al. Br J Sports Med. 2016;50(24):1506-15.'],
  ['HHS',     'Harris Hip Score',                                            'Harris WH. J Bone Joint Surg Am. 1969;51(4):737-55. Validation: Söderman P, Malchau H. Acta Orthop Scand. 2001;72(6):621-6. MCID: Singh JA et al. BMC Musculoskelet Disord. 2016;17:256.'],
  ['CSI',     'Central Sensitization Inventory',                             'Mayer TG et al. Pain Pract. 2012;12(4):276-85. Severity levels: Neblett R et al. Pain Pract. 2013;13(5):359-69. User’s manual: Neblett R. J Appl Biobehav Res. 2018;23:e12123.'],
]

export default function ClinicalUse() {
  return (
    <>
      <style jsx>{pageStyles}</style>
      <div className="page">
        <div className="content">
          <div className="nav">
            <LogoWordmark href="/" className="wordmark" size="sm" />
          </div>

          <h1 className="title">Clinical Use &amp; Limitations</h1>
          <p className="meta">Last updated: July 2026</p>

          <p className="intro">
            This page describes what RehabMetrics IQ is, what it is not,
            where its calculations come from, and who is intended to use it.
            It is written for the clinicians who use the product, and for the
            professional bodies, employers, and insurers who oversee that use.
          </p>

          <h2>1. What RehabMetrics IQ is</h2>
          <p>
            RehabMetrics IQ is a <strong>clinical decision support and documentation tool</strong>{' '}
            for licensed rehabilitation physiotherapists. It performs automated outcome measure
            scoring, applies published Minimally Clinically Important Difference (MCID) and
            clinical thresholds to track meaningful change, and produces patient-facing reports.
          </p>
          <p>
            It is intended to assist clinicians in measurement, interpretation, and documentation —
            not to replace clinical reasoning.
          </p>

          <h2>2. What RehabMetrics IQ does not do</h2>
          <p>RehabMetrics IQ does not:</p>
          <ul>
            <li>Diagnose conditions, recommend specific treatments, or prescribe interventions.</li>
            <li>Replace the clinical judgement of a qualified rehabilitation physiotherapist.</li>
            <li>Substitute for a comprehensive clinical assessment.</li>
            <li>
              Constitute a regulated medical device under the Australian{' '}
              <em>Therapeutic Goods Act 1989</em>. It is a documentation and decision-support tool
              used by qualified clinicians who remain responsible for all clinical decisions.
            </li>
          </ul>
          <p>
            Any score, threshold flag, MCID determination, or pathway recommendation produced by
            RehabMetrics IQ is offered as <strong>context to inform</strong> — not to direct — your
            clinical reasoning.
          </p>
          <p>
            Patient-reported questionnaire links and email follow-ups are asynchronous documentation tools.
            They are not monitored emergency channels and should not be used for urgent symptoms or new
            medical concerns.
          </p>

          <h2>3. Where calculations and thresholds come from</h2>
          <p>
            Every outcome measure scoring rule, MCID value, MDC threshold, and clinical cut-off
            used by RehabMetrics IQ is derived from peer-reviewed publications, established
            clinical practice guidelines, and the original validation studies for each measure.
            Where multiple reference values exist for a single measure, RehabMetrics IQ uses the
            most widely-cited or population-appropriate value, and surfaces population-specific
            context where relevant.
          </p>
          <p>Original validation references include:</p>

          <div className="refs">
            {MEASURE_REFERENCES.map(([code, name, citation]) => (
              <div className="ref" key={code}>
                <div className="ref-head">
                  <span className="ref-code">{code}</span>
                  <span className="ref-name">{name}</span>
                </div>
                <p className="ref-citation">{citation}</p>
              </div>
            ))}
          </div>

          <h2>4. Who RehabMetrics IQ is intended for</h2>
          <p>
            RehabMetrics IQ is intended exclusively for use by{' '}
            <strong>AHPRA-registered physiotherapists</strong> (or internationally-equivalent
            licensed rehabilitation physiotherapists) acting within their scope of practice.
            It is not designed or licensed for use by:
          </p>
          <ul>
            <li>Patients or members of the public, directly.</li>
            <li>Students or unqualified personnel acting without supervised clinical oversight.</li>
            <li>Clinicians using it outside of an established therapeutic relationship.</li>
          </ul>
          <p>
            Clinicians using RehabMetrics IQ remain solely responsible for ensuring their use
            complies with their professional regulatory body, employer policies, and any relevant
            local laws governing clinical record-keeping and patient data.
          </p>

          <h2>5. Reporting concerns</h2>
          <p>
            If you identify a calculation, threshold, MCID value, or interpretation in the product
            that does not align with your reading of the source literature, please contact us at{' '}
            <a href="mailto:Support@RehabMetricsIQ.com">Support@RehabMetricsIQ.com</a> so we can
            review and correct it. Clinical accuracy is non-negotiable.
          </p>

          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
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
    --color-navy:         #173d68;
  }

  body { font-family: 'Inter', sans-serif; background: var(--color-surface-soft); }

  .page { min-height: 100vh; padding: 48px 24px 80px; }

  .content {
    max-width: 760px;
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
  em { font-style: italic; }

  a { color: var(--color-primary); text-decoration: none; }
  a:hover { text-decoration: underline; }

  .refs {
    display: grid;
    gap: 12px;
    margin: 16px 0 14px;
  }
  .ref {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px 14px;
    background: var(--color-surface-soft);
  }
  .ref-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 4px;
  }
  .ref-code {
    font-weight: 600;
    color: var(--color-navy);
    font-size: 13px;
    min-width: 56px;
  }
  .ref-name {
    font-size: 13px;
    color: var(--color-ink);
  }
  .ref-citation {
    font-size: 12.5px;
    color: var(--color-muted);
    line-height: 1.5;
    margin: 0;
  }

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
    .ref-head { flex-direction: column; gap: 2px; }
  }
`
