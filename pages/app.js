import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import PatientList from '../components/PatientList'
import NewPatientModal from '../components/NewPatientModal'
import PatientHeader from '../components/PatientHeader'
import SummaryTab from '../components/SummaryTab'
import MeasureEntry from '../components/MeasureEntry'

export async function getServerSideProps() { return { props: {} } }

export default function App() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trialValid, setTrialValid] = useState(null)
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [view, setView] = useState('summary')

  const handleAssessmentSaved = useCallback((assessment) => {
    if (assessment) setAssessments(prev => [assessment, ...prev])
    setView('summary')
  }, [])

  useEffect(() => {
    async function checkAccess() {
      let session
      try {
        const { data } = await supabase.auth.getSession()
        session = data.session
      } catch {
        router.replace('/login')
        return
      }

      if (!session?.user) {
        router.replace('/login')
        return
      }

      setUser(session.user)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('trial_end_date')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError) {
        setTrialValid(false)
        setLoading(false)
        return
      }

      const valid = profile ? new Date(profile.trial_end_date) > new Date() : false
      setTrialValid(valid)

      if (valid) {
        const { data: pats } = await supabase
          .from('patients')
          .select('*')
          .order('initials', { ascending: true })
        setPatients(pats ?? [])
      }

      setLoading(false)
    }

    checkAccess()
  }, [router])

  const handlePatientSelect = useCallback(async (patient) => {
    setSelectedPatient(patient)
    setView('summary')
    const { data } = await supabase
      .from('assessments')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
    setAssessments(data ?? [])
  }, [])

  const handlePatientCreated = useCallback((patient) => {
    setPatients(prev =>
      [...prev, patient].sort((a, b) =>
        (a.initials ?? '').localeCompare(b.initials ?? '')
      )
    )
    setShowNewPatient(false)
    handlePatientSelect(patient)
  }, [handlePatientSelect])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <>
        <style jsx global>{globalStyles}</style>
        <div className="loading-page"><p className="loading-text">Loading…</p></div>
      </>
    )
  }

  if (!trialValid) {
    return (
      <>
        <style jsx global>{globalStyles}</style>
        <div className="page">
          <header className="header">
            <div className="header-inner">
              <div className="wordmark">
                <img src="/SquareLogo.png" alt="" aria-hidden="true" />
                <span>RehabMetrics</span>
                <span className="wordmark-iq"> IQ</span>
              </div>
              {user?.email && (
                <>
                  <span data-header-divider="" />
                  <span data-header-subtitle="">{user.email}</span>
                </>
              )}
              <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
            </div>
          </header>
          <main className="main-center">
            <div className="expired-card">
              <p className="tier-label">Trial ended</p>
              <h1 className="heading">Your trial has expired</h1>
              <p className="subtext">To continue using RehabMetrics IQ, please upgrade your plan.</p>
              <button className="upgrade-btn" disabled>Upgrade (coming soon)</button>
            </div>
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx global>{globalStyles}</style>
      {showNewPatient && (
        <NewPatientModal
          userId={user.id}
          onCreated={handlePatientCreated}
          onClose={() => setShowNewPatient(false)}
        />
      )}
      <div className="page">
        <header className="header">
          <div className="header-inner">
            <div className="wordmark">
              <img src="/SquareLogo.png" alt="" aria-hidden="true" />
              <span>RehabMetrics</span>
              <span className="wordmark-iq"> IQ</span>
            </div>
            {user?.email && (
              <>
                <span data-header-divider="" />
                <span data-header-subtitle="">{user.email}</span>
              </>
            )}
            <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </header>
        <div className="dashboard">
          <aside className="sidebar">
            <PatientList
              patients={patients}
              selectedId={selectedPatient?.id ?? null}
              onSelect={handlePatientSelect}
              onNew={() => setShowNewPatient(true)}
            />
          </aside>
          <main className="main">
            {selectedPatient ? (
              <>
                <PatientHeader
                  patient={selectedPatient}
                  assessments={assessments}
                  onViewChange={setView}
                  activeView={view}
                />
                {view === 'summary' ? (
                  <SummaryTab
                    patient={selectedPatient}
                    assessments={assessments}
                  />
                ) : (
                  <MeasureEntry
                    patient={selectedPatient}
                    userId={user.id}
                    onSaved={handleAssessmentSaved}
                    onDone={() => setView('summary')}
                  />
                )}
              </>
            ) : (
              <div className="patient-card" data-empty="">
                <p className="section-label">Clinical Summary</p>
                <p className="empty-hint">Select a patient from the left panel to view their clinical summary.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

const globalStyles = `
  /* ── RESET & TOKENS ── */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --color-primary:      #236499;
    --color-primary-dark: #17496F;
    --color-primary-soft: #EAF3FB;
    --color-secondary:    #7FB3E6;
    --color-ink:          #1F2933;
    --color-muted:        #5F6B7A;
    --color-subtle:       #8A96A3;
    --color-surface:      #FFFFFF;
    --color-surface-soft: #f4f3f0;
    --color-border:       #D8E2EC;
    --shadow-sm:          0 1px 2px rgba(31,41,51,0.06);
    --shadow-md:          0 6px 16px rgba(31,41,51,0.08);
    --radius-sm:          6px;
    --radius-md:          10px;
    --radius-lg:          16px;
  }

  body { font-family: 'Inter', sans-serif; }

  /* ── PAGE SHELL ── */
  .loading-page { min-height: 100vh; background: var(--color-surface-soft); display: flex; align-items: center; justify-content: center; }
  .loading-text { font-size: 14px; color: var(--color-subtle); }
  .page { min-height: 100vh; background: var(--color-surface-soft); }

  .header { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 10; }
  .header-inner { height: 80px; max-width: 1300px; margin: 0 auto; padding: 0 32px; display: flex; align-items: center; gap: 16px; }

  .wordmark { font-family: 'Source Serif 4', serif; font-size: 30px; font-weight: 400; color: var(--color-primary); letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .wordmark > img { height: 30px; width: 30px; object-fit: contain; flex-shrink: 0; }
  .wordmark > span:first-of-type { font-weight: 700; color: var(--color-primary); }
  .wordmark-iq { font-style: normal; font-weight: 600; color: var(--color-secondary); }

  [data-header-divider] { width: 1px; height: 28px; background: var(--color-border); flex-shrink: 0; }
  [data-header-subtitle] { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--color-subtle); font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }

  .signout-btn { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: var(--color-muted); background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 6px 14px; cursor: pointer; transition: color 0.15s, border-color 0.15s, background 0.15s; flex-shrink: 0; margin-left: auto; }
  .signout-btn:hover { color: var(--color-ink); border-color: var(--color-muted); background: rgba(255,255,255,0.8); }

  .dashboard { max-width: 1300px; margin: 0 auto; padding: 24px 32px 60px; display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
  .sidebar { }
  .main { min-width: 0; }

  /* Trial expired */
  .main-center { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 60px 32px; }
  .expired-card { max-width: 480px; }
  .tier-label { font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-subtle); margin-bottom: 12px; }
  .heading { font-family: 'Source Serif 4', serif; font-size: 32px; font-weight: 600; color: var(--color-ink); line-height: 1.2; margin-bottom: 12px; }
  .subtext { font-size: 15px; color: var(--color-muted); line-height: 1.6; }
  .upgrade-btn { margin-top: 24px; padding: 10px 24px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: var(--color-subtle); background: var(--color-surface-soft); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: not-allowed; }

  /* ── PATIENT CARD ── */
  .patient-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
  }

  .patient-card[data-empty] {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px dashed var(--color-border);
    box-shadow: none;
  }

  .empty-hint { font-size: 14px; color: var(--color-muted); line-height: 1.7; font-weight: 300; }

  .section-label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 14px;
  }

  .patient-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px 20px;
    margin-bottom: 16px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 0;
  }

  .field-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-muted);
  }

  .field-input {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: var(--color-ink);
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 7px 10px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .field-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(35,100,153,0.1);
    background: #fff;
  }
  .field-input::placeholder { color: var(--color-subtle); }
  select.field-input { cursor: pointer; }

  /* PatientHeader: value spans inside field-group */
  .field-group > span:not(.field-label) {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-ink);
    line-height: 1.3;
  }

  /* Diagnosis field accent */
  .field-group[data-field="diagnosis"] > span:not(.field-label) {
    color: var(--color-primary-dark);
  }

  /* PatientList: list items inside patient-card */
  .patient-card ul {
    list-style: none;
    margin: 8px -24px 0;
    padding: 4px 0 0;
    border-top: 1px solid var(--color-border);
  }

  .patient-card li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: background 0.1s, border-color 0.1s;
    outline: none;
  }

  /* First-letter avatar circle */
  .patient-card li[data-initials]::before {
    content: attr(data-initials);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    min-width: 28px;
    border-radius: 50%;
    background: var(--color-primary-soft);
    border: 1px solid var(--color-border);
    color: var(--color-primary-dark);
    font-size: 11px;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    text-transform: uppercase;
  }

  .patient-card li strong {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-ink);
    font-style: normal;
    line-height: 1.3;
  }

  .patient-card li:hover:not([aria-selected="true"]) { background: rgba(35,100,153,0.04); }

  .patient-card li[aria-selected="true"] {
    background: var(--color-primary-soft);
    border-left-color: var(--color-primary);
  }

  .patient-card li[aria-selected="true"] strong { color: var(--color-primary-dark); }

  .patient-card li[aria-selected="true"][data-initials]::before {
    background: rgba(35,100,153,0.18);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .patient-card li > span {
    display: block;
    font-size: 11px;
    color: var(--color-subtle);
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .patient-card li[role="presentation"] {
    cursor: default;
    border-left-color: transparent;
    font-size: 13px;
    color: var(--color-subtle);
    font-style: italic;
    font-weight: 400;
  }
  .patient-card li[role="presentation"]:hover { background: none; }

  /* New Patient button (after ul) */
  .patient-card > ul + button {
    display: block;
    width: calc(100% + 48px);
    margin-left: -24px;
    padding: 12px 24px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-primary);
    background: var(--color-surface);
    border: none;
    border-top: 1px solid var(--color-border);
    cursor: pointer;
    transition: background 0.15s;
    text-align: center;
    letter-spacing: 0.2px;
  }
  .patient-card > ul + button:hover { background: var(--color-primary-soft); }

  /* New Assessment button (after patient-grid) */
  .patient-card > .patient-grid + button {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-md);
    padding: 11px 22px;
    cursor: pointer;
    transition: background 0.15s;
    letter-spacing: 0.2px;
  }
  .patient-card > .patient-grid + button:hover { background: var(--color-primary-dark); }

  /* ── DATA TABLE ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table th { text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-subtle); padding: 0 10px 8px; border-bottom: 2px solid var(--color-border); }
  .data-table td { padding: 8px 10px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover td { background: var(--color-surface-soft); }

  .input-narrow {
    width: 110px;
    background: #fffef9;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    font-family: monospace;
    font-size: 13px;
    color: var(--color-ink);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .input-narrow:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(35,100,153,0.1); background: #fff; }

  .calc-value { font-family: monospace; font-size: 13px; color: var(--color-primary); font-weight: 500; }
  .ref-note { font-size: 11px; color: var(--color-subtle); font-style: italic; line-height: 1.4; }
  .na-text { color: var(--color-subtle); font-style: italic; font-size: 12px; }

  /* ── CHIPS ── */
  .interp-chip { display: inline-flex; align-items: center; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 99px; border: 1px solid; white-space: nowrap; }
  .chip-green { background: #e8f4ef; color: #2d6a4f; border-color: #b7dfc9; }
  .chip-amber { background: #fef3e2; color: #a05c00; border-color: #f5d49a; }
  .chip-red   { background: #fdf0ec; color: #b5451b; border-color: #f0b8a2; }
  .chip-grey  { background: var(--color-surface-soft); color: var(--color-subtle); border-color: var(--color-border); }

  /* ── INFO PANEL ── */
  .info-panel { padding: 14px 16px; background: #eef3fa; border: 1px solid #c8d9ef; border-radius: var(--radius-sm); font-size: 12px; color: #1d4e89; line-height: 1.6; margin-top: 14px; margin-bottom: 16px; }
  .info-panel strong { font-weight: 600; }

  /* ── RESULT BOX ── */
  .result-box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
  }

  .result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }

  .result-row:last-child { margin-bottom: 0; }

  .result-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 4px;
    display: block;
  }

  /* Form10MWT save button inside result-box */
  .result-box > button[type="submit"] {
    width: 100%;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-surface);
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-md);
    padding: 12px 24px;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 8px;
  }
  .result-box > button[type="submit"]:hover { background: var(--color-primary-dark); }
  .result-box > button[type="submit"]:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Clinical speed number — monospace, primary blue */
  .result-box strong {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 32px;
    font-weight: 600;
    color: var(--color-primary);
    line-height: 1;
    letter-spacing: -0.5px;
  }

  /* Meta lines (% predicted, fast speed) */
  .result-box p { font-size: 12px; color: var(--color-muted); margin-bottom: 4px; line-height: 1.5; }

  /* Pending state text */
  .result-box em { font-size: 13px; color: var(--color-subtle); display: block; margin-bottom: 16px; font-style: italic; }

  /* Error message */
  .error {
    font-size: 13px;
    color: #b5451b;
    padding: 8px 12px;
    background: #fdf0ec;
    border: 1px solid #f0b8a2;
    border-radius: var(--radius-sm);
    line-height: 1.4;
    margin-top: 12px;
  }

  /* ── MEASURE HEADER ── */
  .measure-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .measure-title { font-family: 'Source Serif 4', serif; font-size: 22px; font-weight: 600; color: var(--color-ink); letter-spacing: -0.3px; }
  .measure-subtitle { font-size: 12px; color: var(--color-subtle); margin-top: 2px; }

  /* ── MODALS ── */
  .modal {
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15,23,32,0.45);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 200;
    padding: 32px 24px;
    overflow-y: auto;
    backdrop-filter: blur(2px);
  }

  .modal-content {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 20px 48px rgba(31,41,51,0.14);
    width: 100%;
    max-width: 520px;
    margin: auto;
    flex-shrink: 0;
    overflow: hidden;
  }

  .modal-content[data-wide] { max-width: 900px; }

  /* Modal: NewPatientModal — section-label as header row */
  .modal-content > .section-label {
    padding: 24px 28px 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-soft);
    margin-bottom: 0;
    font-size: 18px;
    font-family: 'Source Serif 4', serif;
    font-weight: 600;
    letter-spacing: -0.2px;
    text-transform: none;
    color: var(--color-ink);
  }

  /* Modal: NewPatientModal — close button in header row */
  .modal-content > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 28px 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-soft);
  }

  /* Close buttons in modals */
  .modal-content button[aria-label="Close"] {
    font-size: 22px;
    color: var(--color-subtle);
    background: none;
    border: none;
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: color 0.15s, background 0.15s;
    flex-shrink: 0;
  }
  .modal-content button[aria-label="Close"]:hover { color: var(--color-ink); background: var(--color-border); }

  /* Inline panel — measure-header padding */
  [data-measure-panel] > .measure-header { padding: 20px 24px; margin-bottom: 0; }

  /* Modal: form padding — applies to both NewPatientModal and MeasureEntry */
  .modal-content > form,
  .modal-content form { padding: 24px 28px 28px; }

  /* Override form padding for MeasureEntry */
  .modal-content[data-wide] > form,
  .modal-content[data-wide] form { padding: 0 24px 24px; }

  /* Header section-label: no bottom margin */
  .modal-content > header .section-label { margin-bottom: 0; }

  /* Modal: form action buttons row (last div in form) */
  .modal-content form > div:last-child {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--color-border);
  }

  .modal-content form button[type="button"] {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-muted);
    background: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 8px 20px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }
  .modal-content form button[type="button"]:hover { color: var(--color-ink); border-color: var(--color-muted); }

  .modal-content form button[type="submit"] {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-surface);
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-sm);
    padding: 8px 20px;
    cursor: pointer;
    transition: opacity 0.15s;
    letter-spacing: 0.1px;
  }
  .modal-content form button[type="submit"]:hover { opacity: 0.88; }
  .modal-content form button[type="submit"]:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Modal: error message padding */
  .modal-content > .error { margin: 0 24px 20px; }

  /* ── SUMMARY TAB DATA ATTRIBUTES ── */
  .result-box[data-dim] { opacity: 0.55; }

  [data-mcid] {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm);
    padding: 7px 12px;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 600;
    background: var(--color-surface-soft);
  }
  [data-mcid="met"]     { color: #2d6a4f; border-color: #b7dfc9; background: #e8f4ef; }
  [data-mcid="near"]    { color: var(--color-muted); }
  [data-mcid="decline"] { color: #b5451b; border-color: #f0b8a2; background: #fdf0ec; }

  /* ── PROGRESS CHART ── */
  [data-chart] {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 20px 12px 12px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 16px;
  }

  [data-chart]::before {
    content: '10MWT Progress';
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--color-subtle);
    padding: 0 8px;
    margin-bottom: 12px;
  }

  [data-chart] svg { width: 100%; height: auto; display: block; }

  /* ── MEASURE ENTRY LAYOUT ── */
  [data-measure-layout] {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 480px;
    border-top: 1px solid var(--color-border);
  }

  [data-measure-nav] {
    background: var(--color-surface-soft);
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    padding: 12px 0;
  }

  [data-measure-group] { padding: 0 0 12px; }

  [data-measure-group] .section-label { padding: 8px 16px 4px; margin-bottom: 0; }

  [data-measure-btn] {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 16px;
    background: none;
    border: none;
    border-left: 3px solid transparent;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: background 0.1s, border-color 0.1s;
    text-align: left;
  }

  [data-measure-btn]:hover:not([data-unavailable]) { background: rgba(35,100,153,0.05); }
  [data-measure-btn][data-active] { background: var(--color-primary-soft); border-left-color: var(--color-primary); }
  [data-measure-btn][data-unavailable] { cursor: default; opacity: 0.45; }

  [data-measure-abbr] {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-primary);
    flex-shrink: 0;
    min-width: 44px;
  }
  [data-measure-btn][data-unavailable] [data-measure-abbr] { color: var(--color-subtle); }

  [data-measure-name] {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-ink);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-done-badge] { font-size: 11px; font-weight: 700; color: #2d6a4f; flex-shrink: 0; }

  [data-soon-badge] {
    font-size: 10px;
    font-weight: 500;
    color: var(--color-subtle);
    background: var(--color-border);
    border-radius: 4px;
    padding: 2px 5px;
    flex-shrink: 0;
  }

  [data-measure-form] { padding: 24px; overflow-y: auto; min-width: 0; }

  [data-measure-footer] {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface-soft);
  }

  [data-measure-footer] button {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-surface);
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 28px;
    cursor: pointer;
    transition: background 0.15s;
  }
  [data-measure-footer] button:hover { background: var(--color-primary-dark); }

  [data-measure-footer] button[data-secondary] {
    background: var(--color-surface);
    color: var(--color-muted);
    border: 1px solid var(--color-border);
  }
  [data-measure-footer] button[data-secondary]:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-surface); }

  /* ── INLINE MEASURE PANEL ── */
  [data-measure-panel] {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    margin-bottom: 20px;
  }

  /* ── VIEW TOGGLE ── */
  [data-view-toggle] { display: flex; gap: 6px; margin-top: 16px; }

  [data-view-toggle] button {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    padding: 7px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-muted);
    cursor: pointer;
    transition: all 0.15s;
  }
  [data-view-toggle] button:hover { border-color: var(--color-primary); color: var(--color-primary); }
  [data-view-toggle] button[data-active] { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-surface); }

  /* ── MEASURE CATEGORY TABS ── */
  [data-measure-tabs] {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-soft);
    padding: 0 16px;
  }

  [data-measure-tabs] button {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 10px 14px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;
  }

  [data-measure-tabs] button:hover { color: var(--color-ink); }
  [data-measure-tabs] button[data-active] { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
`
