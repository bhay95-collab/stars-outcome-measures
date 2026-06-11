import Head from 'next/head'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Accessibility, Bell, ChevronDown, ClipboardList, Copy, FileText, LayoutDashboard, Link2, MessageSquare, RefreshCw, Route, Search, Users, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PatientList from '../components/PatientList'
import NewPatientModal from '../components/NewPatientModal'
import EditPatientModal from '../components/EditPatientModal'
import ProfileModal from '../components/ProfileModal'
import PatientHeader from '../components/PatientHeader'
import SummaryTab from '../components/SummaryTab'
import MeasureEntry from '../components/MeasureEntry'
import SubscriptionWall from '../components/SubscriptionWall'
import LogoWordmark from '../components/LogoWordmark'
import WheelchairPrescriptionTool from '../components/WheelchairPrescriptionTool'
import AuthGateway from '../components/AuthGateway'
import { MEASURES } from '../lib/clinical'
import { buildPatientPathway } from '../lib/clinical/pathways'
import { exportPatientSummaryPdf } from '../lib/clinical/patientReportPdf'
import { buildPatientSummary, fmtDate } from '../lib/clinical/patientSummary'
import {
  FOLLOWUP_ATTENTION,
  FOLLOWUP_STATUS,
  dateInputValueInDays,
  followUpAttentionLabel,
  followUpRecordOneLine,
  followUpStatusLabel,
  formatFollowUpDate,
  getFollowUpRecordAttention,
  getFollowUpRecordCompletedAt,
  isoFromDateInput,
  summarizeFollowUpRecords,
} from '../lib/followups'
import {
  FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS,
  getEligibleFollowUpQuestionnaireOptions,
  getFollowUpQuestionnaire,
} from '../lib/followupQuestionnaires'
import { sortPatientsByLabel } from '../lib/patientDetails'

export async function getServerSideProps() { return { props: {} } }

const APP_SECTIONS = ['directory', 'overview', 'pathway', 'followup', 'measures', 'reports', 'wheelchair']
const PATIENT_SECTIONS = new Set(['overview', 'pathway', 'followup', 'measures', 'reports', 'wheelchair'])
const DEFAULT_PATIENT_SECTION = 'overview'

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeSection(value) {
  const section = getQueryValue(value)
  return APP_SECTIONS.includes(section) ? section : DEFAULT_PATIENT_SECTION
}

function normalizeMeasureId(value) {
  const measureId = getQueryValue(value)
  return measureId && MEASURES[measureId] ? measureId : null
}

function buildAppRoute({ section, patientId, measureId }) {
  const query = { section }
  if (patientId && PATIENT_SECTIONS.has(section)) query.patient = patientId
  if (measureId && section === 'measures') query.measure = measureId
  return { pathname: '/app', query }
}

function getSectionTitle(section) {
  switch (section) {
    case 'directory': return 'Patient Directory'
    case 'pathway': return 'Smart Pathway'
    case 'followup': return 'Follow-Up'
    case 'measures': return 'Outcome Measures'
    case 'reports': return 'Reports & Notes'
    case 'wheelchair': return 'Wheelchair Prescription'
    default: return 'Patient Overview'
  }
}

function patientLabel(patient) {
  return patient?.initials || patient?.name || 'Unnamed patient'
}

function formatAssessmentDate(iso) {
  return iso ? fmtDate(iso) : 'No assessments'
}

function pathwayActionLabel(action) {
  if (!action) return 'Review pathway'
  if (action.type === 'diagnosis') return 'Add diagnosis'
  if (action.measureId) return action.label
  if (action.type === 'current') return 'Open reports'
  return action.label || 'Review pathway'
}

function getFollowUpOverviewAction(summary) {
  if (!summary) return null
  const latest = summary.latestResponse
  if (getFollowUpRecordAttention(latest) === FOLLOWUP_ATTENTION.RED) {
    return {
      label: 'Review patient-reported concern',
      detail: 'A recent patient-completed questionnaire includes a red attention signal. Review the submitted assessment before the next encounter.',
      button: 'Open reports',
      action: 'reports',
    }
  }
  if (getFollowUpRecordAttention(latest) === FOLLOWUP_ATTENTION.AMBER) {
    return {
      label: 'Check follow-up signal',
      detail: 'A recent patient-completed questionnaire includes a watch signal. Review the response before the next encounter.',
      button: 'Open follow-up',
      action: 'followup',
    }
  }
  if (summary.overdueCount > 0) {
    return {
      label: 'Follow-up overdue',
      detail: `${summary.overdueCount} patient check-in${summary.overdueCount === 1 ? ' is' : 's are'} past the due date.`,
      button: 'Open follow-up',
      action: 'followup',
    }
  }
  return null
}

function latestFollowUpLine(record) {
  return followUpRecordOneLine(record)
}

function followUpMeasureLabel(record) {
  if (!record?.measure_id) return 'General check-in'
  return getFollowUpQuestionnaire(record.measure_id)?.name ?? record.measure_id
}

function completedFollowUpDate(record) {
  return formatFollowUpDate(getFollowUpRecordCompletedAt(record))
}

export default function App() {
  const router = useRouter()
  const routerRef = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])
  const [user, setUser] = useState(null)
  const [bootState, setBootState] = useState('checking-auth')
  const [hasAccess, setHasAccess] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [followups, setFollowups] = useState([])
  const [followupsLoading, setFollowupsLoading] = useState(false)
  const [followUpAttentionBoard, setFollowUpAttentionBoard] = useState([])
  const [latestFollowUpUrl, setLatestFollowUpUrl] = useState('')
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', avatarUrl: null, clinicalFocus: 'both' })
  const [activeSection, setActiveSection] = useState('directory')
  const [requestedMeasureId, setRequestedMeasureId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [assessmentDirty, setAssessmentDirty] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null })

  function handleAssessmentSaved(assessment) {
    if (Array.isArray(assessment)) {
      setAssessments(prev => [...assessment, ...prev])
    } else if (assessment) {
      setAssessments(prev => [assessment, ...prev])
    }
    setAssessmentDirty(false)
    goToSection('overview', { replace: true })
  }

  const handleWheelchairPrescriptionSaved = useCallback((assessment) => {
    if (!assessment) return
    setAssessments(prev => [assessment, ...prev.filter(item => item.id !== assessment.id)])
  }, [])

  const handleDeleteAssessment = useCallback((assessmentId) => {
    if (!user?.id) return
    setConfirmDialog({
      open: true,
      message: 'Delete this assessment? This cannot be undone.',
      onConfirm: async () => {
        const { error } = await supabase
          .from('assessments')
          .delete()
          .eq('id', assessmentId)
          .eq('user_id', user.id)
        if (!error) setAssessments(prev => prev.filter(a => a.id !== assessmentId))
      },
    })
  }, [user])

  const handleDeletePatient = useCallback((patientId) => {
    if (!user?.id) return
    setConfirmDialog({
      open: true,
      message: 'Delete this patient and all their assessments? This cannot be undone.',
      onConfirm: async () => {
        const { error: cascadeError } = await supabase
          .from('assessments')
          .delete()
          .eq('patient_id', patientId)
          .eq('user_id', user.id)
        if (cascadeError) {
          alert('Could not delete assessments. Please try again.')
          return
        }
        const { error } = await supabase
          .from('patients')
          .delete()
          .eq('id', patientId)
          .eq('user_id', user.id)
        if (!error) {
          setPatients(prev => prev.filter(p => p.id !== patientId))
          setSelectedPatient(null)
          setAssessments([])
          setFollowups([])
          setLatestFollowUpUrl('')
        }
      },
    })
  }, [user])

  const handleExportFullReport = useCallback(async () => {
    if (!selectedPatient || reportLoading) return
    setReportLoading(true)
    try {
      await exportPatientSummaryPdf({ patient: selectedPatient, assessments, followups })
    } catch (error) {
      alert(`Report export failed: ${error.message}`)
    } finally {
      setReportLoading(false)
    }
  }, [selectedPatient, assessments, followups, reportLoading])

  useEffect(() => {
    let loaded = false
    let active = true

    function redirectToLogin() {
      if (!active) return
      setBootState('unauthenticated')
      routerRef.current.replace('/login')
    }

    async function loadUserData(sessionUser) {
      if (loaded || !active) return
      loaded = true
      setBootState('loading-workspace')
      setUser(sessionUser)

      const [
        { data: profile, error: profileError },
        { data: subData, error: subscriptionError },
        { data: appStoreData, error: appStoreError },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('trial_end_date, first_name, last_name, avatar_url, clinical_focus')
          .eq('id', sessionUser.id)
          .maybeSingle(),
        supabase
          .from('subscriptions')
          .select('stripe_customer_id, stripe_subscription_id, status, current_period_end')
          .eq('user_id', sessionUser.id)
          .maybeSingle(),
        supabase
          .from('app_store_subscriptions')
          .select('is_active, expiration_at')
          .eq('user_id', sessionUser.id)
          .maybeSingle(),
      ])

      if (!active) return

      if (profileError || subscriptionError || appStoreError) {
        setHasAccess(false)
        setBootState('ready')
        return
      }

      const isTrialActive = profile ? new Date(profile.trial_end_date) > new Date() : false
      const isSubscriptionActive =
        subData?.status === 'active' &&
        subData?.current_period_end &&
        new Date(subData.current_period_end) > new Date()
      const isAppStoreActive =
        appStoreData?.is_active === true &&
        appStoreData?.expiration_at &&
        new Date(appStoreData.expiration_at) > new Date()

      setSubscription(subData ?? null)
      setHasAccess(isTrialActive || isSubscriptionActive || isAppStoreActive)

      if (profile) {
        setProfileData({
          firstName: profile.first_name ?? '',
          lastName: profile.last_name ?? '',
          avatarUrl: profile.avatar_url ?? null,
          clinicalFocus: profile.clinical_focus ?? 'both',
        })
      }

      if (isTrialActive || isSubscriptionActive || isAppStoreActive) {
        const { data: pats } = await supabase
          .from('patients')
          .select('*')
          .order('initials', { ascending: true })
        setPatients(pats ?? [])
      }

      if (!active) return
      setBootState('ready')
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        loadUserData(data.session.user)
        return
      }

      redirectToLogin()
    }).catch(redirectToLogin)

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        loadUserData(session.user)
      } else if (event === 'INITIAL_SESSION' && !session) {
        redirectToLogin()
      } else if (event === 'SIGNED_OUT') {
        redirectToLogin()
      }
    })

    return () => {
      active = false
      authSub.unsubscribe()
    }
  }, [])

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

  const loadFollowUpAttentionBoard = useCallback(async () => {
    if (typeof fetch !== 'function') return
    try {
      const response = await fetch('/api/followups')
      if (!response.ok) throw new Error('Could not load follow-up attention')
      const data = await response.json()
      setFollowUpAttentionBoard(data.attention ?? [])
    } catch {
      setFollowUpAttentionBoard([])
    }
  }, [])

  const loadPatientFollowUps = useCallback(async (patientId) => {
    if (!patientId || typeof fetch !== 'function') {
      setFollowups([])
      return []
    }
    setFollowupsLoading(true)
    try {
      const response = await fetch(`/api/followups?patientId=${encodeURIComponent(patientId)}`)
      if (!response.ok) throw new Error('Could not load follow-ups')
      const data = await response.json()
      const nextFollowups = data.followups ?? []
      setFollowups(nextFollowups)
      loadFollowUpAttentionBoard()
      return nextFollowups
    } catch {
      setFollowups([])
      return []
    } finally {
      setFollowupsLoading(false)
    }
  }, [loadFollowUpAttentionBoard])

  useEffect(() => {
    if (bootState !== 'ready' || !hasAccess) return
    loadFollowUpAttentionBoard()
  }, [bootState, hasAccess, loadFollowUpAttentionBoard])

  const handlePatientSelect = useCallback(async (patient) => {
    if (!patient) return
    setSelectedPatient(patient)
    setLatestFollowUpUrl('')
    const [{ data }] = await Promise.all([
      supabase
        .from('assessments')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false }),
      loadPatientFollowUps(patient.id),
    ])
    setAssessments(data ?? [])
  }, [loadPatientFollowUps])

  useEffect(() => {
    if (bootState !== 'ready' || !hasAccess || !router.isReady) return

    const routeSection = normalizeSection(router.query.section)
    const routePatientId = getQueryValue(router.query.patient)
    const routeMeasureId = normalizeMeasureId(router.query.measure)

    if (!patients.length) {
      setSelectedPatient(null)
      setAssessments([])
      setFollowups([])
      setLatestFollowUpUrl('')
      setActiveSection('directory')
      setRequestedMeasureId(null)
      if (routeSection !== 'directory') {
        router.replace(buildAppRoute({ section: 'directory' }), undefined, { shallow: true })
      }
      return
    }

    if (routeSection === 'directory') {
      setActiveSection('directory')
      setRequestedMeasureId(null)
      return
    }

    const routePatient = routePatientId
      ? patients.find(patient => String(patient.id) === String(routePatientId))
      : null
    const nextPatient = routePatient ?? selectedPatient ?? patients[0]

    if (nextPatient && selectedPatient?.id !== nextPatient.id) {
      handlePatientSelect(nextPatient)
    }

    setActiveSection(routeSection)
    setRequestedMeasureId(routeSection === 'measures' ? routeMeasureId : null)

    if (!routePatientId || (routePatientId && !routePatient)) {
      router.replace(
        buildAppRoute({
          section: routeSection,
          patientId: nextPatient?.id,
          measureId: routeSection === 'measures' ? routeMeasureId : null,
        }),
        undefined,
        { shallow: true },
      )
    }
  }, [
    bootState,
    hasAccess,
    router.isReady,
    router.query.section,
    router.query.patient,
    router.query.measure,
    patients,
    selectedPatient,
    selectedPatient?.id,
    handlePatientSelect,
    router,
  ])

  useEffect(() => {
    if (!assessmentDirty) return
    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [assessmentDirty])

  function updateAppRoute(section, patient, measureId, replace = false) {
    if (!router.isReady) return
    const method = replace ? router.replace : router.push
    method.call(
      router,
      buildAppRoute({
        section,
        patientId: patient?.id,
        measureId: section === 'measures' ? normalizeMeasureId(measureId) : null,
      }),
      undefined,
      { shallow: true },
    )
  }

  async function performSectionChange(section, options = {}) {
    const nextSection = normalizeSection(section)
    const explicitPatient = options.patient
    const explicitPatientId = options.patientId
    const nextPatient = explicitPatient
      ?? (explicitPatientId ? patients.find(patient => String(patient.id) === String(explicitPatientId)) : null)
      ?? selectedPatient
    const nextMeasureId = nextSection === 'measures' ? normalizeMeasureId(options.measureId) : null

    if (PATIENT_SECTIONS.has(nextSection) && !nextPatient) {
      setActiveSection('directory')
      setRequestedMeasureId(null)
      updateAppRoute('directory', null, null, options.replace)
      return
    }

    if (nextPatient && selectedPatient?.id !== nextPatient.id) {
      await handlePatientSelect(nextPatient)
    }

    setActiveSection(nextSection)
    setRequestedMeasureId(nextMeasureId)
    updateAppRoute(nextSection, nextPatient, nextMeasureId, options.replace)
  }

  function goToSection(section, options = {}) {
    const nextSection = normalizeSection(section)
    if (assessmentDirty && activeSection === 'measures') {
      setConfirmDialog({
        open: true,
        message: 'You have unsaved assessments in this encounter. Leave without saving?',
        onConfirm: () => {
          setAssessmentDirty(false)
          performSectionChange(nextSection, options)
        },
      })
      return
    }

    performSectionChange(nextSection, options)
  }

  function handlePatientCreated(patient) {
    setPatients(prev => [...prev, patient].sort(sortPatientsByLabel))
    setShowNewPatient(false)
    goToSection('overview', { patient })
  }

  const handlePatientUpdated = useCallback((patient) => {
    if (!patient) return
    setPatients(prev => prev
      .map(item => item.id === patient.id ? patient : item)
      .sort(sortPatientsByLabel)
    )
    setSelectedPatient(prev => prev?.id === patient.id ? patient : prev)
    setEditingPatient(null)
    setNotification('patient-updated')
    setTimeout(() => {
      setNotification(prev => prev === 'patient-updated' ? null : prev)
    }, 3200)
  }, [])

  async function handleCreateFollowUp({ dueDate, expiresDate, measureId, sourceAssessmentId, deliveryMode = 'manual' }) {
    if (!selectedPatient) throw new Error('Select a patient first.')
    const response = await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: selectedPatient.id,
        measureId,
        sourceAssessmentId,
        deliveryMode,
        dueAt: isoFromDateInput(dueDate),
        expiresAt: isoFromDateInput(expiresDate),
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not create follow-up link.')
    setFollowups(prev => [data.followup, ...prev.filter(item => item.id !== data.followup.id)])
    setLatestFollowUpUrl(data.publicUrl || '')
    loadFollowUpAttentionBoard()
    return data
  }

  async function handleSendFollowUp(followupId) {
    const response = await fetch(`/api/followups/${encodeURIComponent(followupId)}/send`, { method: 'POST' })
    const data = await response.json()
    if (!response.ok) {
      if (data.followup) setFollowups(prev => prev.map(item => item.id === data.followup.id ? data.followup : item))
      if (data.publicUrl) setLatestFollowUpUrl(data.publicUrl)
      throw new Error(data.email?.error || data.error || 'Could not send follow-up email.')
    }
    setFollowups(prev => prev.map(item => item.id === data.followup.id ? data.followup : item))
    setLatestFollowUpUrl(data.publicUrl || '')
    return data
  }

  async function handleCancelFollowUp(followupId) {
    const response = await fetch(`/api/followups/${encodeURIComponent(followupId)}`, { method: 'DELETE' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not cancel follow-up.')
    setFollowups(prev => prev.map(item => item.id === data.followup.id ? data.followup : item))
    loadFollowUpAttentionBoard()
    return data.followup
  }

  function handleConfirmClose() {
    setConfirmDialog({ open: false, message: '', onConfirm: null })
  }
  function handleConfirmOk() {
    if (confirmDialog.onConfirm) confirmDialog.onConfirm()
    setConfirmDialog({ open: false, message: '', onConfirm: null })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const viewTitle = getSectionTitle(activeSection)
  const selectedPathway = selectedPatient ? buildPatientPathway(selectedPatient, assessments) : null
  const selectedFollowUpSummary = summarizeFollowUpRecords(followups)

  if (bootState === 'checking-auth' || bootState === 'unauthenticated') {
    return (
      <>
        <AppHead />
        <style jsx global>{globalStyles}</style>
        <AuthGateway
          title={bootState === 'unauthenticated' ? 'Redirecting to sign in' : 'Opening RehabMetrics IQ'}
          message={bootState === 'unauthenticated'
            ? 'This is the secure clinical outcomes dashboard for physiotherapists. Taking you to the login page.'
            : 'Checking your secure session before opening the clinical outcomes dashboard.'}
        />
      </>
    )
  }

  if (bootState === 'loading-workspace') {
    return (
      <>
        <AppHead />
        <style jsx global>{globalStyles}</style>
        <AppShellSkeleton />
      </>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <AppHead />
        <style jsx global>{globalStyles}</style>
        <SubscriptionWall
          user={user}
          subscription={subscription}
          onSignOut={handleSignOut}
        />
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
      {editingPatient && (
        <EditPatientModal
          userId={user.id}
          patient={editingPatient}
          onUpdated={handlePatientUpdated}
          onClose={() => setEditingPatient(null)}
        />
      )}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onProfileUpdated={(data) => { setProfileData(data); setShowProfile(false) }}
        />
      )}
      {confirmDialog.open && (
        <ConfirmModal
          message={confirmDialog.message}
          onConfirm={handleConfirmOk}
          onCancel={handleConfirmClose}
        />
      )}
      <div className="app-shell">
        <AppSidebar
          activeSection={activeSection}
          patients={patients}
          selectedPatient={selectedPatient}
          pathway={selectedPathway}
          followUpSummary={selectedFollowUpSummary}
          profileData={profileData}
          user={user}
          onNavigate={goToSection}
          onPatientSelect={(patient) => goToSection(DEFAULT_PATIENT_SECTION, { patient })}
          onNewPatient={() => setShowNewPatient(true)}
          onProfile={() => setShowProfile(true)}
          onSignOut={handleSignOut}
        />
        <main className="app-main">
          <div className="page-toolbar">
            <h1>{viewTitle}</h1>
          </div>

          {notification && (
            <div data-notification={notification}>
              {notification === 'success'
                ? 'Subscription active — welcome to RehabMetrics IQ!'
                : notification === 'patient-updated'
                  ? 'Patient details updated.'
                  : 'Payment cancelled. Your plan has not changed.'}
            </div>
          )}

          <div key={`${activeSection}-${selectedPatient?.id ?? 'none'}`} className="app-view">
            {activeSection === 'directory' || !selectedPatient ? (
              <PatientDirectoryWorkspace
                patients={patients}
                selectedPatient={selectedPatient}
                selectedAssessments={assessments}
                attentionBoard={followUpAttentionBoard}
                onSelect={(patient) => goToSection(DEFAULT_PATIENT_SECTION, { patient })}
                onNew={() => setShowNewPatient(true)}
                onMeasure={(measureId) => goToSection('measures', { measureId })}
                onDashboard={() => goToSection('overview')}
                onEditPatient={() => selectedPatient ? setEditingPatient(selectedPatient) : null}
                onOpenFollowUp={(patientId) => {
                  const patient = patients.find(item => item.id === patientId)
                  if (patient) goToSection('followup', { patient })
                }}
              />
            ) : activeSection === 'wheelchair' ? (
              <WheelchairPrescriptionTool
                patient={selectedPatient}
                patients={patients}
                onPatientSelect={(patient) => goToSection('wheelchair', { patient, replace: true })}
                userId={user?.id}
                assessments={assessments}
                onSaved={handleWheelchairPrescriptionSaved}
              />
            ) : activeSection === 'pathway' ? (
              <SmartPathwayWorkspace
                patient={selectedPatient}
                pathway={selectedPathway}
                onEditPatient={() => setEditingPatient(selectedPatient)}
                onMeasure={(measureId) => goToSection('measures', { measureId })}
                onReports={() => goToSection('reports')}
              />
            ) : activeSection === 'followup' ? (
              <FollowUpWorkspace
                patient={selectedPatient}
                assessments={assessments}
                followups={followups}
                loading={followupsLoading}
                latestFollowUpUrl={latestFollowUpUrl}
                onCreate={handleCreateFollowUp}
                onCancel={handleCancelFollowUp}
                onResend={handleSendFollowUp}
                onRefresh={() => loadPatientFollowUps(selectedPatient.id)}
                onMeasure={(measureId) => goToSection('measures', { measureId: measureId ?? selectedPathway?.preferredMeasureId ?? 'TUG' })}
                onReports={() => goToSection('reports')}
              />
            ) : activeSection === 'measures' ? (
              <OutcomeMeasuresWorkspace
                patient={selectedPatient}
                userId={user.id}
                pathway={selectedPathway}
                clinicalFocus={profileData.clinicalFocus}
                assessments={assessments}
                requestedMeasureId={requestedMeasureId}
                onMeasure={(measureId) => goToSection('measures', { measureId, replace: true })}
                onSaved={handleAssessmentSaved}
                onDone={() => goToSection('overview')}
                onDirtyChange={setAssessmentDirty}
              />
            ) : activeSection === 'reports' ? (
              <ReportsWorkspace
                patient={selectedPatient}
                assessments={assessments}
                followups={followups}
                reportLoading={reportLoading}
                onViewReport={handleExportFullReport}
                onEditPatient={() => setEditingPatient(selectedPatient)}
                onDeleteAssessment={handleDeleteAssessment}
                onDeletePatient={handleDeletePatient}
              />
            ) : (
              <PatientOverview
                patient={selectedPatient}
                assessments={assessments}
                followups={followups}
                pathway={selectedPathway}
                onEditPatient={() => setEditingPatient(selectedPatient)}
                onMeasure={(measureId) => goToSection('measures', { measureId })}
                onPathway={() => goToSection('pathway')}
                onFollowUp={() => goToSection('followup')}
                onReports={() => goToSection('reports')}
              />
            )}
          </div>
        </main>
      </div>
    </>
  )
}

function AppSidebar({
  activeSection,
  patients,
  selectedPatient,
  pathway,
  followUpSummary,
  profileData,
  user,
  onNavigate,
  onPatientSelect,
  onNewPatient,
  onProfile,
  onSignOut,
}) {
  const profileName = `${profileData.firstName ?? ''} ${profileData.lastName ?? ''}`.trim()
  const displayName = profileName || 'Account'
  const displayEmail = user?.email ?? ''
  const initial = (profileData.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()
  const pathwayCount = (pathway?.missingMeasures?.length ?? 0) + (pathway?.dueMeasures?.length ?? 0)
  const followUpCount = (followUpSummary?.pendingCount ?? 0) + (followUpSummary?.overdueCount ?? 0)
  const patientSectionsDisabled = !selectedPatient

  const navItems = [
    {
      section: 'overview',
      label: 'Overview',
      job: 'Status and next action',
      icon: LayoutDashboard,
      disabled: patientSectionsDisabled,
    },
    {
      section: 'pathway',
      label: 'Smart Pathway',
      job: 'Choose what to record next',
      icon: Route,
      badge: pathwayCount > 0 ? pathwayCount : null,
      disabled: patientSectionsDisabled,
    },
    {
      section: 'followup',
      label: 'Follow-Up',
      job: 'Patient-reported check-ins',
      icon: MessageSquare,
      badge: followUpCount > 0 ? followUpCount : null,
      disabled: patientSectionsDisabled,
    },
    {
      section: 'measures',
      label: 'Outcome Measures',
      job: 'Record the encounter',
      icon: ClipboardList,
      disabled: patientSectionsDisabled,
    },
    {
      section: 'reports',
      label: 'Reports & Notes',
      job: 'Summaries, exports, history',
      icon: FileText,
      disabled: patientSectionsDisabled,
    },
    {
      section: 'wheelchair',
      label: 'Wheelchair Prescription',
      job: 'Specialist seating workflow',
      icon: Accessibility,
      disabled: patientSectionsDisabled,
      // Rehab-specific tool — hidden for MSK-focused clinicians (restored via
      // the profile clinical focus setting; the tool itself is unchanged).
      hidden: profileData.clinicalFocus === 'msk',
    },
  ].filter(item => !item.hidden)

  function handlePatientChange(event) {
    const patient = patients.find(item => String(item.id) === event.target.value)
    if (patient) onPatientSelect(patient)
  }

  return (
    <aside className="app-sidebar">
      <LogoWordmark className="app-sidebar__logo" size="md" />
      <div className="patient-switcher">
        <div className="patient-switcher__head">
          <span className="section-label">Selected patient</span>
          <button type="button" onClick={onNewPatient}>New</button>
        </div>
        <label className="patient-switcher__select">
          <Search size={16} aria-hidden="true" />
          <select
            value={selectedPatient?.id ?? ''}
            onChange={handlePatientChange}
            disabled={!patients.length}
            aria-label="Change selected patient"
          >
            <option value="">{patients.length ? 'Select patient' : 'No patients yet'}</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patientLabel(patient)}
              </option>
            ))}
          </select>
        </label>
        {selectedPatient && (
          <p className="patient-switcher__meta">
            {selectedPatient.diagnosis || 'Diagnosis not recorded'}
          </p>
        )}
      </div>

      <nav className="app-nav" aria-label="Patient workspace navigation">
        <span className="app-nav__group-label">Patient workspace</span>
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.section}
              type="button"
              data-active={activeSection === item.section ? '' : undefined}
              disabled={item.disabled}
              onClick={() => onNavigate(item.section)}
            >
              <Icon size={21} aria-hidden="true" />
              <span className="app-nav__copy">
                <strong>{item.label}</strong>
                <span>{item.job}</span>
              </span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          )
        })}
        <span className="app-nav__group-label app-nav__group-label--separate">Records</span>
        <button
          type="button"
          data-active={activeSection === 'directory' ? '' : undefined}
          onClick={() => onNavigate('directory')}
        >
          <Users size={21} aria-hidden="true" />
          <span className="app-nav__copy">
            <strong>Patient Directory</strong>
            <span>Find or create patients</span>
          </span>
        </button>
      </nav>
      <div className="app-sidebar__bottom">
        <button
          type="button"
          className="profile-strip"
          onClick={onProfile}
          title={displayEmail ? `Account: ${displayEmail}` : 'Account settings'}
        >
          {profileData.avatarUrl
            ? <img className="profile-strip__avatar" src={profileData.avatarUrl} alt="" />
            : <span className="profile-strip__avatar">{initial}</span>}
          <span className="profile-strip__copy">
            <strong>{displayName}</strong>
            {displayEmail ? <small>{displayEmail}</small> : null}
          </span>
          <ChevronDown className="profile-strip__chevron" size={16} aria-hidden="true" />
        </button>
        <button type="button" className="sidebar-signout" onClick={onSignOut}>Sign out</button>
      </div>
    </aside>
  )
}

function AppShellSkeleton() {
  return (
    <div className="app-shell app-shell--skeleton" aria-busy="true">
      <aside className="app-sidebar">
        <LogoWordmark className="app-sidebar__logo" size="md" />
        <nav className="app-nav" aria-label="Loading dashboard navigation">
          {[0, 1, 2, 3, 4, 5].map(item => <span className="skeleton-nav skeleton-line" key={item} />)}
        </nav>
        <div className="app-sidebar__bottom">
          <span className="skeleton-profile">
            <span className="skeleton-avatar" />
            <span className="skeleton-line" />
          </span>
          <span className="skeleton-button skeleton-line" />
        </div>
      </aside>
      <main className="app-main">
        <div className="page-toolbar">
          <span className="skeleton-title skeleton-line" />
        </div>
        <section className="skeleton-workspace" aria-label="Loading workspace">
          <div className="skeleton-directory">
            <span className="skeleton-heading skeleton-line" />
            {[0, 1, 2, 3].map(item => (
              <span className="skeleton-patient-row" key={item}>
                <span className="skeleton-avatar" />
                <span>
                  <span className="skeleton-line" />
                  <span className="skeleton-line skeleton-line--short" />
                </span>
              </span>
            ))}
          </div>
          <div className="skeleton-panel">
            <span className="skeleton-hero" />
            <span className="skeleton-heading skeleton-line" />
            <div className="skeleton-stat-grid">
              {[0, 1, 2, 3].map(item => <span className="skeleton-stat" key={item} />)}
            </div>
            <span className="skeleton-block" />
            <span className="skeleton-block skeleton-block--small" />
          </div>
        </section>
      </main>
    </div>
  )
}

function FollowUpAttentionBoard({ entries, onOpenFollowUp }) {
  if (!entries?.length) return null

  return (
    <section className="summary-card followup-attention-board" aria-label="Patient-reported follow-up attention">
      <div className="summary-card__head">
        <div>
          <h3>Follow-Up Attention</h3>
          <p>Patient-reported signals and overdue links across your caseload.</p>
        </div>
        <span data-attention={entries.some(entry => entry.attentionLevel === FOLLOWUP_ATTENTION.RED) ? FOLLOWUP_ATTENTION.RED : FOLLOWUP_ATTENTION.AMBER}>
          {entries.length} patient{entries.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="followup-attention-board__list">
        {entries.map(entry => (
          <article key={entry.patientId} data-attention={entry.attentionLevel}>
            <div>
              <strong>{entry.patientLabel}</strong>
              <span>{entry.attentionLevel === FOLLOWUP_ATTENTION.GREEN ? 'Links overdue' : entry.attentionLabel}</span>
            </div>
            <div>
              {entry.latestLine && <p>{entry.latestLine}</p>}
              {entry.latestComparisonLine && <p>{entry.latestComparisonLine}</p>}
              <small>
                {entry.latestCompletedAt ? `Last response ${formatFollowUpDate(entry.latestCompletedAt)}` : 'No response yet'}
                {entry.overdueCount ? ` · ${entry.overdueCount} overdue link${entry.overdueCount === 1 ? '' : 's'}` : ''}
              </small>
            </div>
            <button type="button" onClick={() => onOpenFollowUp(entry.patientId)}>Open follow-up</button>
          </article>
        ))}
      </div>
    </section>
  )
}

function PatientDirectoryWorkspace({
  patients,
  selectedPatient,
  selectedAssessments,
  attentionBoard,
  onSelect,
  onNew,
  onMeasure,
  onDashboard,
  onEditPatient,
  onOpenFollowUp,
}) {
  const summary = selectedPatient ? buildPatientSummary(selectedPatient, selectedAssessments) : null
  const pathway = selectedPatient ? buildPatientPathway(selectedPatient, selectedAssessments) : null
  const nextAction = pathway?.nextActions?.[0] ?? null
  const latestAssessment = summary?.assessments?.[0] ?? null

  function handleNextAction() {
    if (nextAction?.measureId) {
      onMeasure(nextAction.measureId)
      return
    }
    if (nextAction?.type === 'diagnosis') {
      onEditPatient?.()
      return
    }
    onDashboard()
  }

  return (
    <div className="directory-stack">
      <FollowUpAttentionBoard entries={attentionBoard} onOpenFollowUp={onOpenFollowUp} />
      <div className="patients-workspace patient-directory-workspace">
      <div className="patient-directory-card">
        <PatientList
          patients={patients}
          selectedId={selectedPatient?.id ?? null}
          onSelect={onSelect}
          onNew={onNew}
        />
      </div>

      <section className="workspace-shell directory-focus-panel">
        {selectedPatient ? (
          <>
            <div className="workspace-head">
              <div>
                <span className="section-label">Selected patient</span>
                <h2>{patientLabel(selectedPatient)}</h2>
                <p>{selectedPatient.diagnosis || 'Diagnosis not recorded'}</p>
              </div>
              {onEditPatient && (
                <button type="button" className="secondary-action" onClick={onEditPatient}>
                  Edit details
                </button>
              )}
            </div>

            <div className="workspace-stat-grid">
              <div><span>Assessments</span><strong>{summary.totals.assessments}</strong></div>
              <div><span>Measures</span><strong>{summary.totals.measures}</strong></div>
              <div><span>Domains</span><strong>{summary.totals.domains}</strong></div>
              <div><span>Latest</span><strong>{formatAssessmentDate(latestAssessment?.created_at)}</strong></div>
            </div>

            {pathway && (
              <article className="next-action-panel" data-tone={pathway.statusTone}>
                <div>
                  <span className="section-label">Next best action</span>
                  <h3>{nextAction?.label ?? pathway.statusLabel}</h3>
                  <p>{nextAction?.detail ?? pathway.explanation.short}</p>
                </div>
                <button type="button" onClick={handleNextAction}>
                  {pathwayActionLabel(nextAction)}
                </button>
              </article>
            )}

            <div className="directory-quick-actions">
              <button type="button" onClick={onDashboard}>Open Overview</button>
              <button type="button" onClick={() => onMeasure(pathway?.preferredMeasureId ?? '10MWT')}>
                Record Outcome
              </button>
            </div>
          </>
        ) : (
          <div className="patient-workspace-empty">
            <div className="brand-iq-mark patient-workspace-empty__iq" aria-hidden="true">IQ</div>
            <h2>{patients.length ? 'Select a patient' : 'Create your first patient'}</h2>
            <p>
              {patients.length
                ? 'Choose a patient to open their overview, pathway, measures, reports, and wheelchair workflow.'
                : 'Start with the patient record, then the workspace will guide assessment and reporting.'}
            </p>
            <button type="button" onClick={onNew}>New Patient</button>
          </div>
        )}
      </section>
      </div>
    </div>
  )
}

function PatientOverview({ patient, assessments, followups, pathway, onEditPatient, onMeasure, onPathway, onFollowUp, onReports }) {
  const summary = buildPatientSummary(patient, assessments)
  const followUpSummary = summarizeFollowUpRecords(followups)
  const followUpAction = getFollowUpOverviewAction(followUpSummary)
  const nextAction = pathway?.nextActions?.[0] ?? null
  const latestAssessment = summary.assessments[0] ?? null
  const prioritySignal = summary.flags[0] ?? null
  const latestEntries = summary.entries.slice(0, 4)

  function handleNextAction() {
    if (followUpAction?.action === 'measure') {
      onMeasure(pathway?.preferredMeasureId ?? 'TUG')
      return
    }
    if (followUpAction?.action === 'reports') {
      onReports()
      return
    }
    if (followUpAction?.action === 'followup') {
      onFollowUp()
      return
    }
    if (nextAction?.measureId) {
      onMeasure(nextAction.measureId)
      return
    }
    if (nextAction?.type === 'diagnosis') {
      onEditPatient()
      return
    }
    if (nextAction?.type === 'current') {
      onReports()
      return
    }
    onPathway()
  }

  return (
    <section className="workspace-shell overview-workspace">
      <div className="workspace-head">
        <div>
          <h2>{patientLabel(patient)}</h2>
          <p>{patient.diagnosis || 'Diagnosis not recorded'}</p>
        </div>
        <div className="workspace-head__actions">
          <button type="button" className="secondary-action" onClick={onEditPatient}>Edit details</button>
          <button type="button" onClick={onPathway}>Smart Pathway</button>
        </div>
      </div>

      <div className="overview-grid">
        <article className="next-action-panel overview-next-action" data-tone={pathway?.statusTone}>
          <div>
            <h3>{followUpAction?.label ?? nextAction?.label ?? 'Open Smart Pathway'}</h3>
            <p>{followUpAction?.detail ?? nextAction?.detail ?? 'Review the pathway to choose the next useful clinical action.'}</p>
          </div>
          <button type="button" onClick={handleNextAction}>
            {followUpAction?.button ?? pathwayActionLabel(nextAction)}
          </button>
        </article>

        <div className="overview-meta-strip">
          <div><strong>{summary.totals.assessments}</strong><span>Assessments</span></div>
          <div><strong>{summary.totals.measures}</strong><span>Measures</span></div>
          <div><strong>{summary.totals.domains}</strong><span>Domains</span></div>
          <div><strong>{formatAssessmentDate(latestAssessment?.created_at)}</strong><span>Latest assessment</span></div>
        </div>

        <article className="overview-card overview-card--signal">
          <div className="summary-card__head">
            <div>
              <h3>Clinical signal</h3>
              <p>Highest current flag from recorded measures.</p>
            </div>
          </div>
          {prioritySignal ? (
            <div className="overview-signal" data-tone={prioritySignal.tone}>
              <strong>{prioritySignal.title}</strong>
              <span>{prioritySignal.value}</span>
              <p>{prioritySignal.text}</p>
            </div>
          ) : (
            <p className="empty-hint">No elevated clinical signal is currently recorded.</p>
          )}
        </article>

        <article className="overview-card overview-card--measures">
          <div className="summary-card__head">
            <div>
              <h3>Latest measures</h3>
              <p>Recent recorded outcome values for fast scanning.</p>
            </div>
            <button type="button" onClick={onReports}>History</button>
          </div>
          <div className="overview-measure-list">
            {latestEntries.length ? latestEntries.map(entry => (
              <button key={entry.measureId} type="button" onClick={() => onMeasure(entry.measureId)}>
                <span>{entry.measure.id}</span>
                <strong>{entry.valueLabel}</strong>
                <em>{entry.interpretation}</em>
              </button>
            )) : (
              <p className="empty-hint">Record a baseline measure to populate this view.</p>
            )}
          </div>
        </article>

        <article className="overview-card overview-card--followup">
          <div className="summary-card__head">
            <div>
              <h3>Patient follow-up</h3>
              <p>Remote questionnaire links and patient-reported attention signals.</p>
            </div>
            <button type="button" onClick={onFollowUp}>Open</button>
          </div>
          <div className="followup-overview-status" data-attention={followUpSummary.attentionLevel}>
            <span>{followUpAttentionLabel(followUpSummary.attentionLevel)}</span>
            <strong>
              {followUpSummary.latestResponse
                ? latestFollowUpLine(followUpSummary.latestResponse)
                : 'No patient-reported follow-up yet'}
            </strong>
            <p>
              {followUpSummary.overdueCount
                ? `${followUpSummary.overdueCount} questionnaire link${followUpSummary.overdueCount === 1 ? '' : 's'} overdue.`
                : followUpSummary.pendingCount
                  ? `${followUpSummary.pendingCount} secure link${followUpSummary.pendingCount === 1 ? '' : 's'} pending.`
                  : 'Create a secure link when you want the patient to repeat a completed questionnaire.'}
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}

function SmartPathwayWorkspace({ patient, pathway, onEditPatient, onMeasure, onReports }) {
  const nextActions = pathway?.nextActions ?? []
  const measureGroups = [
    {
      title: 'Missing baseline',
      empty: 'Recommended baseline measures are recorded.',
      state: 'missing',
      items: pathway?.missingMeasures ?? [],
    },
    {
      title: 'Due reassessment',
      empty: 'No pathway reassessments are due.',
      state: 'due',
      items: pathway?.dueMeasures ?? [],
    },
    {
      title: 'Recorded/current',
      empty: 'No pathway measures have been recorded yet.',
      state: 'recorded',
      items: pathway?.recordedMeasures ?? [],
    },
  ]

  function handleAction(action) {
    if (action.measureId) {
      onMeasure(action.measureId)
      return
    }
    if (action.type === 'diagnosis') {
      onEditPatient()
      return
    }
    onReports()
  }

  return (
    <section className="workspace-shell pathway-workspace">
      <div className="workspace-head">
        <div>
          <h2>{patientLabel(patient)}</h2>
          <p>{pathway?.diagnosisLabel ?? patient.diagnosis ?? 'Diagnosis not recorded'} pathway</p>
        </div>
        <button type="button" className="secondary-action" onClick={onEditPatient}>Edit diagnosis</button>
      </div>

      <div className="pathway-hero" data-tone={pathway?.statusTone}>
        <div>
          <span className="section-label">Pathway status</span>
          <h3>{pathway?.statusLabel ?? 'Pathway unavailable'}</h3>
          <p>{pathway?.explanation.detail}</p>
        </div>
        <div className="pathway-coverage">
          <strong>{pathway?.coveragePercent ?? 0}%</strong>
          <span>Baseline coverage</span>
        </div>
      </div>

      <div className="pathway-action-grid">
        {nextActions.map((action, index) => (
          <article key={`${action.type}-${action.measureId ?? index}`} data-tone={action.tone}>
            <span>{action.type === 'reassess' ? 'Reassessment' : action.type === 'baseline' ? 'Baseline' : 'Pathway action'}</span>
            <strong>{action.label}</strong>
            <p>{action.detail}</p>
            <button type="button" onClick={() => handleAction(action)}>
              {pathwayActionLabel(action)}
            </button>
          </article>
        ))}
      </div>

      <div className="pathway-measure-columns">
        {measureGroups.map(group => (
          <section key={group.title} className="pathway-measure-column">
            <h3>{group.title}</h3>
            {group.items.length ? group.items.map(item => (
              <button
                key={`${group.state}-${item.id}`}
                type="button"
                data-state={group.state}
                onClick={() => onMeasure(item.id)}
              >
                <span>{item.id}</span>
                <strong>{item.name}</strong>
                <em>
                  {item.lastRecordedLabel
                    ? `Last recorded ${item.lastRecordedLabel}`
                    : 'Not yet recorded'}
                </em>
              </button>
            )) : (
              <p className="empty-hint">{group.empty}</p>
            )}
          </section>
        ))}
      </div>
    </section>
  )
}

function FollowUpWorkspace({
  patient,
  assessments,
  followups,
  loading,
  latestFollowUpUrl,
  onCreate,
  onCancel,
  onResend,
  onRefresh,
  onMeasure,
  onReports,
}) {
  const [dueDate, setDueDate] = useState(dateInputValueInDays(7))
  const [expiresDate, setExpiresDate] = useState(dateInputValueInDays(14))
  const eligibleQuestionnaires = getEligibleFollowUpQuestionnaireOptions(assessments)
  const [selectedMeasureId, setSelectedMeasureId] = useState(eligibleQuestionnaires[0]?.measureId ?? '')
  const [creating, setCreating] = useState(false)
  const [manualCreating, setManualCreating] = useState(false)
  const [sendingId, setSendingId] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const summary = summarizeFollowUpRecords(followups)
  const latestRecord = summary.latestResponse ?? null
  const latestAttention = getFollowUpRecordAttention(latestRecord)
  const selectedOption = eligibleQuestionnaires.find(option => option.measureId === selectedMeasureId) ?? eligibleQuestionnaires[0] ?? null

  useEffect(() => {
    if (!eligibleQuestionnaires.length) {
      setSelectedMeasureId('')
      return
    }
    if (!eligibleQuestionnaires.some(option => option.measureId === selectedMeasureId)) {
      setSelectedMeasureId(eligibleQuestionnaires[0].measureId)
    }
  }, [eligibleQuestionnaires, selectedMeasureId])

  async function createFollowUp(deliveryMode) {
    if (!selectedOption) {
      setError('Record one eligible questionnaire before creating a patient follow-up link.')
      return
    }
    if (deliveryMode === 'email' && !patient?.email) {
      setError('Add a patient email before sending a follow-up email.')
      return
    }
    const setBusy = deliveryMode === 'email' ? setCreating : setManualCreating
    setBusy(true)
    setError('')
    setNotice('')
    setCopied(false)
    try {
      const data = await onCreate({
        dueDate,
        expiresDate,
        measureId: selectedOption.measureId,
        sourceAssessmentId: selectedOption.sourceAssessmentId,
        deliveryMode,
      })
      if (deliveryMode === 'email' && data.email?.status === 'sent') {
        setNotice(`Email sent to ${patient.email}.`)
      }
      if (deliveryMode === 'email' && data.email?.status === 'failed') {
        setError(`${data.email.error || 'Email could not be sent.'} The secure link is available below for manual sending.`)
      }
      if (data.publicUrl && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data.publicUrl)
        setCopied(true)
      }
    } catch (createError) {
      setError(createError.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    await createFollowUp(patient?.email ? 'email' : 'manual')
  }

  async function handleManualCreate() {
    await createFollowUp('manual')
  }

  async function handleCopy() {
    if (!latestFollowUpUrl || !navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(latestFollowUpUrl)
    setCopied(true)
  }

  async function handleCancel(id) {
    setError('')
    try {
      await onCancel(id)
    } catch (cancelError) {
      setError(cancelError.message)
    }
  }

  async function handleResend(id) {
    setError('')
    setNotice('')
    setSendingId(id)
    try {
      const data = await onResend(id)
      setNotice(data.email?.status === 'sent' ? 'Follow-up email sent.' : '')
    } catch (sendError) {
      setError(`${sendError.message} The latest secure link is available below for manual sending.`)
    } finally {
      setSendingId('')
    }
  }

  return (
    <section className="workspace-shell followup-workspace">
      <div className="workspace-head">
        <div>
          <h2>{patientLabel(patient)}</h2>
          <p>Secure links for patients to repeat questionnaires already completed with their clinician.</p>
        </div>
        <button type="button" className="secondary-action" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="followup-stat-grid">
        <div>
          <span>Last response</span>
          <strong>{latestRecord ? completedFollowUpDate(latestRecord) : 'None yet'}</strong>
          <small>{latestRecord ? latestFollowUpLine(latestRecord) : 'Awaiting first questionnaire'}</small>
        </div>
        <div>
          <span>Pending links</span>
          <strong>{summary.pendingCount}</strong>
          <small>{summary.overdueCount ? `${summary.overdueCount} overdue` : patient?.email ? `Email: ${patient.email}` : 'Manual copy and send'}</small>
        </div>
        <div>
          <span>Attention</span>
          <strong>{followUpAttentionLabel(summary.attentionLevel)}</strong>
          <small>{summary.completedCount} completed check-in{summary.completedCount === 1 ? '' : 's'}</small>
        </div>
      </div>

      {latestRecord && latestAttention !== FOLLOWUP_ATTENTION.GREEN && (
        <article className="followup-attention-panel" data-attention={latestAttention}>
          <div>
            <span className="section-label">Patient-reported signal</span>
            <h3>{followUpAttentionLabel(latestAttention)}</h3>
            <p>{latestFollowUpLine(latestRecord)}</p>
            {latestRecord.assessment?.comparison?.summaryLine && (
              <p data-direction={latestRecord.assessment.comparison.direction}>{latestRecord.assessment.comparison.summaryLine}</p>
            )}
            {latestRecord.assessment?.interpretation && <p>{latestRecord.assessment.interpretation}</p>}
            {latestRecord.response?.concern_text && <p>{latestRecord.response.concern_text}</p>}
          </div>
          <button type="button" onClick={latestRecord.assessment ? onReports : onMeasure}>
            {latestRecord.assessment ? 'Open reports' : 'Record outcome measure'}
          </button>
        </article>
      )}

      <form className="followup-create-panel" onSubmit={handleCreate}>
        <div>
          <span className="section-label">Create secure link</span>
          <h3>Patient questionnaire</h3>
          <p>Choose a completed questionnaire, then send by email or create a manual link.</p>
        </div>
        <div className="followup-email-target">
          <span>Email</span>
          <strong>{patient?.email || 'No patient email'}</strong>
          <small>{patient?.email ? 'Stored on the patient record.' : 'Edit patient details to enable email sending.'}</small>
        </div>
        <label>
          <span>Questionnaire</span>
          <select
            className="field-input"
            value={selectedMeasureId}
            disabled={!eligibleQuestionnaires.length || creating}
            onChange={event => setSelectedMeasureId(event.target.value)}
          >
            {eligibleQuestionnaires.length ? eligibleQuestionnaires.map(option => (
              <option key={option.measureId} value={option.measureId}>
                {option.measureId} - {option.resultLabel} ({formatFollowUpDate(option.latestCreatedAt)})
              </option>
            )) : (
              <option value="">No completed questionnaires</option>
            )}
          </select>
        </label>
        <label>
          <span>Due date</span>
          <input className="field-input" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} />
        </label>
        <label>
          <span>Link expires</span>
          <input className="field-input" type="date" value={expiresDate} onChange={event => setExpiresDate(event.target.value)} />
        </label>
        <div className="followup-create-actions">
          <button type="submit" disabled={creating || manualCreating || !selectedOption || !patient?.email}>
            {creating ? 'Sending...' : 'Create and send email'}
          </button>
          <button type="button" data-secondary="" disabled={creating || manualCreating || !selectedOption} onClick={handleManualCreate}>
            {manualCreating ? 'Creating...' : 'Create secure link'}
          </button>
        </div>
      </form>

      {!eligibleQuestionnaires.length && (
        <div className="followup-empty-panel">
          <strong>No eligible questionnaire yet</strong>
          <p>Complete one of {FOLLOWUP_QUESTIONNAIRE_MEASURE_IDS.join(', ')} with this patient, then send the same questionnaire as a follow-up.</p>
          <button type="button" onClick={() => onMeasure('ABC')}>Record questionnaire</button>
        </div>
      )}

      {latestFollowUpUrl && (
        <div className="followup-link-panel">
          <Link2 size={18} aria-hidden="true" />
          <input value={latestFollowUpUrl} readOnly aria-label="Secure follow-up link" />
          <button type="button" onClick={handleCopy}>
            <Copy size={16} aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      {notice && <p className="followup-inline-success" role="status">{notice}</p>}
      {error && <p className="followup-inline-error" role="alert">{error}</p>}

      <FollowUpTimeline
        records={summary.records}
        loading={loading}
        onCancel={handleCancel}
        onResend={handleResend}
        sendingId={sendingId}
        onReports={onReports}
      />
    </section>
  )
}

function followUpEmailStatusLabel(record) {
  if (record.email_status === 'sent') return `Email sent${record.sent_at ? ` ${formatFollowUpDate(record.sent_at)}` : ''}`
  if (record.email_status === 'failed') return 'Email send failed'
  if (record.email_status === 'manual') return 'Manual link created'
  return record.recipient_email ? 'Email not sent yet' : 'Manual link created'
}

function FollowUpTimeline({ records, loading, onCancel, onResend, sendingId, onReports }) {
  if (loading) {
    return (
      <section className="followup-timeline">
        <h3>Follow-up timeline</h3>
        {[0, 1, 2].map(item => <span key={item} className="followup-skeleton" />)}
      </section>
    )
  }

  return (
    <section className="followup-timeline">
      <h3>Follow-up timeline</h3>
      {records.length ? records.map(record => (
        <article key={record.id} data-status={record.displayStatus} data-attention={record.response?.attention_level}>
          <div className="followup-row__icon" aria-hidden="true">
            {record.displayStatus === FOLLOWUP_STATUS.PENDING ? <Bell size={16} /> : record.displayStatus === FOLLOWUP_STATUS.COMPLETED ? <MessageSquare size={16} /> : <XCircle size={16} />}
          </div>
          <div>
            <span>{followUpStatusLabel(record.displayStatus, record.overdue)}</span>
            <strong>
              {record.response || record.assessment
                ? latestFollowUpLine(record)
                : `Due ${formatFollowUpDate(record.due_at)}. Expires ${formatFollowUpDate(record.expires_at)}.`}
            </strong>
            {record.measure_id && <p>{followUpMeasureLabel(record)}</p>}
            <p>{followUpEmailStatusLabel(record)}{record.recipient_email ? ` · ${record.recipient_email}` : ''}</p>
            {record.email_error && <p>{record.email_error}</p>}
            {record.assessment?.comparison?.summaryLine && (
              <p data-direction={record.assessment.comparison.direction}>{record.assessment.comparison.summaryLine}</p>
            )}
            {record.assessment?.interpretation && <p>{record.assessment.interpretation}</p>}
            {record.response?.concern_text && <p>{record.response.concern_text}</p>}
            <small>
              {record.response || record.assessment
                ? `Completed ${completedFollowUpDate(record)}`
                : `Created ${formatFollowUpDate(record.created_at)}`}
            </small>
          </div>
          {record.displayStatus === FOLLOWUP_STATUS.PENDING && (
            <div className="followup-row-actions">
              {record.recipient_email && (
                <button type="button" onClick={() => onResend(record.id)} disabled={sendingId === record.id}>
                  {sendingId === record.id ? 'Sending...' : 'Resend email'}
                </button>
              )}
              <button type="button" onClick={() => onCancel(record.id)}>Cancel</button>
            </div>
          )}
          {record.assessment && record.displayStatus === FOLLOWUP_STATUS.COMPLETED && (
            <button type="button" onClick={onReports}>Open assessment</button>
          )}
        </article>
      )) : (
        <p className="empty-hint">No follow-up links have been created for this patient yet.</p>
      )}
    </section>
  )
}

function OutcomeMeasuresWorkspace({
  patient,
  userId,
  pathway,
  clinicalFocus,
  assessments,
  requestedMeasureId,
  onMeasure,
  onSaved,
  onDone,
  onDirtyChange,
}) {
  const priorityMeasures = [
    ...(pathway?.dueMeasures ?? []),
    ...(pathway?.missingMeasures ?? []),
  ].slice(0, 8)

  return (
    <section className="outcome-measures-workspace">
      {priorityMeasures.length > 0 && (
        <div className="measure-priority-strip" aria-label="Pathway priority measures">
          <span>Pathway priorities</span>
          {priorityMeasures.map(item => (
            <button
              key={`${item.isDue ? 'due' : 'missing'}-${item.id}`}
              type="button"
              data-state={item.isDue ? 'due' : 'missing'}
              data-active={requestedMeasureId === item.id ? '' : undefined}
              onClick={() => onMeasure(item.id)}
            >
              {item.isDue ? `Repeat ${item.id}` : `Record ${item.id}`}
            </button>
          ))}
        </div>
      )}
      <MeasureEntry
        patient={patient}
        userId={userId}
        pathway={pathway}
        clinicalFocus={clinicalFocus}
        assessments={assessments}
        activeMeasureId={requestedMeasureId}
        initialMeasureId={requestedMeasureId}
        onSaved={onSaved}
        onDone={onDone}
        onDirtyChange={onDirtyChange}
      />
    </section>
  )
}

function ReportsWorkspace({
  patient,
  assessments,
  followups,
  reportLoading,
  onViewReport,
  onEditPatient,
  onDeleteAssessment,
  onDeletePatient,
}) {
  return (
    <section className="reports-workspace">
      <PatientHeader
        patient={patient}
        assessments={assessments}
        onViewReport={onViewReport}
        reportLoading={reportLoading}
        onEditPatient={onEditPatient}
      />
      <FollowUpReportSection followups={followups} />
      <SummaryTab
        patient={patient}
        assessments={assessments}
        onDeleteAssessment={onDeleteAssessment}
        onDeletePatient={onDeletePatient}
        mode="reports"
      />
    </section>
  )
}

function FollowUpReportSection({ followups }) {
  const summary = summarizeFollowUpRecords(followups)
  const latestRecord = summary.latestResponse ?? null
  const latestResponse = latestRecord?.response ?? null
  const latestAssessment = latestRecord?.assessment ?? null
  return (
    <section className="summary-card followup-report-section">
      <div className="summary-card__head">
        <div>
          <h3>Patient-Reported Follow-Up</h3>
          <p>Remote questionnaires, attention level, and recent patient-reported context.</p>
        </div>
        <span data-attention={summary.attentionLevel}>{followUpAttentionLabel(summary.attentionLevel)}</span>
      </div>
      {latestAssessment ? (
        <div className="followup-report-grid">
          <div><span>Last response</span><strong>{completedFollowUpDate(latestRecord)}</strong></div>
          <div><span>Questionnaire</span><strong>{latestAssessment.measure}</strong></div>
          <div><span>Score</span><strong>{latestAssessment.resultLabel}</strong></div>
          <div><span>Signal</span><strong>{followUpAttentionLabel(latestAssessment.attention_level)}</strong></div>
          <div>
            <span>Change vs baseline</span>
            <strong>{latestAssessment.comparison ? latestAssessment.comparison.deltaLabel : 'No baseline'}</strong>
          </div>
          <div><span>Source</span><strong>Patient-reported</strong></div>
        </div>
      ) : latestResponse ? (
        <div className="followup-report-grid">
          <div><span>Last response</span><strong>{formatFollowUpDate(latestResponse.created_at)}</strong></div>
          <div><span>Falls</span><strong>{latestResponse.falls_count}</strong></div>
          <div><span>Confidence</span><strong>{latestResponse.confidence_score}/10</strong></div>
          <div><span>Fatigue</span><strong>{latestResponse.fatigue_score}/10</strong></div>
          <div><span>Symptoms</span><strong>{latestResponse.symptoms_change}</strong></div>
          <div><span>Overall</span><strong>{latestResponse.global_status}</strong></div>
        </div>
      ) : (
        <p className="empty-hint">No patient-reported follow-up responses have been submitted yet.</p>
      )}
      {latestAssessment?.comparison?.summaryLine && (
        <p className="followup-report-concern" data-direction={latestAssessment.comparison.direction}>
          {latestAssessment.comparison.summaryLine}
        </p>
      )}
      {latestAssessment?.interpretation && <p className="followup-report-concern">{latestAssessment.interpretation}</p>}
      {latestResponse?.concern_text && <p className="followup-report-concern">{latestResponse.concern_text}</p>}
    </section>
  )
}

export function PatientsWorkspace({
  patients,
  selectedPatient,
  selectedAssessments,
  onSelect,
  onNew,
  onNewAssessment,
  onDashboard,
  onEditPatient,
}) {
  const latestAssessment = selectedAssessments?.[0] ?? null
  const measureCount = new Set((selectedAssessments ?? []).map(a => a.measure)).size
  const latestDate = latestAssessment?.created_at
    ? new Date(latestAssessment.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'No assessments'
  const pathway = selectedPatient ? buildPatientPathway(selectedPatient, selectedAssessments) : null
  const nextPathwayAction = pathway?.nextActions?.[0] ?? null

  return (
    <div className="patients-workspace">
      <div className="patient-directory-card">
        <PatientList
          patients={patients}
          selectedId={selectedPatient?.id ?? null}
          onSelect={onSelect}
          onNew={onNew}
        />
      </div>

      <section className="patient-workspace-panel">
        {selectedPatient ? (
          <>
            <div className="patient-workspace-hero">
              <div className="patient-workspace-avatar" aria-hidden="true">
                {selectedPatient.initials?.charAt(0) || '?'}
              </div>
              <div>
                <span className="section-label">Selected Patient</span>
                <h2>{selectedPatient.initials}</h2>
                <p>{selectedPatient.diagnosis || 'Diagnosis not recorded'}</p>
              </div>
              <div className="brand-iq-mark patient-workspace-iq" aria-hidden="true">IQ</div>
            </div>
            <div className="patient-workspace-stats">
              <div><span>Total assessments</span><strong>{selectedAssessments.length}</strong></div>
              <div><span>Measure types</span><strong>{measureCount}</strong></div>
              <div><span>Latest assessment</span><strong>{latestDate}</strong></div>
              <div><span>Pathway</span><strong>{pathway ? `${pathway.coveragePercent}%` : '-'}</strong></div>
            </div>
            {pathway && (
              <div className="pathway-mini-card" data-tone={pathway.statusTone}>
                <div>
                  <span>Smart pathway</span>
                  <strong>{pathway.statusLabel}</strong>
                  <p className="pathway-mini-card__explanation">{pathway.explanation.short}</p>
                  {nextPathwayAction?.detail && <p>{nextPathwayAction.detail}</p>}
                </div>
                {nextPathwayAction?.type === 'diagnosis' && onEditPatient && (
                  <button type="button" onClick={onEditPatient}>
                    Add diagnosis
                  </button>
                )}
                {nextPathwayAction?.measureId && (
                  <button type="button" onClick={onNewAssessment}>
                    {nextPathwayAction.label}
                  </button>
                )}
              </div>
            )}
            <div className="patient-workspace-actions">
              <button type="button" onClick={onNewAssessment}>New Assessment</button>
              {onEditPatient && (
                <button type="button" onClick={onEditPatient}>Edit details</button>
              )}
              <button type="button" onClick={onDashboard}>Open Dashboard</button>
            </div>
            <div className="patient-workspace-recent">
              <h3>Recent Measures</h3>
              {selectedAssessments.slice(0, 6).length ? selectedAssessments.slice(0, 6).map(assessment => (
                <div key={assessment.id}>
                  <strong>{assessment.measure}</strong>
                  <span>{assessment.results?.interpretation ?? 'Saved assessment'}</span>
                </div>
              )) : <p>No assessments recorded yet.</p>}
            </div>
          </>
        ) : (
          <div className="patient-workspace-empty">
            <div className="brand-iq-mark patient-workspace-empty__iq" aria-hidden="true">IQ</div>
            <h2>Select or add a patient</h2>
            <p>Choose a patient to see recent measures, dashboard access, and assessment actions.</p>
            <button type="button" onClick={onNew}>Add New Patient</button>
          </div>
        )}
      </section>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal" onClick={onCancel} aria-modal="true" role="dialog">
      <div className="modal-content confirm-modal-content" onClick={e => e.stopPropagation()}>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" data-danger="" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

function AppHead() {
  return (
    <Head>
      <title>Clinical Dashboard | RehabMetrics IQ</title>
      <meta name="description" content="The secure RehabMetrics IQ clinical dashboard for physiotherapists and rehabilitation teams. Sign in to record, score, interpret, and track standardised outcome measures for your patients." />
      {/* Intentional noindex: authenticated clinical workspace, not for search results. */}
      <meta name="robots" content="noindex,nofollow" />
      <meta property="og:url" content="https://www.rehabmetricsiq.com/app" />
      <meta property="og:title" content="Clinical Dashboard | RehabMetrics IQ" />
      <meta property="og:description" content="The secure RehabMetrics IQ clinical dashboard for physiotherapists and rehabilitation teams." />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="RehabMetrics IQ" />
      <meta property="og:image" content="https://www.rehabmetricsiq.com/SquareLogo.png" />
      <link rel="icon" href="/SquareLogo.png" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&family=Source+Serif+4:wght@600;700&display=swap" rel="stylesheet" />
    </Head>
  )
}

const globalStyles = `
  /* ── RESET & BASE ── */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: var(--color-ink); font-variant-numeric: tabular-nums; }

  /* ── PAGE SHELL ── */
  .loading-page { min-height: 100vh; background: var(--color-surface-soft); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
  .loading-text { font-size: 14px; color: var(--color-subtle); }
  .button-loading { display: inline-flex; align-items: center; justify-content: center; gap: 9px; }
  .page { min-height: 100vh; background: var(--color-surface-soft); }

  .header { background: rgba(255,255,255,0.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 10; }
  .header-inner { height: 64px; max-width: 1360px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; gap: 14px; }

  .wordmark { flex-shrink: 0; }

  [data-header-divider] { width: 1px; height: 28px; background: var(--color-border); flex-shrink: 0; }
  [data-header-subtitle] { font-family: 'Geist', sans-serif; font-size: 13px; color: var(--color-subtle); font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }

  [data-profile-btn] { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; padding: 0; min-width: 0; flex: 1; text-align: left; }
  [data-profile-btn]:hover [data-header-subtitle] { color: var(--color-primary); }
  [data-profile-avatar] { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--color-border); flex-shrink: 0; }
  [data-profile-initials] { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary-soft); border: 1px solid var(--color-border); color: var(--color-primary-dark); font-size: 12px; font-weight: 700; font-family: 'Geist', sans-serif; text-transform: uppercase; flex-shrink: 0; }
  [data-avatar-upload] { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  [data-avatar-upload] [data-profile-avatar], [data-avatar-upload] [data-profile-initials] { width: 64px; height: 64px; font-size: 22px; }
  [data-avatar-upload] input[type="file"] { display: none; }
  [data-avatar-upload] label { font-size: 13px; font-weight: 500; color: var(--color-primary); cursor: pointer; text-decoration: underline; }

  .trial-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--color-amber); background: var(--color-amber-soft); border: 1px solid var(--color-amber-border); border-radius: var(--radius-sm); padding: 3px 9px; flex-shrink: 0; margin-left: auto; }
  .signout-btn { font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500; color: var(--color-muted); background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 6px 14px; cursor: pointer; transition: color 0.15s, border-color 0.15s, background 0.15s; flex-shrink: 0; }
  .signout-btn:hover { color: var(--color-ink); border-color: var(--color-muted); background: rgba(255,255,255,0.8); }

  .dashboard { max-width: 1360px; margin: 0 auto; padding: 20px 24px 56px; display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }
  .sidebar { }
  .main { min-width: 0; }

  /* Payment notification banner */
  [data-notification] { padding: 12px 16px; font-size: 13px; font-weight: 500; border-radius: var(--radius-sm); margin-bottom: 20px; }
  [data-notification="success"] { background: var(--color-green-soft); color: var(--color-green); border: 1px solid var(--color-green-border); }
  [data-notification="patient-updated"] { background: var(--color-green-soft); color: var(--color-green); border: 1px solid var(--color-green-border); }
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
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--color-subtle);
    margin-bottom: 10px;
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
    font-family: 'Geist', sans-serif;
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
    box-shadow: 0 0 0 3px rgba(9,75,138,0.1);
    background: #fff;
  }
  .field-input::placeholder { color: var(--color-subtle); }
  select.field-input { cursor: pointer; }

  .field-note {
    margin: 0;
    color: var(--color-subtle);
    font-size: 11px;
    line-height: 1.45;
  }

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
    border: 1px solid transparent;
    border-radius: 8px;
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
    font-family: 'Geist', sans-serif;
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

  .patient-card li:hover:not([aria-selected="true"]) { background: rgba(9,75,138,0.04); }

  .patient-card li[aria-selected="true"] {
    background: var(--color-primary-soft);
    border-color: rgba(9,75,138,0.28);
  }

  .patient-card li[aria-selected="true"] strong { color: var(--color-primary-dark); }

  .patient-card li[aria-selected="true"][data-initials]::before {
    background: rgba(9,75,138,0.18);
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
    border-color: transparent;
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
    font-family: 'Geist', sans-serif;
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
    font-family: 'Geist', sans-serif;
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
    background: #fffdf4;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    font-family: monospace;
    font-size: 13px;
    color: var(--color-ink);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .input-narrow:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(9,75,138,0.1); background: #fff; }

  .calc-value { font-family: monospace; font-size: 13px; color: var(--color-primary); font-weight: 500; }
  .ref-note { font-size: 11px; color: var(--color-subtle); font-style: italic; line-height: 1.4; }
  .na-text { color: var(--color-subtle); font-style: italic; font-size: 12px; }

  /* ── CHIPS ── */
  .interp-chip { display: inline-flex; align-items: center; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 99px; border: 1px solid; white-space: nowrap; }
  .chip-green { background: var(--color-green-soft); color: var(--color-green); border-color: var(--color-green-border); }
  .chip-amber { background: var(--color-amber-soft); color: var(--color-amber); border-color: var(--color-amber-border); }
  .chip-red   { background: var(--color-red-soft);   color: var(--color-red);   border-color: var(--color-red-border); }
  .chip-grey  { background: var(--color-surface-soft); color: var(--color-subtle); border-color: var(--color-border); }

  /* ── INFO PANEL ── */
  .info-panel { padding: 14px 16px; background: var(--color-primary-soft); border: 1px solid var(--color-primary-border); border-radius: var(--radius-sm); font-size: 12px; color: var(--color-primary); line-height: 1.6; margin-top: 14px; margin-bottom: 16px; }
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
    font-family: 'Geist', sans-serif;
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
    font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
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
    color: var(--color-red);
    padding: 8px 12px;
    background: var(--color-red-soft);
    border: 1px solid var(--color-red-border);
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
    box-shadow: 0 20px 48px rgba(28,43,54,0.14);
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

  .modal-helper {
    margin: 0;
    padding: 18px 28px 0;
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.5;
  }

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
    font-family: 'Geist', sans-serif;
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
    font-family: 'Geist', sans-serif;
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
  .modal-content form button[type="submit"][data-danger] { background: var(--color-red); }
  .modal-content form button[type="submit"][data-danger]:hover { background: var(--color-red-dark); opacity: 1; }

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
  [data-mcid="met"]     { color: var(--color-green); border-color: var(--color-green-border); background: var(--color-green-soft); }
  [data-mcid="near"]    { color: var(--color-muted); }
  [data-mcid="decline"] { color: var(--color-red); border-color: var(--color-red-border); background: var(--color-red-soft); }

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
    font-family: 'Geist', sans-serif;
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
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    transition: background 0.1s, border-color 0.1s;
    text-align: left;
  }

  [data-measure-btn]:hover:not([data-unavailable]) { background: var(--color-primary-soft); }
  [data-measure-btn][data-active] { background: var(--color-primary-soft); border-color: var(--color-border-strong); }
  [data-measure-btn][data-unavailable] { cursor: default; opacity: 0.45; }

  [data-measure-label] {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  [data-measure-abbr] {
    font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
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

  [data-done-badge] { font-size: 11px; font-weight: 700; color: var(--color-green); flex-shrink: 0; }

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
    font-family: 'Geist', sans-serif;
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

  [data-measure-footer] button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [data-measure-footer] button:disabled:hover {
    background: var(--color-primary);
  }

  [data-measure-footer] button[data-secondary] {
    background: var(--color-surface);
    color: var(--color-muted);
    border: 1px solid var(--color-border);
  }
  [data-measure-footer] button[data-secondary]:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-surface); }

  [data-measure-footer] button[data-secondary]:disabled:hover {
    border-color: var(--color-border);
    color: var(--color-muted);
    background: var(--color-surface);
  }

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
    font-family: 'Geist', sans-serif;
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
    font-family: 'Geist', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-red);
    background: none;
    border: 1px solid var(--color-red-border);
    border-radius: var(--radius-sm);
    padding: 4px 10px;
    cursor: pointer;
    transition: background 0.15s;
  }
  [data-delete-btn]:hover { background: var(--color-red-soft); }

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
    font-family: 'Geist', sans-serif;
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
  [data-legend-green]  { color: var(--color-green); }
  [data-legend-yellow] { color: var(--color-amber); }
  [data-legend-red]    { color: var(--color-red); }

  /* ── DESIGN TOKENS ── */
  :root {
    /* Brand — deep blue primary (#094B8A), sky accent, teal/sage support */
    --color-primary:        #094b8a;
    --color-primary-dark:   #063764;
    --color-primary-soft:   #f4f9ff;
    --color-primary-border: #bcd7f0;
    --color-sky:            #3cacff;
    --color-secondary:      #1a857f;
    --color-secondary-soft: #eaf4f1;
    --color-sage:           #7cb6b1;
    --color-coral:          #44605c;   /* slate-green — chart comparison series only */
    --color-violet:         #7e90bc;   /* periwinkle — neuro domain, 3rd chart series */

    /* Status — muted, warm, harmonised with bone/cream neutrals */
    --color-green:          #2a6b4f;
    --color-green-soft:     #e3efe5;
    --color-green-border:   #9dc4a9;
    --color-amber:          #7a5d1e;
    --color-amber-soft:     #fff7d6;
    --color-amber-border:   #e3cc83;
    --color-amber-strong:   #c9a13b;
    --color-red:            #a13b30;
    --color-red-dark:       #7e2c24;
    --color-red-soft:       #f7e8e4;
    --color-red-border:     #dca293;

    /* Text — slate with a quiet green undertone (Neighbor palette) */
    --color-ink:            #1c2b36;
    --color-muted:          #334b49;
    --color-subtle:         #69787a;

    /* Surfaces — near-white with a warm cast: clinical, not beige */
    --color-bg:             #f8f8f2;
    --color-surface:        #ffffff;
    --color-surface-raised: #fbfbf7;
    --color-surface-soft:   #f6f6f0;
    --color-surface-muted:  #efefe6;
    --color-panel:          #fbfbf7;
    --color-border:         #d9dacb;
    --color-border-strong:  #a4a896;
    --color-line-strong:    #dedfd1;
    --color-line:           #e8e9dc;

    /* Shadows — warm slate, not blue */
    --shadow-sm:    0 1px 2px rgba(28,43,54,0.05), 0 1px 3px rgba(28,43,54,0.04);
    --shadow-card:  0 1px 2px rgba(28,43,54,0.04), 0 10px 22px -8px rgba(28,43,54,0.12);
    --shadow-md:    0 4px 16px rgba(28,43,54,0.10), 0 1px 4px rgba(28,43,54,0.06);

    /* Layout spine — one shared content column across every workspace */
    --content-max: 1280px;

    /* Radius */
    --radius-xs:    4px;
    --radius-sm:    6px;
    --radius-md:    10px;
    --radius-lg:    14px;
    --radius-full:  999px;
  }

  .app-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 286px minmax(0, 1fr);
    background: var(--color-bg);
  }

  .app-sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 28px 14px 18px;
    border-right: 1px solid var(--color-border);
    background: var(--color-surface);
    box-shadow: inset -1px 0 var(--color-border);
  }

  .app-sidebar__logo {
    margin: 0 8px 34px;
    max-width: 238px;
    overflow: hidden;
    font-size: 23px !important;
    gap: 0.16em;
  }

  .patient-switcher {
    display: grid;
    gap: 9px;
    margin: 0 2px 22px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface-raised);
  }

  .patient-switcher__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .patient-switcher__head .section-label {
    margin-bottom: 0;
  }

  .patient-switcher__head button {
    min-height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(9,75,138,0.24);
    border-radius: 8px;
    background: #fff;
    color: var(--color-primary);
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 12px;
    font-weight: 800;
  }

  .patient-switcher__select {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: #fff;
    color: var(--color-muted);
  }

  .patient-switcher__select select {
    min-width: 0;
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--color-ink);
    font-family: 'Geist', sans-serif;
    font-size: 14px;
    font-weight: 800;
  }

  .patient-switcher__select select:disabled {
    color: var(--color-subtle);
  }

  .patient-switcher__meta {
    overflow: hidden;
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-nav {
    display: grid;
    gap: 8px;
  }

  .app-nav__group-label {
    margin: 4px 12px 0;
    color: var(--color-subtle);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  .app-nav__group-label--separate {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
  }

  .app-nav button,
  .app-sidebar__settings,
  .profile-strip {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--color-ink);
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 15px;
    font-weight: 500;
    text-align: left;
  }

  .app-nav button {
    min-height: 58px;
  }

  .app-nav button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .app-nav button:disabled:hover {
    background: transparent;
  }

  .app-nav__copy {
    display: grid;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .app-nav__copy strong {
    overflow: hidden;
    font-size: 13.5px;
    font-weight: 600;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-nav__copy span {
    overflow: hidden;
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-badge {
    min-width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #fff;
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 800;
  }

  .app-nav button:hover,
  .app-sidebar__settings:hover,
  .profile-strip:hover {
    background: rgba(6,55,100,0.07);
  }

  .app-nav button[data-active] {
    background: var(--color-primary-soft);
    box-shadow: inset 3px 0 0 var(--color-primary);
    color: var(--color-primary-dark);
  }

  .app-nav button[data-active] .app-nav__copy strong {
    color: var(--color-primary-dark);
  }

  .app-nav button[data-active] .app-nav__copy span {
    color: var(--color-primary);
  }

  .app-nav button[data-active] .nav-badge {
    background: var(--color-primary);
    color: #fff;
  }

  .app-sidebar__bottom {
    min-width: 0;
    display: grid;
    gap: 10px;
    margin-top: auto;
    padding-top: 18px;
    border-top: 1px solid var(--color-border);
  }

  .profile-strip {
    justify-content: flex-start;
    min-height: 52px;
    min-width: 0;
    padding: 0 10px;
  }

  .profile-strip__avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    flex: 0 0 auto;
  }

  .profile-strip span.profile-strip__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: #fff;
    font-weight: 800;
  }

  .profile-strip__copy {
    min-width: 0;
    flex: 1;
    display: grid;
    gap: 2px;
  }

  .profile-strip__copy strong {
    overflow: hidden;
    color: var(--color-ink);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-strip__copy small {
    min-width: 0;
    overflow: hidden;
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-strip__chevron {
    flex: 0 0 auto;
    color: var(--color-muted);
  }

  .sidebar-signout {
    width: 100%;
    max-width: 100%;
    min-height: 34px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-muted);
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 600;
  }

  .sidebar-signout:hover {
    color: var(--color-primary);
    border-color: rgba(6,55,100,0.35);
  }

  .app-main {
    position: relative;
    min-width: 0;
    padding: 0 46px 64px 38px;
  }

  .app-main::before {
    display: none;
  }

  .app-main > * {
    position: relative;
    z-index: 1;
  }

  /* Page header — shares the content column's left edge and carries a
     divider spanning it, so the title reads as the workspace's header. */
  .page-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    width: min(100%, var(--content-max));
    margin: 0 0 24px;
    padding: 26px 0 18px;
    border-bottom: 1px solid var(--color-border);
  }

  .page-toolbar h1 {
    color: var(--color-ink);
    font-size: clamp(20px, 2.2vw, 26px);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.2px;
  }

  .app-shell--skeleton {
    color: transparent;
  }

  .skeleton-line,
  .skeleton-avatar,
  .skeleton-stat,
  .skeleton-hero,
  .skeleton-block {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    background: linear-gradient(90deg, #edede4 0%, #f7f7f1 46%, #edede4 100%);
    background-size: 220% 100%;
  }

  .skeleton-line {
    display: block;
    width: 100%;
    height: 14px;
  }

  .skeleton-line--short {
    width: 54%;
  }

  .skeleton-nav {
    width: 100%;
    height: 44px;
  }

  .skeleton-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 0 10px;
  }

  .skeleton-profile .skeleton-line {
    flex: 1;
  }

  .skeleton-avatar {
    display: block;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border-radius: 50%;
  }

  .skeleton-button {
    height: 34px;
  }

  .skeleton-title {
    width: min(52vw, 340px);
    height: 42px;
  }

  .skeleton-workspace {
    display: grid;
    grid-template-columns: minmax(260px, 330px) minmax(0, 1fr);
    gap: 18px;
  }

  .skeleton-directory,
  .skeleton-panel {
    border: 1px solid var(--color-line-strong);
    border-radius: 10px;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .skeleton-directory {
    display: grid;
    gap: 14px;
    align-content: start;
    padding: 18px;
  }

  .skeleton-heading {
    width: 44%;
    height: 18px;
    margin-bottom: 4px;
  }

  .skeleton-patient-row {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-height: 58px;
    padding: 10px 0;
    border-top: 1px solid rgba(222,223,209,0.72);
  }

  .skeleton-patient-row > span:last-child {
    display: grid;
    gap: 9px;
  }

  .skeleton-panel {
    display: grid;
    gap: 18px;
    align-content: start;
    padding: 22px;
  }

  .skeleton-hero {
    width: 100%;
    height: 148px;
  }

  .skeleton-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .skeleton-stat {
    display: block;
    height: 74px;
  }

  .skeleton-block {
    display: block;
    width: 100%;
    height: 132px;
  }

  .skeleton-block--small {
    height: 86px;
  }

  @media (prefers-reduced-motion: no-preference) {
    .skeleton-line,
    .skeleton-avatar,
    .skeleton-stat,
    .skeleton-hero,
    .skeleton-block {
      animation: skeleton-sheen 1.4s ease-in-out infinite;
    }
  }

  @keyframes skeleton-sheen {
    0% { background-position: 120% 0; }
    100% { background-position: -120% 0; }
  }

  .brand-iq-mark {
    color: rgba(96,176,250,0.42);
    font-family: 'Source Serif 4', Georgia, serif;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 0.84;
    pointer-events: none;
    user-select: none;
  }

  .patient-summary-card,
  .summary-card,
  .patient-directory-card > .patient-card {
    border: 1px solid var(--color-line-strong);
    border-radius: 10px;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .patient-summary-card {
    position: relative;
    overflow: hidden;
    padding: 18px;
    margin-bottom: 30px;
    border-radius: 10px;
    border-color: var(--color-line-strong);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .patient-summary-card > * {
    position: relative;
    z-index: 1;
  }

  .patient-summary-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  .patient-summary-card__intro .section-label {
    margin-bottom: 8px;
  }

  .patient-summary-card__intro h2 {
    color: var(--color-ink);
    font-size: clamp(26px, 2.8vw, 38px);
    font-weight: 700;
    line-height: 1.04;
    letter-spacing: -0.3px;
  }

  .patient-summary-card__intro p {
    max-width: 680px;
    margin-top: 8px;
    color: var(--color-muted);
    font-size: 14px;
  }

  .patient-summary-card__head h2,
  .summary-card h3 {
    color: var(--color-ink);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.1px;
  }

  .patient-summary-card__head button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 0 16px;
    border: 0;
    border-radius: 8px;
    background: var(--color-primary);
    box-shadow: 0 8px 18px rgba(6,55,100,0.22);
    color: #fff;
    cursor: pointer;
    font-weight: 700;
  }

  .patient-summary-card__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }

  .patient-summary-card__actions button[data-secondary] {
    border: 1px solid var(--color-border);
    background: rgba(255,255,255,0.84);
    box-shadow: none;
    color: var(--color-primary);
  }

  .patient-summary-card__actions button[data-secondary]:hover {
    border-color: rgba(9,75,138,0.3);
    background: #fff;
  }

  .patient-summary-card__body {
    display: grid;
    grid-template-columns: 160px 1.3fr 1px 1.35fr 1px 1.5fr 1px 1.2fr;
    align-items: center;
    gap: 24px;
  }

  .patient-photo {
    width: 160px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid var(--color-primary-border);
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: 44px;
    font-weight: 800;
  }

  .patient-identity h3 {
    color: var(--color-ink);
    font-size: 26px;
    font-weight: 800;
    line-height: 1.05;
  }

  .patient-identity p,
  .summary-block small {
    color: var(--color-muted);
    font-size: 14px;
  }

  .summary-divider {
    width: 1px;
    height: 74px;
    background: var(--color-border);
  }

  .summary-block {
    min-width: 0;
  }

  .summary-block span {
    display: block;
    margin-bottom: 7px;
    color: var(--color-subtle);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .summary-block strong {
    display: block;
    color: var(--color-ink);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.15;
    font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .summary-block em {
    display: inline-flex;
    padding: 4px 10px;
    border: 1px solid var(--color-amber-border);
    border-radius: 999px;
    background: var(--color-amber-soft);
    color: var(--color-amber);
    font-size: 12px;
    font-style: normal;
    font-weight: 800;
  }

  .mini-progress {
    width: min(100%, 164px);
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--color-surface-muted);
  }

  .mini-progress i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--color-secondary);
  }

  .summary-dashboard {
    display: grid;
    gap: 32px;
  }

  .summary-card {
    padding: 20px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .summary-card--wide {
    min-height: 330px;
  }

  .summary-card--anchor {
    border-color: var(--color-line-strong);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .dashboard-zone {
    display: grid;
    gap: 14px;
    padding-top: 26px;
    border-top: 1px solid rgba(213,214,198,0.76);
  }

  .dashboard-zone:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .dashboard-zone__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
  }

  .dashboard-zone__head h2 {
    margin-top: 5px;
    color: var(--color-ink);
    font-size: 20px;
    font-weight: 800;
    line-height: 1.15;
  }

  .dashboard-zone__head p {
    max-width: 520px;
    margin: 0;
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.5;
    text-align: right;
  }

  .dashboard-progress-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(320px, 0.92fr);
    gap: 18px;
    align-items: stretch;
  }

  .dashboard-review-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }

  .dashboard-signals-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 18px;
  }

  .dashboard-records-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.75fr);
    gap: 18px;
    align-items: start;
  }

  .dashboard-records-side {
    display: grid;
    gap: 14px;
  }

  .letter-summary-card {
    border-color: var(--color-border);
    background: var(--color-surface-raised);
  }

  .letter-summary-card .summary-card__head {
    margin-bottom: 14px;
  }

  .letter-summary-card .summary-card__head button {
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: rgba(255,255,255,0.86);
    color: var(--color-primary);
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 12px;
    font-weight: 800;
  }

  .letter-summary-card .summary-card__head button:hover {
    border-color: rgba(6,55,100,0.32);
    background: #fff;
  }

  .letter-summary-card > p {
    max-width: 1100px;
    margin: 0;
    color: var(--color-muted);
    font-size: 15px;
    line-height: 1.75;
  }

  .pathway-panel {
    border-color: var(--color-border);
    background: var(--color-surface-raised);
  }

  .dashboard-progress-grid .pathway-panel {
    display: grid;
    align-content: start;
  }

  .dashboard-progress-grid .pathway-actions {
    grid-template-columns: 1fr;
  }

  .pathway-score {
    min-width: 150px;
    text-align: right;
  }

  .pathway-score strong {
    display: block;
    color: var(--color-primary);
    font-size: 28px;
    font-weight: 800;
  }

  .pathway-score span {
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 700;
  }

  .pathway-progress {
    height: 10px;
    margin: 16px 0;
    overflow: hidden;
    border: 1px solid rgba(96,176,250,0.34);
    border-radius: 999px;
    background: rgba(244,249,255,0.92);
  }

  .pathway-progress i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  }

  .pathway-explainer {
    display: grid;
    gap: 5px;
    margin-bottom: 14px;
    padding: 12px;
    border: 1px solid rgba(96,176,250,0.34);
    border-radius: 8px;
    background: var(--color-surface);
  }

  .pathway-explainer strong {
    color: var(--color-ink);
    font-size: 13px;
    font-weight: 800;
  }

  .pathway-explainer p,
  .pathway-explainer small {
    margin: 0;
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .pathway-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .pathway-actions article {
    min-height: 104px;
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
  }

  .pathway-actions article[data-tone="due"] {
    border-color: var(--color-amber-border);
    background: var(--color-amber-soft);
  }

  .pathway-actions span {
    display: block;
    color: var(--color-primary);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  .pathway-actions strong {
    display: block;
    margin-top: 6px;
    color: var(--color-ink);
    font-size: 15px;
    font-weight: 800;
  }

  .pathway-actions p {
    margin-top: 8px;
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .pathway-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .pathway-chip-row span,
  [data-pathway-badge] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 24px;
    padding: 0 9px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    color: var(--color-primary);
    font-size: 10px;
    font-weight: 800;
  }

  .pathway-chip-row span[data-state="missing"],
  [data-pathway-badge="missing"] {
    border-color: var(--color-border);
    background: var(--color-primary-soft);
  }

  .pathway-chip-row span[data-state="due"],
  [data-pathway-badge="due"] {
    border-color: var(--color-amber-border);
    background: var(--color-amber-soft);
    color: var(--color-amber);
  }

  .summary-card__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .summary-card__head select {
    min-width: 260px;
    min-height: 38px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-ink);
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 700;
  }

  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    color: var(--color-muted);
    font-size: 12px;
  }

  .chart-legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .chart-legend span::before,
  .bar-legend span::before {
    content: '';
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--color-secondary);
  }

  .chart-legend [data-tone="coral"]::before,
  .bar-legend span:last-child::before { background: var(--color-coral); }
  .chart-legend [data-tone="mist"]::before { background: var(--color-violet); }

  .trajectory-chart {
    width: 100%;
    height: 224px;
    margin-top: 6px;
    display: block;
  }

  .trend-chart-panel {
    margin-top: 12px;
  }

  .trend-chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface-raised);
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 800;
  }

  .trend-chart-legend__title {
    color: var(--color-ink);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .trend-chart-legend span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }

  .trend-chart-legend i {
    width: 24px;
    height: 4px;
    border-radius: 999px;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.86);
  }

  .trend-chart-legend i[data-mcid-marker] {
    width: 13px;
    height: 13px;
    border: 3px solid var(--color-green);
    background: #fff;
    border-radius: 50%;
  }

  .trajectory-chart line,
  .pain-trend line {
    stroke: var(--color-line-strong);
    stroke-width: 1;
  }

  .trajectory-chart text,
  .pain-trend text {
    fill: var(--color-muted);
    font-size: 12px;
  }

  .trajectory-chart path[data-line] {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .trajectory-chart path[data-line="progress"] { stroke: var(--color-secondary); }
  .trajectory-chart path[data-line="coral"] { stroke: var(--color-coral); }
  .trajectory-chart path[data-line="mist"] { stroke: var(--color-violet); }
  .trajectory-chart polyline[data-line="progress"] { fill: none; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .trajectory-chart circle[data-mcid] { stroke: var(--color-green); stroke-width: 3; }

  .summary-grid {
    display: grid;
    grid-template-columns: 1.25fr 0.9fr 1.1fr 1.15fr;
    gap: 18px;
  }

  .bar-legend {
    display: flex;
    justify-content: center;
    gap: 22px;
    margin: 14px 0 8px;
    color: var(--color-ink);
    font-size: 12px;
    font-weight: 700;
  }

  .bar-legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .bar-stage {
    height: 188px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: end;
    gap: 12px;
    padding-top: 16px;
    background-image: linear-gradient(var(--color-line-strong) 1px, transparent 1px);
    background-size: 100% 25%;
  }

  .bar-pair {
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
    gap: 4px;
    position: relative;
    padding-bottom: 22px;
  }

  .bar-pair i,
  .bar-pair b {
    min-height: 16px;
    border-radius: 4px 4px 0 0;
  }

  .bar-pair i { background: var(--color-secondary); }
  .bar-pair b { background: var(--color-coral); }
  .bar-pair small {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    color: var(--color-muted);
    font-size: 12px;
    text-align: center;
  }

  .activity-mix {
    display: grid;
    justify-items: center;
    gap: 16px;
    margin-top: 18px;
  }

  .donut {
    width: 120px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: conic-gradient(var(--color-secondary) 0 38%, var(--color-amber-border) 38% 66%, var(--color-coral) 66% 83%, var(--color-violet) 83% 100%);
    position: relative;
  }

  .donut::after {
    content: '';
    position: absolute;
    inset: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
  }

  .activity-lines {
    width: 100%;
    display: grid;
    gap: 10px;
  }

  .activity-lines strong {
    display: grid;
    grid-template-columns: 44px 1fr;
    align-items: center;
    color: var(--color-ink);
    font-size: 15px;
  }

  .activity-lines span {
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 500;
  }

  .activity-lines strong::after {
    content: '';
    height: 28px;
    border-radius: 8px;
    border: 1px solid var(--color-sage);
    background: var(--color-secondary-soft);
  }

  .pain-trend {
    width: 100%;
    height: 210px;
    margin-top: 10px;
  }

  .pain-trend path:first-of-type {
    fill: rgba(126,144,188,0.2);
  }

  .pain-trend path[data-line] {
    fill: none;
    stroke: var(--color-coral);
    stroke-width: 3;
  }

  .detail-list {
    display: grid;
    gap: 12px;
    margin-top: 18px;
  }

  .detail-list div {
    display: grid;
    grid-template-columns: 1fr auto 18px;
    column-gap: 10px;
    align-items: center;
  }

  .detail-list strong {
    color: var(--color-ink);
    font-size: 13px;
  }

  .detail-list span {
    color: var(--color-ink);
    font-size: 13px;
    font-weight: 800;
  }

  .detail-list small,
  .detail-list em {
    color: var(--color-muted);
    font-size: 12px;
    font-style: normal;
  }

  .detail-list i {
    grid-row: span 2;
    color: var(--color-secondary);
    font-style: normal;
    font-weight: 800;
  }

  .assessment-history h3 {
    margin-bottom: 14px;
  }

  .assessment-history .result-box {
    border-radius: 8px;
    box-shadow: none;
  }

  .patient-summary-card__head > div {
    min-width: 0;
  }

  .patient-summary-card__head > div:not(.patient-summary-card__intro) p {
    margin-top: 4px;
    color: var(--color-ink);
    font-size: 22px;
    font-weight: 800;
  }

  .patient-summary-card__head button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .patient-summary-card__body--real {
    grid-template-columns: minmax(220px, 1.35fr) repeat(5, minmax(138px, 1fr));
    gap: 12px;
  }

  .patient-summary-card__body--real .patient-identity,
  .patient-summary-card__body--real .summary-block {
    min-height: 90px;
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
  }

  .patient-identity {
    display: grid;
    align-content: space-between;
    gap: 10px;
    background: var(--color-surface-raised) !important;
  }

  .patient-identity__mark {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    min-height: 36px;
  }

  .patient-identity__mark span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--color-primary);
    color: #fff;
    font-size: 18px;
    font-weight: 800;
  }

  .patient-identity__iq {
    align-self: center;
    color: rgba(96,176,250,0.78);
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 26px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1;
  }

  .patient-identity > strong {
    color: var(--color-ink);
    font-size: 16px;
    font-weight: 800;
  }

  .domain-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .domain-card {
    min-height: 172px;
    display: grid;
    align-content: start;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface);
    box-shadow: none;
  }

  .domain-card[data-tone="green"] { background: var(--color-green-soft); border-color: var(--color-green-border); }
  .domain-card[data-tone="amber"] { background: var(--color-amber-soft); border-color: var(--color-amber-border); }
  .domain-card[data-tone="red"] { background: var(--color-red-soft); border-color: var(--color-red-border); }

  .domain-card__top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .domain-card__top span,
  .domain-card small {
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .domain-card strong {
    color: var(--color-ink);
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.4px;
    font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .domain-card[data-tone="green"] strong { color: var(--color-green); }
  .domain-card[data-tone="amber"] strong { color: var(--color-amber); }
  .domain-card[data-tone="red"] strong { color: var(--color-red); }

  .domain-card p {
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .summary-card__head p {
    margin-top: 4px;
    color: var(--color-muted);
    font-size: 13px;
  }

  .trajectory-chart path[data-zone="good"] {
    fill: rgba(96,176,250,0.16);
  }

  .trajectory-chart circle {
    stroke: #fff;
    stroke-width: 2;
  }

  .summary-grid--real {
    grid-template-columns: 1.35fr 1fr 1fr;
  }

  .insight-card {
    position: relative;
    overflow: hidden;
    border-color: var(--color-border);
    background: var(--color-surface);
  }

  .insight-card::before {
    display: none;
  }

  .insight-card > * {
    position: relative;
  }

  .interpretation-list {
    display: grid;
    gap: 12px;
    margin-top: 16px;
  }

  .interpretation-list article {
    padding: 14px 16px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface-raised);
    box-shadow: none;
  }

  .interpretation-list article[data-tone="priority"] {
    border-color: var(--color-red-border);
    background: var(--color-red-soft);
  }

  .interpretation-list article[data-tone="trend"] {
    border-color: var(--color-border);
    background: var(--color-primary-soft);
  }

  .interpretation-list article[data-tone="neuro"] {
    border-color: #c3cce0;
    background: #f2f4f9;
  }

  .interpretation-list article[data-tone="steady"] {
    border-color: var(--color-green-border);
    background: var(--color-green-soft);
  }

  .interpretation-list span {
    display: block;
    margin-bottom: 6px;
    color: var(--color-subtle);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }

  .interpretation-list p {
    margin: 0;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.6;
  }

  .signal-list,
  .latest-list,
  .history-list {
    display: grid;
    gap: 12px;
    margin-top: 16px;
  }

  .signal-list div,
  .signal-list button,
  .latest-list div,
  .latest-list button {
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface-raised);
  }

  .signal-list button,
  .latest-list button {
    width: 100%;
    cursor: pointer;
    font: inherit;
    text-align: left;
  }

  .signal-list button:hover,
  .latest-list button:hover {
    border-color: rgba(6,55,100,0.3);
    background: rgba(244,249,255,0.7);
  }

  .signal-list div,
  .signal-list button {
    border-color: var(--color-border);
  }

  .signal-list div[data-tone="amber"],
  .signal-list button[data-tone="amber"] {
    border-color: var(--color-amber-border);
    background: var(--color-amber-soft);
  }
  .signal-list div[data-tone="red"],
  .signal-list button[data-tone="red"] {
    border-color: var(--color-red-border);
    background: var(--color-red-soft);
  }

  .signal-list strong,
  .latest-list strong {
    color: var(--color-ink);
    font-size: 13px;
  }

  .signal-list span,
  .latest-list span {
    float: right;
    color: var(--color-ink);
    font-size: 13px;
    font-weight: 800;
  }

  .signal-list p,
  .latest-list small {
    display: block;
    clear: both;
    margin-top: 6px;
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .assessment-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 18px;
    margin-top: 12px;
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .assessment-detail-grid strong {
    color: var(--color-ink);
    font-size: 12px;
  }

  .result-box[data-tone="green"] {
    border-color: var(--color-green-border);
    background: var(--color-green-soft);
  }
  .result-box[data-tone="amber"] {
    border-color: var(--color-amber-border);
    background: var(--color-amber-soft);
  }
  .result-box[data-tone="red"] {
    border-color: var(--color-red-border);
    background: var(--color-red-soft);
  }

  .empty-chart {
    min-height: 224px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    border: 1px dashed var(--color-border);
    border-radius: 8px;
    color: var(--color-muted);
    font-size: 14px;
    text-align: center;
  }

  .patient-management-card {
    display: grid;
    align-items: start;
    justify-content: space-between;
    gap: 18px;
  }

  .patient-management-card button {
    justify-self: start;
  }

  .patient-management-card p {
    margin-top: 6px;
    color: var(--color-muted);
    font-size: 13px;
  }

  .today-assessment-card {
    overflow-x: auto;
  }

  .dashboard-mcid-reference {
    margin: 0;
    border-radius: 8px;
    background: rgba(244,249,255,0.78);
  }

  .copy-summary-btn,
  [data-save-encounter] {
    min-height: 38px;
    padding: 0 16px;
    border: 0;
    border-radius: 8px;
    background: var(--color-primary);
    box-shadow: 0 8px 18px rgba(6,55,100,0.18);
    color: #fff;
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 800;
  }

  .copy-summary-btn:disabled,
  [data-save-encounter]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .today-summary-table {
    width: 100%;
    min-width: 720px;
    margin-top: 16px;
    border-collapse: collapse;
    font-size: 13px;
  }

  .today-summary-table th {
    padding: 8px 10px;
    border-bottom: 2px solid var(--color-border);
    color: var(--color-subtle);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-align: left;
    text-transform: uppercase;
  }

  .today-summary-table td {
    padding: 10px;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-muted);
    vertical-align: top;
  }

  .today-summary-table td:first-child,
  .today-summary-table td:nth-child(2) {
    color: var(--color-ink);
    font-weight: 800;
  }

  [data-encounter-draft] {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    padding: 10px 12px;
    border: 1px solid rgba(96,176,250,0.48);
    border-radius: 10px;
    background: rgba(214,237,255,0.66);
    color: var(--color-primary-dark);
    font-size: 13px;
  }

  [data-encounter-draft] span {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    padding: 0 9px;
    border-radius: 999px;
    background: rgba(255,255,255,0.82);
    color: var(--color-primary);
    font-weight: 800;
  }

  [data-assessment-save-status] {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid var(--color-primary-border);
    border-radius: 10px;
    background: var(--color-primary-soft);
    color: var(--color-primary-dark);
  }

  [data-assessment-save-status][data-state="saved"] {
    border-color: var(--color-green-border);
    background: var(--color-green-soft);
    color: var(--color-green);
  }

  [data-assessment-save-icon] {
    width: 32px;
    height: 32px;
    display: inline-flex;
    flex: 0 0 32px;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-primary);
    font-size: 18px;
    font-weight: 800;
  }

  [data-assessment-save-status][data-state="saved"] [data-assessment-save-icon] {
    border-color: var(--color-green-border);
    background: #ffffff;
    color: var(--color-green);
  }

  [data-assessment-save-status] strong,
  [data-assessment-save-status] p {
    margin: 0;
  }

  [data-assessment-save-status] strong {
    display: block;
    font-size: 13px;
    font-weight: 800;
  }

  [data-assessment-save-status] p {
    margin-top: 2px;
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.4;
  }

  [data-assessment-form-instance] {
    transition: opacity 0.18s ease, filter 0.18s ease;
  }

  [data-assessment-form-instance][data-saving] {
    opacity: 0.72;
    filter: saturate(0.92);
    pointer-events: none;
  }

  [data-measure-tabs] button:disabled,
  [data-measure-btn]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .isncsci-summary-table {
    margin-top: 18px;
  }

  .isncsci-summary-table h4 {
    color: var(--color-ink);
    font-size: 14px;
    font-weight: 800;
  }

  .workspace-shell,
  .reports-workspace {
    width: min(100%, var(--content-max));
    margin: 0;
  }

  .workspace-shell {
    display: grid;
    gap: 24px;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .workspace-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .workspace-head h2 {
    color: var(--color-ink);
    font-size: clamp(24px, 2.6vw, 32px);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.3px;
  }

  .workspace-head p {
    margin-top: 8px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.45;
  }

  .workspace-head__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
  }

  .workspace-head button,
  .next-action-panel button,
  .directory-quick-actions button,
  .summary-card__head button,
  .pathway-action-grid button {
    min-height: 38px;
    padding: 0 16px;
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--color-primary);
    box-shadow: 0 1px 3px rgba(28,43,54,0.12);
    color: #fff;
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 700;
  }

  .workspace-head button.secondary-action,
  .directory-quick-actions button + button {
    border: 1px solid var(--color-border-strong);
    background: #fff;
    box-shadow: none;
    color: var(--color-ink);
  }

  .summary-card__head button {
    min-height: 30px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    background: transparent;
    box-shadow: none;
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 600;
  }

  .workspace-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .workspace-stat-grid div {
    min-height: 80px;
    padding: 16px 18px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .workspace-stat-grid span {
    display: block;
    color: var(--color-subtle);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .workspace-stat-grid strong {
    display: block;
    margin-top: 6px;
    color: var(--color-ink);
    font-size: 20px;
    font-weight: 700;
    line-height: 1.16;
    letter-spacing: -0.2px;
  }

  .next-action-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 20px 22px;
    border: 1px solid var(--color-primary-border);
    border-radius: var(--radius-lg);
    background: var(--color-primary-soft);
    box-shadow: var(--shadow-card);
  }

  .next-action-panel[data-tone="good"] {
    background: var(--color-green-soft);
    border-color: var(--color-green-border);
  }

  .next-action-panel[data-tone="attention"],
  .next-action-panel[data-tone="due"] {
    background: var(--color-amber-soft);
    border-color: var(--color-amber-border);
  }

  .next-action-panel h3 {
    margin: 0;
    color: var(--color-ink);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.2px;
  }

  .next-action-panel p {
    max-width: 780px;
    margin-top: 6px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.45;
  }

  .directory-focus-panel {
    align-content: start;
    min-height: 360px;
  }

  .directory-quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
    grid-template-areas:
      "next-action next-action"
      "stats       stats"
      "signal      measures"
      "followup    measures";
    gap: 16px;
    align-items: start;
  }

  .overview-next-action { grid-area: next-action; }
  .overview-meta-strip  { grid-area: stats; }
  .overview-card--signal  { grid-area: signal; }
  .overview-card--measures { grid-area: measures; }
  .overview-card--followup { grid-area: followup; }

  .overview-meta-strip {
    display: flex;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }

  .overview-meta-strip > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 20px;
    border-right: 1px solid var(--color-line);
  }

  .overview-meta-strip > div:last-child {
    border-right: none;
  }

  .overview-meta-strip strong {
    display: block;
    color: var(--color-ink);
    font-size: 20px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.3px;
  }

  .overview-meta-strip span {
    display: block;
    color: var(--color-subtle);
    font-size: 11px;
    font-weight: 500;
  }

  .overview-card {
    padding: 20px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .overview-signal {
    margin-top: 16px;
    padding: 14px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
  }

  .overview-signal[data-tone="red"] {
    background: var(--color-red-soft);
  }

  .overview-signal[data-tone="amber"] {
    background: var(--color-amber-soft);
  }

  .overview-signal strong,
  .overview-signal span {
    display: inline-block;
    margin-right: 10px;
    color: var(--color-ink);
    font-weight: 800;
  }

  .overview-signal p {
    margin-top: 8px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.5;
  }

  .overview-measure-list {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }

  .overview-measure-list button {
    display: grid;
    grid-template-columns: 72px minmax(90px, 0.5fr) minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    min-height: 58px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface-raised);
    cursor: pointer;
    text-align: left;
  }

  .overview-measure-list span {
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 800;
  }

  .overview-measure-list strong {
    color: var(--color-ink);
    font-size: 14px;
    font-weight: 800;
  }

  .overview-measure-list em {
    overflow: hidden;
    color: var(--color-muted);
    font-size: 12px;
    font-style: normal;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pathway-workspace {
    gap: 22px;
  }

  .pathway-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    padding: 20px;
    border: 1px solid var(--color-primary-border);
    border-radius: var(--radius-lg);
    background: var(--color-primary-soft);
    box-shadow: var(--shadow-card);
  }

  .pathway-hero[data-tone="good"] {
    background: var(--color-green-soft);
    border-color: var(--color-green-border);
  }

  .pathway-hero[data-tone="attention"],
  .pathway-hero[data-tone="due"] {
    background: var(--color-amber-soft);
    border-color: var(--color-amber-border);
  }

  .pathway-hero h3 {
    margin: 0;
    color: var(--color-ink);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  .pathway-hero p {
    max-width: 780px;
    margin-top: 8px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.5;
  }

  .pathway-coverage {
    min-width: 156px;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: #fff;
    text-align: center;
  }

  .pathway-coverage strong {
    display: block;
    color: var(--color-primary);
    font-size: 34px;
    font-weight: 800;
    line-height: 1;
  }

  .pathway-coverage span {
    display: block;
    margin-top: 8px;
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .pathway-action-grid,
  .pathway-measure-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .pathway-action-grid article,
  .pathway-measure-column {
    display: grid;
    align-content: start;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .pathway-action-grid article {
    border-top: 1px solid var(--color-border);
  }

  .pathway-action-grid article[data-tone="attention"],
  .pathway-action-grid article[data-tone="due"] {
    background: var(--color-amber-soft);
    border-color: var(--color-amber-border);
  }

  .pathway-action-grid article[data-tone="good"] {
    background: var(--color-green-soft);
    border-color: var(--color-green-border);
  }

  .pathway-action-grid span {
    color: var(--color-subtle);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pathway-action-grid strong,
  .pathway-measure-column h3 {
    color: var(--color-ink);
    font-size: 16px;
    font-weight: 800;
  }

  .pathway-action-grid p {
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .pathway-action-grid button {
    justify-self: start;
  }

  .pathway-measure-column button {
    display: grid;
    gap: 3px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;
  }

  .pathway-measure-column button:hover {
    border-color: rgba(9,75,138,0.28);
    background: var(--color-primary-soft);
  }

  .pathway-measure-column button[data-state="missing"],
  .pathway-measure-column button[data-state="due"] {
    background: var(--color-amber-soft);
    border-color: var(--color-amber-border);
  }

  .pathway-measure-column button[data-state="recorded"] {
    background: var(--color-green-soft);
    border-color: var(--color-green-border);
  }

  .pathway-measure-column span {
    color: var(--color-primary);
    font-size: 13px;
    font-weight: 800;
  }

  .pathway-measure-column strong {
    color: var(--color-ink);
    font-size: 13px;
    font-weight: 800;
  }

  .pathway-measure-column em {
    color: var(--color-muted);
    font-size: 12px;
    font-style: normal;
  }

  .outcome-measures-workspace {
    display: grid;
    gap: 14px;
    width: min(100%, var(--content-max));
    margin: 0;
  }

  .measure-priority-strip {
    width: min(100%, 1320px);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0 auto;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface);
  }

  .measure-priority-strip > span {
    margin-right: 4px;
    color: var(--color-subtle);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .measure-priority-strip button {
    min-height: 30px;
    padding: 0 11px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: #fff;
    color: var(--color-primary);
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 12px;
    font-weight: 800;
  }

  .measure-priority-strip button[data-state="due"],
  .measure-priority-strip button[data-state="missing"] {
    color: var(--color-amber);
    border-color: var(--color-amber-border);
    background: var(--color-amber-soft);
  }

  .measure-priority-strip button[data-active] {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    color: var(--color-primary-dark);
  }

  .followup-workspace {
    gap: 18px;
  }

  .followup-workspace .workspace-head button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .followup-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .followup-stat-grid > div,
  .followup-report-grid > div {
    display: grid;
    gap: 6px;
    min-height: 82px;
    padding: 16px 18px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface);
  }

  .followup-stat-grid span,
  .followup-report-grid span {
    color: var(--color-subtle);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .followup-stat-grid strong,
  .followup-report-grid strong {
    color: var(--color-ink);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.18;
    font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: -0.3px;
    overflow-wrap: anywhere;
  }

  .followup-stat-grid small {
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.35;
  }

  .followup-attention-panel,
  .followup-create-panel,
  .followup-link-panel,
  .followup-empty-panel,
  .followup-report-section {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface);
  }

  .followup-attention-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 18px;
    box-shadow: inset 0 0 0 1px rgba(9,75,138,0.06);
  }

  .directory-stack {
    display: grid;
    gap: 16px;
    align-items: start;
    width: min(100%, var(--content-max));
    margin: 0;
  }

  .followup-attention-board .summary-card__head > span[data-attention] {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border: 1px solid var(--color-amber-border);
    border-radius: 999px;
    background: var(--color-amber-soft);
    color: var(--color-amber);
    font-size: 12px;
    font-weight: 800;
  }

  .followup-attention-board .summary-card__head > span[data-attention="red"] {
    border-color: var(--color-red-border);
    background: var(--color-red-soft);
    color: var(--color-red);
  }

  .followup-attention-board__list {
    display: grid;
    gap: 10px;
  }

  .followup-attention-board__list article {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface-raised);
  }

  .followup-attention-board__list article[data-attention="amber"] {
    border-color: var(--color-amber-border);
    background: var(--color-amber-soft);
  }

  .followup-attention-board__list article[data-attention="red"] {
    border-color: var(--color-red-border);
    background: var(--color-red-soft);
  }

  .followup-attention-board__list article strong {
    display: block;
    color: var(--color-ink);
    font-size: 15px;
    font-weight: 800;
  }

  .followup-attention-board__list article > div:first-child span {
    display: block;
    margin-top: 2px;
    color: var(--color-muted);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .followup-attention-board__list article p {
    margin: 0;
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .followup-attention-board__list article small {
    color: var(--color-subtle);
    font-size: 12px;
  }

  .followup-attention-board__list article button {
    min-height: 34px;
    padding: 0 13px;
    border: 0;
    border-radius: 8px;
    background: var(--color-primary);
    color: #fff;
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 800;
  }

  .provenance-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 9px;
    border: 1px solid #c3cce0;
    border-radius: 999px;
    background: #f2f4f9;
    color: var(--color-violet);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .followup-timeline article p[data-direction="declined"],
  .followup-attention-panel p[data-direction="declined"],
  .followup-report-concern[data-direction="declined"] {
    color: var(--color-red);
    font-weight: 600;
  }

  @media (max-width: 760px) {
    .followup-attention-board__list article {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .followup-attention-panel[data-attention="amber"] {
    background: var(--color-amber-soft);
    border-color: var(--color-amber-border);
  }

  .followup-attention-panel[data-attention="red"] {
    background: var(--color-red-soft);
    border-color: var(--color-red-border);
  }

  .followup-attention-panel h3,
  .followup-create-panel h3 {
    margin: 0;
    color: var(--color-ink);
    font-size: 18px;
    font-weight: 800;
  }

  .followup-attention-panel p,
  .followup-create-panel p {
    margin-top: 6px;
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.45;
  }

  .followup-attention-panel button,
  .followup-create-panel button,
  .followup-link-panel button,
  .followup-timeline article button {
    min-height: 36px;
    padding: 0 13px;
    border: 0;
    border-radius: 8px;
    background: var(--color-primary);
    color: #fff;
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 800;
  }

  .followup-create-panel {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 14px;
    align-items: end;
    padding: 18px;
  }

  .followup-create-panel > * {
    min-width: 0;
  }

  .followup-create-panel > div:first-child {
    grid-column: span 3;
  }

  .followup-create-panel label:first-of-type {
    grid-column: span 3;
  }

  .followup-create-panel label {
    grid-column: span 2;
  }

  .followup-create-panel label {
    display: grid;
    gap: 7px;
    min-width: 0;
  }

  .followup-create-panel label span {
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .followup-email-target {
    display: grid;
    grid-column: span 2;
    gap: 5px;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface-raised);
  }

  .followup-email-target span {
    color: var(--color-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .followup-email-target strong {
    color: var(--color-ink);
    font-size: 13px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .followup-email-target small {
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.35;
  }

  .followup-create-actions {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(150px, max-content));
    justify-content: end;
    gap: 8px;
    min-width: 0;
  }

  .followup-create-actions button[data-secondary] {
    border: 1px solid var(--color-border);
    background: #fff;
    color: var(--color-primary);
  }

  .followup-create-panel button:disabled,
  .followup-link-panel button:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .followup-empty-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
    background: var(--color-surface-raised);
  }

  .followup-empty-panel strong {
    color: var(--color-ink);
    font-size: 14px;
    font-weight: 800;
  }

  .followup-empty-panel p {
    margin: 3px 0 0;
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .followup-empty-panel button {
    min-height: 36px;
    flex: 0 0 auto;
    padding: 0 13px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: #fff;
    color: var(--color-primary);
    cursor: pointer;
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 800;
  }

  .followup-link-panel {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 12px;
    background: var(--color-surface-raised);
  }

  .followup-link-panel input {
    width: 100%;
    min-width: 0;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: #fff;
    color: var(--color-ink);
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    padding: 9px 10px;
  }

  .followup-link-panel button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .followup-inline-error {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--color-red-border);
    border-radius: 8px;
    background: var(--color-red-soft);
    color: var(--color-red);
    font-size: 13px;
    font-weight: 700;
  }

  .followup-inline-success {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--color-green-border);
    border-radius: 8px;
    background: var(--color-green-soft);
    color: var(--color-green);
    font-size: 13px;
    font-weight: 700;
  }

  .followup-timeline {
    display: grid;
    gap: 10px;
  }

  .followup-timeline h3 {
    color: var(--color-ink);
    font-size: 17px;
    font-weight: 800;
  }

  .followup-timeline article {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) minmax(120px, auto);
    gap: 12px;
    align-items: start;
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface-raised);
  }

  .followup-timeline article[data-attention="amber"] {
    background: var(--color-amber-soft);
    border-color: var(--color-amber-border);
  }

  .followup-timeline article[data-attention="red"] {
    background: var(--color-red-soft);
    border-color: var(--color-red-border);
  }

  .followup-row__icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #fff;
    color: var(--color-primary);
  }

  .followup-timeline article span {
    color: var(--color-primary);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .followup-timeline article strong {
    display: block;
    margin-top: 4px;
    color: var(--color-ink);
    font-size: 14px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .followup-timeline article p,
  .followup-timeline article small {
    display: block;
    margin-top: 4px;
    color: var(--color-muted);
    font-size: 12px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .followup-timeline article button {
    border: 1px solid var(--color-border);
    background: #fff;
    color: var(--color-primary);
    justify-self: end;
    white-space: nowrap;
  }

  .followup-row-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
  }

  .followup-row-actions button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  .followup-skeleton {
    display: block;
    height: 66px;
    border-radius: 10px;
    background: linear-gradient(90deg, #edede4 0%, #f7f7f1 46%, #edede4 100%);
    background-size: 220% 100%;
  }

  .followup-overview-status {
    display: grid;
    gap: 8px;
    margin-top: 16px;
    padding: 14px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
  }

  .followup-overview-status[data-attention="amber"] {
    background: var(--color-amber-soft);
  }

  .followup-overview-status[data-attention="red"] {
    background: var(--color-red-soft);
  }

  .followup-overview-status span,
  .followup-report-section [data-attention] {
    justify-self: start;
    padding: 5px 9px;
    border-radius: 999px;
    background: var(--color-primary-soft);
    color: var(--color-primary-dark);
    font-size: 11px;
    font-weight: 800;
  }

  .followup-overview-status strong {
    color: var(--color-ink);
    font-size: 14px;
    line-height: 1.45;
  }

  .followup-overview-status p {
    margin: 0;
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .followup-report-section {
    display: grid;
    gap: 14px;
    margin: 0 auto 20px;
    padding: 20px;
  }

  .followup-report-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .followup-report-concern {
    margin: 0;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface-raised);
    color: var(--color-muted);
    font-size: 14px;
    line-height: 1.5;
  }

  .patients-workspace {
    display: grid;
    grid-template-columns: minmax(360px, 520px) minmax(0, 1fr);
    gap: 22px;
    align-items: start;
  }

  .patients-workspace .patient-directory-card > .patient-card {
    max-width: none;
  }

  .patient-workspace-panel {
    position: relative;
    overflow: hidden;
    min-height: 360px;
    padding: 24px;
    border: 1px solid var(--color-line-strong);
    border-radius: 10px;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .patient-workspace-hero {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
  }

  .patient-workspace-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: 18px;
    background: var(--color-primary);
    box-shadow: 0 1px 2px rgba(6,55,100,0.22);
    color: #fff;
    font-size: 30px;
    font-weight: 800;
  }

  .patient-workspace-iq,
  .patient-workspace-empty__iq {
    justify-self: end;
  }

  .patient-workspace-iq {
    color: rgba(96,176,250,0.44);
    font-size: 58px;
  }

  .patient-workspace-panel h2 {
    color: var(--color-ink);
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 800;
    line-height: 1;
  }

  .patient-workspace-panel p {
    margin-top: 8px;
    color: var(--color-muted);
    font-size: 14px;
  }

  .patient-workspace-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 22px;
  }

  .patient-workspace-stats div,
  .patient-workspace-recent div {
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface-raised);
  }

  .patient-workspace-stats strong {
    display: block;
    margin-top: 6px;
    color: var(--color-ink);
    font-size: 22px;
    font-weight: 800;
  }

  .patient-workspace-stats span,
  .patient-workspace-recent span {
    display: block;
    margin-top: 4px;
    color: var(--color-muted);
    font-size: 12px;
  }

  .pathway-mini-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 16px;
    padding: 14px;
    border: 1px solid rgba(96,176,250,0.38);
    border-radius: 10px;
    background: var(--color-surface-raised);
  }

  .pathway-mini-card span {
    display: block;
    color: var(--color-primary);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  .pathway-mini-card strong {
    display: block;
    margin-top: 4px;
    color: var(--color-ink);
    font-size: 15px;
    font-weight: 800;
  }

  .pathway-mini-card p {
    max-width: 680px;
    margin: 6px 0 0;
    color: var(--color-muted);
    line-height: 1.45;
  }

  .pathway-mini-card__explanation {
    color: var(--color-ink) !important;
    font-weight: 700;
  }

  .pathway-mini-card button {
    min-height: 36px;
    flex-shrink: 0;
    padding: 0 13px;
    border: 0;
    border-radius: 8px;
    background: var(--color-primary);
    color: #fff;
    cursor: pointer;
    font-weight: 800;
  }

  .patient-workspace-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }

  .patient-workspace-actions button,
  .patient-workspace-empty button {
    min-height: 38px;
    padding: 0 16px;
    border: 0;
    border-radius: 8px;
    background: var(--color-primary);
    color: #fff;
    cursor: pointer;
    font-weight: 800;
  }

  .patient-workspace-actions button + button {
    border: 1px solid var(--color-border);
    background: rgba(255,255,255,0.8);
    color: var(--color-primary);
  }

  .patient-workspace-recent {
    display: grid;
    gap: 10px;
    margin-top: 24px;
  }

  .patient-workspace-recent h3 {
    color: var(--color-ink);
    font-size: 16px;
    font-weight: 800;
  }

  .patient-workspace-recent strong {
    color: var(--color-ink);
    font-size: 13px;
  }

  .patient-workspace-empty {
    min-height: 260px;
    display: grid;
    gap: 12px;
    place-content: center;
    justify-items: center;
    padding: 38px 24px;
    text-align: center;
  }

  .patient-workspace-empty__iq {
    min-height: 58px;
    color: rgba(96,176,250,0.34);
    font-size: 72px;
  }

  .patient-workspace-empty h2 {
    max-width: 680px;
    margin: 0;
    font-size: clamp(30px, 3.2vw, 40px);
    line-height: 1.08;
  }

  .patient-workspace-empty p {
    max-width: 560px;
    margin: 0;
    line-height: 1.55;
  }

  .patient-workspace-empty button {
    margin-top: 2px;
  }

  .patient-directory-card > .patient-card {
    max-width: 520px;
  }

  [data-measure-panel] {
    width: min(100%, 1320px);
    max-width: none;
    margin: 0 auto;
    border: 1px solid var(--color-line-strong);
    border-radius: 10px;
    overflow: hidden;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  [data-measure-panel] > .measure-header {
    position: relative;
    overflow: hidden;
    margin-bottom: 0;
    padding: 24px 28px 18px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-raised);
  }

  .measure-header__copy {
    min-width: 0;
  }

  .measure-title {
    font-size: 26px;
  }

  .measure-header__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 10px;
    align-items: stretch;
    min-width: min(100%, 560px);
  }

  .measure-header__stats > div {
    min-height: 72px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
  }

  .measure-header__stats span {
    display: block;
    color: var(--color-muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .measure-header__stats strong {
    display: block;
    margin-top: 6px;
    color: var(--color-primary);
    font-size: 17px;
    font-weight: 800;
    line-height: 1.15;
  }

  .measure-header__pathway {
    flex-basis: 100%;
    max-width: 860px;
    display: grid;
    gap: 4px;
    margin: 6px 0 0;
    padding: 11px 12px;
    border: 1px solid rgba(96,176,250,0.38);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-muted);
    font-size: 13px;
    line-height: 1.5;
  }

  .measure-header__pathway strong {
    color: var(--color-primary);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .measure-header__pathway span,
  .measure-header__pathway em {
    color: var(--color-muted);
    font-style: normal;
  }

  [data-measure-panel] .section-label {
    margin-bottom: 8px;
  }

  /* ── NUMERIC SCALE SELECTOR (0–10 ratings: NPRS, PSFS) ── */
  [data-numeric-scale] {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  [data-numeric-scale] button {
    min-width: 40px;
    padding: 9px 0;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--color-muted);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  [data-numeric-scale] button:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  [data-numeric-scale] button[data-active] {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-surface);
  }

  /* ── PSFS ACTIVITY ROWS ── */
  [data-psfs-activity] { margin-bottom: 18px; }

  [data-psfs-activity-row] {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  [data-psfs-activity-row] .field-input { flex: 1; }

  [data-remove-activity] {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    font-size: 16px;
    line-height: 1;
    color: var(--color-subtle);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  [data-remove-activity]:hover {
    color: var(--color-red);
    border-color: var(--color-red-border);
  }

  /* ── MEASURE DOMAIN FILTER (Neuro/Rehab vs MSK) ── */
  [data-measure-domain-filter] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: max-content;
    max-width: 100%;
    margin: 16px auto 0;
    padding: 3px;
    border-radius: 999px;
    background: var(--color-surface-soft);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  [data-measure-domain-filter] span {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--color-subtle);
    padding: 0 8px 0 12px;
  }

  [data-measure-domain-filter] button {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-muted);
    background: none;
    border: none;
    border-radius: 999px;
    padding: 6px 14px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  [data-measure-domain-filter] button:hover { color: var(--color-primary); }

  [data-measure-domain-filter] button[data-active] {
    color: var(--color-surface);
    background: var(--color-primary);
    font-weight: 600;
  }

  [data-measure-domain-filter] button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [data-measure-tabs] {
    width: min(100%, 600px);
    margin: 12px auto 16px;
    padding: 4px;
    border: 0;
    border-radius: 999px;
    background: var(--color-surface-raised);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  [data-measure-tabs] button {
    flex: 1;
    border: 0;
    border-radius: 999px;
    color: var(--color-muted);
  }

  [data-measure-tabs] button[data-active] {
    background: rgba(255,255,255,0.96);
    box-shadow: 0 4px 12px rgba(28,43,54,0.12);
    color: var(--color-primary);
  }

  [data-measure-layout] {
    min-height: 620px;
    border-top: 1px solid var(--color-border);
  }

  [data-measure-nav] {
    width: 250px;
    background: var(--color-surface-raised);
  }

  [data-measure-btn] {
    width: calc(100% - 16px);
    margin: 0 8px 6px;
    padding: 10px 12px;
    border-radius: 10px;
  }

  [data-measure-btn][data-active] {
    background: rgba(244,249,255,0.96);
    border-color: rgba(9,75,138,0.28);
    box-shadow: inset 0 0 0 1px rgba(9,75,138,0.14);
  }

  [data-measure-form] {
    padding: 32px;
  }

  [data-measure-footer] {
    gap: 10px;
    background: var(--color-surface-raised);
  }

  @media (max-width: 1100px) {
    .app-shell {
      grid-template-columns: 238px minmax(0, 1fr);
    }
    .app-sidebar__logo {
      margin-inline: 8px;
      overflow: hidden;
      width: auto;
    }
    .app-nav button,
    .app-sidebar__settings {
      justify-content: flex-start;
      padding: 0 12px;
    }
    .app-nav__copy span {
      display: none;
    }
    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .dashboard-progress-grid,
    .dashboard-review-grid,
    .dashboard-signals-grid,
    .dashboard-records-grid {
      grid-template-columns: 1fr;
    }
    .summary-grid--real,
    .domain-grid,
    .patients-workspace,
    .skeleton-workspace {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .patient-workspace-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .workspace-stat-grid,
    .pathway-action-grid,
    .pathway-measure-columns,
    .followup-stat-grid,
    .followup-create-panel,
    .followup-report-grid,
    .overview-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .followup-create-panel > div:first-child,
    .followup-create-panel label:first-of-type,
    .followup-create-panel label,
    .followup-email-target,
    .followup-create-actions {
      grid-column: auto;
    }
    .followup-create-actions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      justify-content: stretch;
    }
    .patient-summary-card__body {
      grid-template-columns: 130px 1fr;
    }
    .patient-summary-card__body--real {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .measure-header__stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      min-width: 0;
      width: 100%;
    }
    .summary-divider {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .app-shell {
      display: block;
    }
    .app-sidebar {
      position: static;
      height: auto;
      padding: 16px;
    }
    .app-sidebar__logo {
      width: auto;
      margin: 0 0 14px;
    }
    .app-nav {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .app-nav button {
      justify-content: center;
      min-height: 46px;
      padding: 0 10px;
      font-size: 13px;
    }
    .app-nav__group-label,
    .app-nav__copy span,
    .nav-badge {
      display: none;
    }
    .app-sidebar__bottom {
      display: none;
    }
    .app-main {
      padding: 28px 16px 44px;
    }
    .app-main::before {
      display: none;
    }
    .page-toolbar,
    .dashboard-zone__head,
    .patient-summary-card__head,
    .summary-card__head {
      align-items: flex-start;
      flex-direction: column;
    }
    .dashboard-zone {
      gap: 12px;
      padding-top: 22px;
    }
    .dashboard-zone__head p {
      max-width: none;
      text-align: left;
    }
    .summary-card__head select {
      width: 100%;
      min-width: 0;
    }
    .pathway-score {
      min-width: 0;
      text-align: left;
    }
    .pathway-mini-card {
      align-items: stretch;
      flex-direction: column;
    }
    .workspace-head,
    .next-action-panel,
    .followup-attention-panel,
    .followup-empty-panel,
    .pathway-hero {
      align-items: stretch;
      flex-direction: column;
    }
    .patient-workspace-hero {
      grid-template-columns: 1fr;
      justify-items: start;
    }
    .patient-workspace-iq,
    .patient-workspace-empty__iq {
      display: none;
    }
    .measure-header__stats {
      grid-template-columns: 1fr;
    }
    .patient-workspace-stats {
      grid-template-columns: 1fr;
    }
    .patient-summary-card__body,
    .summary-grid,
    .summary-grid--real,
    .dashboard-progress-grid,
    .dashboard-review-grid,
    .dashboard-signals-grid,
    .dashboard-records-grid,
    .domain-grid,
    .patients-workspace,
    .workspace-stat-grid,
    .pathway-action-grid,
    .pathway-measure-columns,
    .followup-stat-grid,
    .followup-create-panel,
    .followup-report-grid,
    .overview-grid,
    .skeleton-workspace,
    [data-measure-layout] {
      grid-template-columns: 1fr;
      display: grid;
    }
    .overview-measure-list button {
      grid-template-columns: 1fr;
    }
    .followup-create-actions,
    .followup-row-actions {
      justify-content: stretch;
    }
    .followup-create-actions button,
    .followup-row-actions button {
      width: 100%;
      justify-content: center;
    }
    .followup-link-panel,
    .followup-timeline article {
      grid-template-columns: 1fr;
    }
    .skeleton-stat-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .assessment-detail-grid,
    .patient-summary-card__body--real {
      grid-template-columns: 1fr;
    }
    .patient-management-card {
      align-items: flex-start;
      flex-direction: column;
    }
    [data-measure-nav] {
      width: auto;
      max-height: 220px;
      border-right: 0;
      border-bottom: 1px solid var(--color-border);
    }
  }

  /* ── SIDEBAR NAV TRANSITIONS ── */
  .app-nav button,
  .app-sidebar__settings,
  .profile-strip {
    transition: background 0.18s, box-shadow 0.18s, color 0.15s;
  }

  /* ── CONFIRM MODAL ── */
  .confirm-modal-content {
    max-width: 420px;
    padding: 28px;
    overflow: visible;
  }
  .confirm-modal-message {
    font-size: 15px;
    color: var(--color-ink);
    line-height: 1.55;
    margin: 0;
  }
  .confirm-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid var(--color-border);
  }
  .confirm-modal-actions button {
    font-family: 'Geist', sans-serif;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 20px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-muted);
    transition: color 0.15s, border-color 0.15s;
  }
  .confirm-modal-actions button:hover { color: var(--color-ink); border-color: var(--color-muted); }
  .confirm-modal-actions button[data-danger] {
    background: var(--color-red);
    color: #fff;
    border-color: var(--color-red);
  }
  .confirm-modal-actions button[data-danger]:hover { background: var(--color-red-dark); border-color: var(--color-red-dark); }

  /* ── PHASE 3 MOTION ── */
  @media (prefers-reduced-motion: no-preference) {
    /* View fade on tab switch */
    @keyframes view-fade-in { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
    .app-view { animation: view-fade-in 0.28s cubic-bezier(0.16, 1, 0.3, 1); }

    /* Modal entrance */
    @keyframes modal-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modal-content-in { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: none; } }
    .modal { animation: modal-backdrop-in 0.2s ease; }
    .modal-content { animation: modal-content-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

    /* Notification banner */
    @keyframes notif-slide-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
    [data-notification] { animation: notif-slide-in 0.32s cubic-bezier(0.16, 1, 0.3, 1); }

    /* Patient list hover nudge */
    .patient-card li { transition: background 0.12s, border-color 0.12s, transform 0.18s; }
    .patient-card li:hover:not([aria-selected="true"]) { transform: translateX(2px); }

    /* Interpretation chips */
    @keyframes chip-appear { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: none; } }
    .interp-chip { animation: chip-appear 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
  }
`
