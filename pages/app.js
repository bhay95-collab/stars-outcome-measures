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
  const [showMeasureEntry, setShowMeasureEntry] = useState(false)

  const handleAssessmentSaved = useCallback((assessment) => {
    setAssessments(prev => [assessment, ...prev])
    setShowMeasureEntry(false)
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
        <style jsx>{pageStyles}</style>
        <div className="loading-page"><p className="loading-text">Loading…</p></div>
      </>
    )
  }

  if (!trialValid) {
    return (
      <>
        <style jsx>{pageStyles}</style>
        <div className="page">
          <header className="header">
            <div className="header-inner">
              <div className="wordmark">RehabMetrics <span className="wordmark-iq">IQ</span></div>
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
      <style jsx>{pageStyles}</style>
      {showNewPatient && (
        <NewPatientModal
          userId={user.id}
          onCreated={handlePatientCreated}
          onClose={() => setShowNewPatient(false)}
        />
      )}
      {showMeasureEntry && selectedPatient && (
        <MeasureEntry
          patient={selectedPatient}
          onSaved={handleAssessmentSaved}
          onClose={() => setShowMeasureEntry(false)}
        />
      )}
      <div className="page">
        <header className="header">
          <div className="header-inner">
            <div className="wordmark">RehabMetrics <span className="wordmark-iq">IQ</span></div>
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
                  onRecord={() => setShowMeasureEntry(true)}
                />
                <SummaryTab
                  patient={selectedPatient}
                  assessments={assessments}
                />
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-block">
                  <p className="empty-state-title">Select a patient</p>
                  <p className="empty-state-sub">Choose a patient from the left panel to view their clinical summary.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

const pageStyles = `
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
    --color-surface-soft: #F7FAFC;
    --color-border:       #D8E2EC;
    --shadow-sm:          0 1px 2px rgba(31,41,51,0.06);
    --shadow-md:          0 6px 16px rgba(31,41,51,0.08);
    --radius-sm:          6px;
    --radius-md:          10px;
    --radius-lg:          16px;
  }

  body { font-family: 'Inter', sans-serif; }

  .loading-page { min-height: 100vh; background: var(--color-surface-soft); }
  .loading-text { font-size: 14px; color: var(--color-subtle); text-align: center; padding-top: 40vh; }

  .page { min-height: 100vh; display: flex; flex-direction: column; background: var(--color-surface-soft); }

  .header { background: var(--color-surface); border-bottom: 1px solid var(--color-border); padding: 0 24px; flex-shrink: 0; }
  .header-inner { height: 56px; display: flex; align-items: center; justify-content: space-between; }

  .wordmark { font-family: 'Source Serif 4', serif; font-size: 18px; font-weight: 600; color: var(--color-primary); }
  .wordmark-iq { font-style: italic; font-weight: 300; }

  .signout-btn { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: var(--color-muted); background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 6px 14px; cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .signout-btn:hover { color: var(--color-ink); border-color: var(--color-muted); }

  .dashboard { display: flex; flex: 1; height: calc(100vh - 56px); overflow: hidden; }

  .sidebar { width: 272px; flex-shrink: 0; background: var(--color-surface-soft); border-right: 1px solid var(--color-border); overflow-y: auto; }

  .main { flex: 1; overflow-y: auto; padding: 32px 40px; }

  .empty-state { display: flex; align-items: center; justify-content: center; height: 100%; }
  .empty-block { text-align: center; max-width: 320px; }
  .empty-state-title { font-family: 'Source Serif 4', serif; font-size: 22px; font-weight: 600; color: var(--color-ink); margin-bottom: 8px; }
  .empty-state-sub { font-size: 14px; color: var(--color-muted); line-height: 1.6; }

  .main-center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 60px 32px; }

  .expired-card { max-width: 480px; }
  .tier-label { font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-subtle); margin-bottom: 12px; }
  .heading { font-family: 'Source Serif 4', serif; font-size: 32px; font-weight: 600; color: var(--color-ink); line-height: 1.2; margin-bottom: 12px; }
  .subtext { font-size: 15px; color: var(--color-muted); line-height: 1.6; }
  .upgrade-btn { margin-top: 24px; padding: 10px 24px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: var(--color-subtle); background: var(--color-surface-soft); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: not-allowed; }
`
