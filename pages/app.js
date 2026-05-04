import Head from 'next/head'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import PatientList from '../components/PatientList'
import NewPatientModal from '../components/NewPatientModal'
import ProfileModal from '../components/ProfileModal'
import PatientHeader from '../components/PatientHeader'
import SummaryTab from '../components/SummaryTab'
import MeasureEntry from '../components/MeasureEntry'
import SubscriptionWall from '../components/SubscriptionWall'

export async function getServerSideProps() { return { props: {} } }

export default function App() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trialValid, setTrialValid] = useState(null)
  const [hasAccess, setHasAccess] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', avatarUrl: null })
  const [view, setView] = useState('summary')
  const [notification, setNotification] = useState(null)

  const handleAssessmentSaved = useCallback((assessment) => {
    if (assessment) setAssessments(prev => [assessment, ...prev])
    setView('summary')
  }, [])

  const handleDeleteAssessment = useCallback(async (assessmentId) => {
    if (!window.confirm('Delete this assessment? This cannot be undone.')) return
    const { error } = await supabase.from('assessments').delete().eq('id', assessmentId)
    if (!error) setAssessments(prev => prev.filter(a => a.id !== assessmentId))
  }, [])

  const handleDeletePatient = useCallback(async (patientId) => {
    if (!window.confirm('Delete this patient and all their assessments? This cannot be undone.')) return
    await supabase.from('assessments').delete().eq('patient_id', patientId)
    const { error } = await supabase.from('patients').delete().eq('id', patientId)
    if (!error) {
      setPatients(prev => prev.filter(p => p.id !== patientId))
      setSelectedPatient(null)
      setAssessments([])
    }
  }, [])

  useEffect(() => {
    let loaded = false

    async function loadUserData(sessionUser) {
      if (loaded) return
      loaded = true
      setUser(sessionUser)

      const [
        { data: profile, error: profileError },
        { data: subData }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('trial_end_date, first_name, last_name, avatar_url')
          .eq('id', sessionUser.id)
          .maybeSingle(),
        supabase
          .from('subscriptions')
          .select('stripe_customer_id, stripe_subscription_id, status, current_period_end')
          .eq('user_id', sessionUser.id)
          .maybeSingle(),
      ])

      if (profileError) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      const isTrialActive = profile ? new Date(profile.trial_end_date) > new Date() : false
      const isSubscriptionActive =
        subData?.status === 'active' &&
        subData?.current_period_end &&
        new Date(subData.current_period_end) > new Date()

      setTrialValid(isTrialActive)
      setSubscription(subData ?? null)
      setHasAccess(isTrialActive || isSubscriptionActive)

      if (profile) {
        setProfileData({
          firstName: profile.first_name ?? '',
          lastName: profile.last_name ?? '',
          avatarUrl: profile.avatar_url ?? null,
        })
      }

      if (isTrialActive || isSubscriptionActive) {
        const { data: pats } = await supabase
          .from('patients')
          .select('*')
          .order('initials', { ascending: true })
        setPatients(pats ?? [])
      }

      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) loadUserData(data.session.user)
    }).catch(() => router.replace('/login'))

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserData(session.user)
      } else if (event === 'INITIAL_SESSION' && !session) {
        // Don't redirect during an OAuth callback — wait for SIGNED_IN instead
        const isOAuthCallback =
          typeof window !== 'undefined' &&
          (window.location.search.includes('code=') || window.location.hash.includes('access_token='))
        if (!isOAuthCallback) router.replace('/login')
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login')
      }
    })

    return () => authSub.unsubscribe()
  }, [router])

  // Handle Stripe redirect query params
  useEffect(() => {
    if (!router.isReady) return
    const { payment } = router.query
    if (!payment) return

    if (payment === 'success') {
      setNotification('success')
      // Refresh subscription state so the dashboard unlocks immediately
      supabase
        .from('subscriptions')
        .select('stripe_customer_id, stripe_subscription_id, status, current_period_end')
        .eq('user_id', user?.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setSubscription(data)
            const active =
              data.status === 'active' &&
              data.current_period_end &&
              new Date(data.current_period_end) > new Date()
            if (active) setHasAccess(true)
          }
        })
    } else if (payment === 'cancelled') {
      setNotification('cancelled')
    }

    router.replace('/app', undefined, { shallow: true })
  }, [router.isReady, router.query.payment])

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
        <AppHead />
        <style jsx global>{globalStyles}</style>
        <div className="loading-page"><p className="loading-text">Loading…</p></div>
      </>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <AppHead />
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
                  <button data-profile-btn="" onClick={() => setShowProfile(true)}>
                    {profileData.avatarUrl
                      ? <img data-profile-avatar="" src={profileData.avatarUrl} alt="Profile photo" />
                      : <span data-profile-initials="">
                          {(profileData.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
                        </span>}
                    <span data-header-subtitle="">
                      {profileData.firstName
                        ? `${profileData.firstName} ${profileData.lastName}`.trim()
                        : user.email}
                    </span>
                  </button>
                </>
              )}
            </div>
          </header>
          <SubscriptionWall
            user={user}
            subscription={subscription}
            onSignOut={handleSignOut}
          />
        </div>
        {showProfile && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfile(false)}
            onProfileUpdated={(data) => { setProfileData(data); setShowProfile(false) }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <AppHead />
      <style jsx global>{globalStyles}</style>
      {showNewPatient && (
        <NewPatientModal
          userId={user.id}
          onCreated={handlePatientCreated}
          onClose={() => setShowNewPatient(false)}
        />
      )}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onProfileUpdated={(data) => { setProfileData(data); setShowProfile(false) }}
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
                <button data-profile-btn="" onClick={() => setShowProfile(true)}>
                  {profileData.avatarUrl
                    ? <img data-profile-avatar="" src={profileData.avatarUrl} alt="Profile photo" />
                    : <span data-profile-initials="">
                        {(profileData.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </span>}
                  <span data-header-subtitle="">
                    {profileData.firstName
                      ? `${profileData.firstName} ${profileData.lastName}`.trim()
                      : user.email}
                  </span>
                </button>
              </>
            )}
            {trialValid && !subscription && <span className="trial-badge">Trial</span>}
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
            {notification && (
              <div data-notification={notification}>
                {notification === 'success'
                  ? 'Subscription active — welcome to RehabMetrics IQ!'
                  : 'Payment cancelled. Your plan has not changed.'}
              </div>
            )}
            {selectedPatient ? (
              <>
                <PatientHeader
                  patient={selectedPatient}
                  assessments={assessments}
                  onViewChange={setView}
                  activeView={view}
                  onDeletePatient={handleDeletePatient}
                />
                {view === 'summary' ? (
                  <SummaryTab
                    patient={selectedPatient}
                    assessments={assessments}
                    onDeleteAssessment={handleDeleteAssessment}
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

function AppHead() {
  return (
    <Head>
      <title>RehabMetrics IQ</title>
      <link rel="icon" href="/SquareLogo.png" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </Head>
  )
}

const globalStyles = `
  /* ── RESET & TOKENS ── */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --color-primary:      #236499;
    --color-primary-dark: #17496F;
    --color-primary-soft: #EAF3FB;
    --color-secondary:    #1F8A8A;
    --color-secondary-soft: #E1F5F3;
    --color-ink:          #17212B;
    --color-muted:        #526273;
    --color-subtle:       #7B8794;
    --color-surface:      #FFFFFF;
    --color-surface-soft: #F4F7FB;
    --color-panel:        #EEF4FB;
    --color-border:       #D2DCE8;
    --shadow-sm:          0 1px 2px rgba(18,35,54,0.05);
    --shadow-md:          0 14px 32px rgba(18,35,54,0.10);
    --radius-sm:          6px;
    --radius-md:          8px;
    --radius-lg:          8px;
  }

  body { font-family: 'Inter', sans-serif; color: var(--color-ink); font-variant-numeric: tabular-nums; }

  /* ── PAGE SHELL ── */
  .loading-page { min-height: 100vh; background: var(--color-surface-soft); display: flex; align-items: center; justify-content: center; }
  .loading-text { font-size: 14px; color: var(--color-subtle); }
  .page { min-height: 100vh; background: var(--color-surface-soft); }

  .header { background: rgba(255,255,255,0.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 10; }
  .header-inner { height: 64px; max-width: 1360px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; gap: 14px; }

  .wordmark { font-size: 18px; font-weight: 800; color: var(--color-primary); letter-spacing: 0; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .wordmark > img { height: 28px; width: 28px; object-fit: contain; flex-shrink: 0; }
  .wordmark > span:first-of-type { font-weight: 800; color: var(--color-primary); }
  .wordmark-iq { font-style: normal; font-weight: 800; color: var(--color-secondary); }

  [data-header-divider] { width: 1px; height: 28px; background: var(--color-border); flex-shrink: 0; }
  [data-header-subtitle] { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--color-subtle); font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }

  [data-profile-btn] { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; padding: 0; min-width: 0; flex: 1; text-align: left; }
  [data-profile-btn]:hover [data-header-subtitle] { color: var(--color-primary); }
  [data-profile-avatar] { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--color-border); flex-shrink: 0; }
  [data-profile-initials] { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-soft); border: 1px solid var(--color-border); color: var(--color-primary-dark); font-size: 12px; font-weight: 700; font-family: 'Inter', sans-serif; text-transform: uppercase; flex-shrink: 0; }
  [data-avatar-upload] { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  [data-avatar-upload] [data-profile-avatar], [data-avatar-upload] [data-profile-initials] { width: 64px; height: 64px; font-size: 22px; }
  [data-avatar-upload] input[type="file"] { display: none; }
  [data-avatar-upload] label { font-size: 13px; font-weight: 500; color: var(--color-primary); cursor: pointer; text-decoration: underline; }

  .trial-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #92400e; background: #fef3c7; border: 1px solid #fde68a; border-radius: var(--radius-sm); padding: 3px 9px; flex-shrink: 0; margin-left: auto; }
  .signout-btn { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: var(--color-muted); background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 6px 14px; cursor: pointer; transition: color 0.15s, border-color 0.15s, background 0.15s; flex-shrink: 0; }
  .signout-btn:hover { color: var(--color-ink); border-color: var(--color-muted); background: rgba(255,255,255,0.8); }

  .dashboard { max-width: 1360px; margin: 0 auto; padding: 20px 24px 56px; display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
  .sidebar { }
  .main { min-width: 0; }

  /* ── SUBSCRIPTION WALL ── */
  .main-center { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 60px 32px; }
  .expired-card { max-width: 560px; width: 100%; }
  .tier-label { font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-subtle); margin-bottom: 12px; }
  .heading { font-size: 30px; font-weight: 800; color: var(--color-ink); line-height: 1.15; margin-bottom: 12px; }
  .subtext { font-size: 15px; color: var(--color-muted); line-height: 1.6; }

  [data-plans] { display: flex; gap: 16px; margin-top: 28px; flex-wrap: wrap; }
  [data-plan-card] { flex: 1; min-width: 180px; margin: 0; }
  [data-plan-price] { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 700; color: var(--color-ink); margin: 8px 0 4px; }
  [data-subscribe-btn] {
    display: block; width: 100%; margin-top: 16px; padding: 10px 20px;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
    color: var(--color-surface); background: var(--color-primary);
    border: none; border-radius: var(--radius-md);
    cursor: pointer; transition: background 0.15s, opacity 0.15s;
  }
  [data-subscribe-btn]:hover { background: var(--color-primary-dark); }
  [data-subscribe-btn]:disabled { opacity: 0.55; cursor: wait; }

  [data-wall-links] { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
  [data-wall-link] { background: none; border: none; padding: 0; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px; }
  [data-wall-link="manage"] { color: var(--color-primary); text-decoration: underline; }
  [data-wall-link="manage"]:disabled { opacity: 0.55; cursor: wait; }
  [data-wall-link="signout"] { color: var(--color-muted); }
  [data-wall-link="delete"] { color: #b5451b; }

  /* Danger submit button in delete modal */
  .modal-content form button[type="submit"][data-danger] { background: #b5451b; }
  .modal-content form button[type="submit"][data-danger]:hover { background: #9a3a16; }

  /* Payment notification banner */
  [data-notification] { padding: 12px 16px; font-size: 13px; font-weight: 500; border-radius: var(--radius-sm); margin-bottom: 20px; }
  [data-notification="success"] { background: #e8f4ef; color: #2d6a4f; border: 1px solid #b7dfc9; }
  [data-notification="cancelled"] { background: var(--color-surface-soft); color: var(--color-muted); border: 1px solid var(--color-border); }

  /* ── PATIENT CARD ── */
  .patient-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 16px;
    margin-bottom: 16px;
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
    margin: 10px -16px 0;
    padding: 4px 0 0;
    border-top: 1px solid var(--color-border);
  }

  .patient-card li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
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

  .patient-card li .patient-name-block {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 1px;
  }

  .patient-card li .patient-name-block > span {
    font-size: 11px;
    color: var(--color-subtle);
    font-weight: 400;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .patient-card li strong {
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
    width: calc(100% + 32px);
    margin-left: -16px;
    padding: 12px 16px;
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
    padding: 16px;
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
  .measure-title { font-size: 22px; font-weight: 800; color: var(--color-ink); letter-spacing: 0; }
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
  .modal-content form button[type="submit"][data-danger] { background: #b5451b; }
  .modal-content form button[type="submit"][data-danger]:hover { background: #9a3a16; opacity: 1; }

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
    display: flex;
    min-height: 480px;
    border-top: 1px solid var(--color-border);
  }

  [data-measure-nav] {
    width: 260px;
    flex-shrink: 0;
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
    padding: 9px 14px;
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

  [data-measure-label] {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  [data-measure-abbr] {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-primary);
  }
  [data-measure-btn][data-unavailable] [data-measure-abbr] { color: var(--color-subtle); }

  [data-measure-name] {
    font-size: 11px;
    font-weight: 400;
    color: var(--color-muted);
    white-space: normal;
    line-height: 1.3;
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

  [data-measure-form] { flex: 1; padding: 24px; overflow-y: auto; min-width: 0; }

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

  /* ── DELETE BUTTONS ── */
  [data-delete-btn] {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #b5451b;
    background: none;
    border: 1px solid #f0b8a2;
    border-radius: var(--radius-sm);
    padding: 4px 10px;
    cursor: pointer;
    transition: background 0.15s;
  }
  [data-delete-btn]:hover { background: #fdf0ec; }

  /* Patient delete pushed to far right in toggle row */
  [data-view-toggle] [data-patient-delete] { margin-left: auto; }

  /* Assessment card: date + delete button inline */
  [data-assessment-meta] { display: flex; align-items: center; gap: 10px; }

  /* ── MEASURE CATEGORY TABS ── */
  [data-measure-tabs] {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    padding: 0 16px;
  }

  [data-measure-tabs] button {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-ink);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 12px 18px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;
  }

  [data-measure-tabs] button:hover { color: var(--color-primary); }
  [data-measure-tabs] button[data-active] { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 700; }

  /* ── Sidebar collapse ── */
  [data-measure-nav] {
    transition: width 0.2s ease, min-width 0.2s ease;
  }
  [data-measure-nav][data-collapsed] {
    width: 52px;
    min-width: 52px;
    overflow: hidden;
  }
  [data-measure-nav][data-collapsed] [data-measure-btn] {
    justify-content: center;
    padding: 8px 6px;
  }
  [data-nav-toggle] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 8px;
    border: none;
    border-bottom: 1px solid var(--color-border);
    background: transparent;
    cursor: pointer;
    font-size: 16px;
    color: var(--color-subtle);
    transition: background 0.15s;
  }
  [data-nav-toggle]:hover {
    background: rgba(0,0,0,0.04);
    color: var(--color-ink);
  }

  /* ── Dermatome map modal ── */
  [data-map-btn] {
    padding: 7px 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
  }
  [data-map-btn]:hover {
    background: var(--color-surface-soft);
  }
  [data-map-overlay] {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  [data-map-modal] {
    background: var(--color-surface);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  [data-map-modal-header] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
    font-size: 14px;
  }
  [data-map-modal-header] button {
    border: none;
    background: transparent;
    font-size: 18px;
    cursor: pointer;
    color: var(--color-subtle);
    line-height: 1;
  }
  [data-map-modal-body] {
    overflow: auto;
    padding: 20px;
    display: flex;
    justify-content: center;
  }
  [data-map-legend] {
    display: flex;
    gap: 20px;
    padding: 12px 20px;
    border-top: 1px solid var(--color-border);
    font-size: 12px;
  }
  [data-legend-green]  { color: #2d6a4f; }
  [data-legend-yellow] { color: #a05c00; }
  [data-legend-red]    { color: #b5451b; }
`
