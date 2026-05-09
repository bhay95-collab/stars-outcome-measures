import { ClipboardCopy, FileText, Printer, RotateCcw, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import ThreeBarMotif from './ThreeBarMotif'

const WHEELCHAIR_PRESCRIPTION_MEASURE = 'Wheelchair Prescription'
const WHEELCHAIR_PRESCRIPTION_TOOL = 'wheelchair-prescription'
const WHEELCHAIR_PRESCRIPTION_SCHEMA_VERSION = 1

function isWheelchairPrescriptionRecord(record) {
  return record?.measure === WHEELCHAIR_PRESCRIPTION_MEASURE ||
    record?.results?.meta?.tool === WHEELCHAIR_PRESCRIPTION_TOOL
}

function cssEscape(value) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value)
  return String(value).replace(/["\\]/g, '\\$&')
}

function collectFormStateFromRoot(root) {
  const fields = {}
  const radios = {}
  const checkboxGroups = {}
  if (!root) return { fields, radios, checkboxGroups }

  root.querySelectorAll('#wcForm input, #wcForm textarea, #wcForm select').forEach(el => {
    if (el.type === 'radio') {
      if (el.checked) radios[el.name] = el.value
    } else if (el.type === 'checkbox') {
      if (!checkboxGroups[el.name]) checkboxGroups[el.name] = []
      if (el.checked) checkboxGroups[el.name].push(el.value)
    } else if (el.id) {
      fields[el.id] = el.value
    }
  })

  return { fields, radios, checkboxGroups }
}

function applyFormStateToRoot(root, data) {
  if (!root || !data) return false
  const $ = id => root.querySelector(`#${id}`)

  Object.entries(data.fields || {}).forEach(([id, value]) => {
    const el = $(id)
    if (el) el.value = value
  })
  Object.entries(data.radios || {}).forEach(([name, value]) => {
    const el = root.querySelector(`input[type="radio"][name="${cssEscape(name)}"][value="${cssEscape(value)}"]`)
    if (el) el.checked = true
  })
  Object.entries(data.checkboxGroups || {}).forEach(([name, values]) => {
    const selected = new Set(values)
    root.querySelectorAll(`input[type="checkbox"][name="${cssEscape(name)}"]`).forEach(el => {
      el.checked = selected.has(el.value)
    })
  })

  return true
}

function readPersistentDraft(storageKey) {
  if (typeof window === 'undefined') return null
  const stores = [window.localStorage, window.sessionStorage].filter(Boolean)
  for (const store of stores) {
    try {
      const raw = store.getItem(storageKey)
      if (!raw) continue
      return JSON.parse(raw)
    } catch {
      // Local persistence is an enhancement; ignore malformed browser state.
    }
  }
  return null
}

function writePersistentDraft(storageKey, formState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(formState))
    window.sessionStorage.removeItem(storageKey)
  } catch {
    // The tool still works when browser storage is unavailable.
  }
}

function removePersistentDraft(storageKey) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storageKey)
    window.sessionStorage.removeItem(storageKey)
  } catch {}
}

function getFormStateFromAssessment(record) {
  return record?.inputs?.formState || record?.results?.meta?.formState || null
}

function getRecordSavedAt(record) {
  return record?.results?.meta?.savedAt || record?.created_at || ''
}

function getFormStateUpdatedAt(formState) {
  return formState?.meta?.updatedAt || formState?.updatedAt || ''
}

function formatDateTime(value) {
  if (!value) return 'Not saved'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not saved'
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function patientDobForField(patient) {
  return patient?.dob ? String(patient.dob).slice(0, 10) : ''
}

function formatPatientDob(patient) {
  const dob = patientDobForField(patient)
  if (dob) {
    const [year, month, day] = dob.split('-')
    if (year && month && day) return `${day}/${month}/${year}`
  }
  return patient?.dob_year ? `b. ${patient.dob_year}` : ''
}

function formatPatientOption(patient) {
  return [patient?.initials || 'Unnamed patient', patient?.diagnosis, formatPatientDob(patient)]
    .filter(Boolean)
    .join(' - ')
}

function getPatientPrefillFields(patient) {
  if (!patient) return {}
  return {
    ...(patient.initials ? { clientName: patient.initials } : {}),
    ...(patientDobForField(patient) ? { dob: patientDobForField(patient) } : {}),
    ...(patient.diagnosis ? { primaryDx: patient.diagnosis } : {}),
  }
}

function applyPatientDetailsToForm(root, patient, { overwrite = false } = {}) {
  if (!root || !patient) return false
  let changed = false
  Object.entries(getPatientPrefillFields(patient)).forEach(([id, value]) => {
    const el = root.querySelector(`#${id}`)
    if (!el) return
    if (overwrite || !String(el.value || '').trim()) {
      if (el.value !== value) {
        el.value = value
        changed = true
      }
    }
  })
  return changed
}

function summarizePrescriptionState(formState) {
  const fields = formState?.fields || {}
  const radios = formState?.radios || {}
  const checkboxGroups = formState?.checkboxGroups || {}
  const hasChecks = name => (checkboxGroups[name] || []).length > 0
  const hasMeasurement = ['A', 'B', 'M'].some(code => fields[`meas${code}_L`] || fields[`meas${code}_R`])
  const domains = [
    !!fields.mobilityGoals,
    !!fields.fundingBody,
    !!fields.weight,
    !!(radios.historyPI && radios.sensation),
    hasMeasurement,
    !!(radios.propulsion || radios.proposedPathway),
    !!(fields.doorWidths || fields.communityEnvironment || hasChecks('externalTerrain')),
    !!(fields.reqSeatWidth || fields.reqSeatDepth || fields.reqSeatHeight),
    !!fields.trialEquipment,
    !!(fields.proposedCushion || fields.proposedBackrest || fields.selectedEquipment),
  ]
  const completed = domains.filter(Boolean).length
  const completionPercent = Math.round((completed / domains.length) * 100)
  const statusLabel = completionPercent >= 80
    ? 'Supplier-ready draft'
    : completionPercent >= 50
      ? 'Developing prescription'
      : 'Early information gathering'

  return {
    completionPercent,
    statusLabel,
    completedDomains: completed,
    totalDomains: domains.length,
    pathway: radios.proposedPathway || '',
    selectedEquipment: fields.selectedEquipment || '',
  }
}

export default function WheelchairPrescriptionTool({ patient, patients = [], onPatientSelect, userId, assessments = [], onSaved }) {
  const rootRef = useRef(null)
  const activeVersionIdRef = useRef(null)
  const [draftStatus, setDraftStatus] = useState({
    tone: 'muted',
    title: 'Local draft ready',
    detail: 'Progress autosaves on this device while you work.',
  })
  const [saveState, setSaveState] = useState('idle')
  const [saveError, setSaveError] = useState('')
  const [activeVersionId, setActiveVersionId] = useState(null)
  const storageKey = useMemo(
    () => `rehabmetrics:wheelchair-prescription:${patient?.id ?? 'standalone'}`,
    [patient?.id]
  )
  const savedVersions = useMemo(
    () => assessments
      .filter(record => record.patient_id === patient?.id && isWheelchairPrescriptionRecord(record))
      .sort((a, b) => new Date(getRecordSavedAt(b)) - new Date(getRecordSavedAt(a))),
    [assessments, patient?.id]
  )
  const latestSavedVersion = savedVersions[0] ?? null
  const selectedPatientId = patient?.id != null ? String(patient.id) : ''

  const handlePatientChange = useCallback((event) => {
    const nextPatient = patients.find(item => String(item.id) === event.target.value)
    if (!nextPatient || String(nextPatient.id) === selectedPatientId) return
    onPatientSelect?.(nextPatient)
  }, [onPatientSelect, patients, selectedPatientId])

  useEffect(() => {
    activeVersionIdRef.current = activeVersionId
  }, [activeVersionId])

  const canSaveToPatient = !!(patient?.id && userId)

  const handleLoadVersion = useCallback((version) => {
    const formState = getFormStateFromAssessment(version)
    const root = rootRef.current
    if (!root || !formState) return
    if (!window.confirm('Load this saved wheelchair prescription version into the workspace? Current unsaved local edits will be replaced.')) return
    root.querySelector('#wcForm')?.reset()
    applyFormStateToRoot(root, formState)
    const patientPrefilled = applyPatientDetailsToForm(root, patient, { overwrite: true })
    const restoredState = patientPrefilled ? collectFormStateFromRoot(root) : formState
    setActiveVersionId(version.id)
    activeVersionIdRef.current = version.id
    const updatedAt = new Date().toISOString()
    writePersistentDraft(storageKey, {
      ...restoredState,
      meta: {
        ...(formState.meta || {}),
        updatedAt,
        savedAt: getRecordSavedAt(version),
        sourceVersionId: version.id,
      },
    })
    window.refreshWheelchairPrescription?.(false)
    setDraftStatus({
      tone: 'success',
      title: 'Saved version loaded',
      detail: `Loaded ${formatDateTime(getRecordSavedAt(version))}. Continue editing, then save a new version when ready.`,
    })
  }, [patient, storageKey])

  const handleSaveVersion = useCallback(async () => {
    const root = rootRef.current
    if (!root) return
    if (!canSaveToPatient) {
      setSaveError('Select a patient before saving prescription versions to the record.')
      setDraftStatus({
        tone: 'warning',
        title: 'Local draft only',
        detail: 'Select a patient to save longitudinal prescription versions.',
      })
      return
    }

    setSaveState('saving')
    setSaveError('')

    const now = new Date().toISOString()
    const baseState = collectFormStateFromRoot(root)
    const formState = {
      ...baseState,
      meta: {
        ...(baseState.meta || {}),
        schemaVersion: WHEELCHAIR_PRESCRIPTION_SCHEMA_VERSION,
        updatedAt: now,
        sourceVersionId: activeVersionIdRef.current,
      },
    }
    const summary = summarizePrescriptionState(formState)
    const supplierBrief = window.getWheelchairSupplierBrief?.() || ''
    const reasoning = root.querySelector('#guidanceOutput')?.innerText?.trim() || ''

    const row = {
      user_id: userId,
      patient_id: patient.id,
      measure: WHEELCHAIR_PRESCRIPTION_MEASURE,
      inputs: { formState },
      results: {
        primaryValue: summary.completionPercent,
        interpretation: summary.statusLabel,
        meta: {
          tool: WHEELCHAIR_PRESCRIPTION_TOOL,
          schemaVersion: WHEELCHAIR_PRESCRIPTION_SCHEMA_VERSION,
          savedAt: now,
          completionPercent: summary.completionPercent,
          statusLabel: summary.statusLabel,
          completedDomains: summary.completedDomains,
          totalDomains: summary.totalDomains,
          pathway: summary.pathway,
          selectedEquipment: summary.selectedEquipment,
          supplierBrief,
          reasoning,
        },
      },
    }

    const { data, error } = await supabase
      .from('assessments')
      .insert(row)
      .select()
      .single()

    const savedRecord = Array.isArray(data) ? data[0] : data

    if (error || !savedRecord) {
      setSaveState('idle')
      setSaveError(error?.message || 'The prescription version could not be saved.')
      setDraftStatus({
        tone: 'warning',
        title: 'Local draft saved',
        detail: 'Could not save a patient-record version. Your local autosave is still available on this device.',
      })
      writePersistentDraft(storageKey, formState)
      return
    }

    const savedFormState = {
      ...formState,
      meta: {
        ...formState.meta,
        savedAt: now,
        sourceVersionId: savedRecord.id,
      },
    }
    writePersistentDraft(storageKey, savedFormState)
    setActiveVersionId(savedRecord.id)
    setSaveState('saved')
    setDraftStatus({
      tone: 'success',
      title: 'Version saved to patient record',
      detail: `Saved ${formatDateTime(now)}. Continue refining and save another version when new information arrives.`,
    })
    onSaved?.(savedRecord)
    window.setTimeout(() => setSaveState('idle'), 1800)
  }, [canSaveToPatient, onSaved, patient?.id, storageKey, userId])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const $ = (id) => root.querySelector(`#${id}`)
    const qsa = (sel) => Array.from(root.querySelectorAll(sel))
    const val = (id) => ($(id)?.value || '').trim()
    const rad = (name) => root.querySelector(`input[name="${name}"]:checked`)?.value || ''
    const checks = (name) => qsa(`input[name="${name}"]:checked`).map(x => x.value)
    const join = (arr) => arr.filter(Boolean).join(', ')
    const line = (label, value) => value ? `${label}: ${value}\n` : ''
    const autoCalcIds = ['reqSeatWidth', 'proposedOverallWidth', 'reqSeatDepth', 'reqSeatHeight', 'reqBackHeight', 'cushionProfile', 'headSupport', 'proposedCushion', 'proposedBackrest', 'seatAngleTilt', 'backrestRecline', 'legrestAngle', 'armSupport']
    let applyingAuto = false

    function fieldRows(ids) {
      return ids.map(([label, id]) => line(label, val(id))).join('')
    }

    function measurementSummary() {
      const rows = [
        ['A Buttock/thigh depth', 'A'], ['B Lower leg length', 'B'], ['C Foot length', 'C'], ['D Ischial well length', 'D'],
        ['E Seat to elbow', 'E'], ['F PSIS', 'F'], ['G Inferior scapula', 'G'], ['H Axilla', 'H'],
        ['I Top of shoulder', 'I'], ['J Top of head', 'J'], ['K Shoulder width', 'K'], ['L Chest width', 'L'],
        ['M Hip width', 'M'], ['N External knee width', 'N'], ['O Internal knee width', 'O'], ['P External ankle/foot', 'P'],
      ]
      let out = ''
      rows.forEach(([label, code]) => {
        const l = val(`meas${code}_L`)
        const r = val(`meas${code}_R`)
        if (l || r) out += `${label}: L/value ${l || '-'} mm | R ${r || '-'} mm\n`
      })
      if (val('overallWidthNotes')) out += `Overall/asymmetry notes: ${val('overallWidthNotes')}\n`
      return out || 'No measurements entered yet.\n'
    }

    function activitySummary() {
      const acts = ['Eating', 'Grooming', 'Bathing', 'Dressing - upper body', 'Dressing - lower body', 'Toileting', 'Bed/chair/wheelchair transfer', 'Toilet transfer', 'Shower/bath transfer', 'Propel', 'Reposition / pressure relieve', 'Reach / pick up objects', 'Navigate tight spaces', 'Manage ramps / inclines / curbs', 'Cross streets / community safety']
      let out = ''
      acts.forEach((act, i) => {
        const level = val(`act_${i}`)
        const note = val(`actNote_${i}`)
        if (level || note) out += `${act}: ${level || '-'}${note ? ` - ${note}` : ''}\n`
      })
      return out
    }

    function buildSupplierBriefText() {
      let text = ''
      text += 'WHEELCHAIR PRESCRIPTION - SUPPLIER BRIEF\n'
      text += '=========================================\n\n'
      text += '1. CLIENT / REFERRAL\n'
      text += fieldRows([['Client', 'clientName'], ['Date of assessment', 'assessmentDate'], ['DOB', 'dob'], ['Weight kg', 'weight'], ['Primary diagnosis', 'primaryDx'], ['Other diagnosis', 'otherDx'], ['Funding pathway', 'fundingBody'], ['Reason for referral', 'reasonReferral']])
      text += line('Mobility/seating goals', val('mobilityGoals'))
      text += line('Productivity/recreation context', join([val('productivity'), val('recreation')]))
      text += line('Remoteness', rad('remoteness'))
      text += line('Wheelchair use', rad('wcTime'))
      text += line('Carers', join(checks('carers')))
      text += '\n2. KEY CLINICAL RISKS\n'
      text += line('Condition', rad('conditionStatus'))
      text += line('Impairment areas', join(checks('impairment')))
      text += line('Pressure injury history', rad('historyPI'))
      text += line('Sensation', rad('sensation'))
      text += line('Current pressure injury', rad('currentPI'))
      text += line('PI stage/location', join([val('piStage'), val('piLocation')]))
      text += line('Seating-related skin risk', join([val('seatingRelated'), val('seatingRiskFactors')]))
      text += line('Current pressure management', val('pressureManagement'))
      text += line('Bariatric flag', $('bariatricFlag') && $('bariatricFlag').checked ? 'Flagged' : '')
      text += line('Bariatric features', join(checks('bariatricFeatures')))
      text += line('Wound care referral required', rad('woundReferral'))
      text += '\n3. MEASUREMENTS IN PROPOSED POSITION\n'
      text += measurementSummary()
      text += '\n4. CURRENT EQUIPMENT\n'
      text += line('Current base', rad('seatingBase'))
      text += line('Manufacturer/model', val('currentModel'))
      text += line('Age/condition', join([val('baseAge'), val('baseCondition')]))
      text += line('Current base status', rad('currentBaseMeets'))
      text += line('Client comments', val('currentBaseComments'))
      text += line('Manual type', join(checks('manualCurrentType')))
      text += line('Propulsion', rad('propulsion'))
      text += line('Power add-on', join([join(checks('powerAddon')), val('powerAddonOther')]))
      text += line('Drive wheel config', rad('driveConfig'))
      text += line('Current power seat functions', join(checks('currentSeatFunctions')))
      text += line('Current power seat size', join([val('currentSeatWidth') && `${val('currentSeatWidth')} mm wide`, val('currentSeatDepth') && `${val('currentSeatDepth')} mm deep`]))
      text += line('Current cushion', join([val('currentCushion'), val('currentCushionSize'), val('currentCushionMeets')]))
      text += line('Current backrest', join([val('currentBackrest'), val('currentBackrestSize'), val('currentBackrestMeets')]))
      text += line('Current accessories', join(checks('currentAccessories')))
      text += line('Current seating info', val('currentSeatingInfo'))
      text += '\n5. FUNCTION / ENVIRONMENT SUMMARY\n'
      text += line('Sitting balance', rad('sittingBalance'))
      text += line('Functional activities', activitySummary().trim())
      text += line('Door widths', val('doorWidths'))
      text += line('Thresholds', val('thresholds'))
      text += line('Turning circles', val('turningCircles'))
      text += line('Bed/chair heights', val('surfaceHeights'))
      text += line('Internal surfaces', join(checks('internalSurfaces')))
      text += line('External terrain', join(checks('externalTerrain')))
      text += line('Steepest ramp/slope', val('steepestSlope'))
      text += line('Community environment', val('communityEnvironment'))
      text += line('Transport', join(checks('transport')))
      text += line('Travel position', rad('travelPosition'))
      text += line('Transport details', val('transportDetails'))
      text += '\n6. POSTURE / MAT SUMMARY\n'
      text += line('MAT completed on plinth', rad('matCompleted'))
      text += line('Pelvis seated', join([rad('pelvisSag'), rad('pelvisFront'), rad('pelvisTrans')]))
      text += line('Supine pelvic findings', join([rad('supinePelvicTilt'), rad('tiltFlex'), rad('supineRotation'), rad('rotationFlex'), rad('supineObliquity'), rad('obliquityFlex')]))
      text += line('Lower extremity findings', join(checks('lowerExt')))
      text += line('Spine/cervical/shoulder findings', join(checks('spineCervical')))
      text += line('Tone/movement', join(checks('toneMovement')))
      text += line('ROM notes', val('romNotes'))
      text += line('Simulation findings/proposed posture', val('simulationFindings'))
      text += '\n7. PROPOSED PRODUCT PARAMETERS\n'
      text += 'Auto-calculation note: Dimension fields are starting points generated from Section 2 measurements. Overall wheelchair width is estimated from seat width + 200 mm unless overwritten with the supplier\'s confirmed outside-to-outside width. Overwrite any auto field where MAT findings, posture, pressure care, transfers, propulsion, supplier measurement conventions or trial outcomes indicate a better fit.\n'
      text += line('Likely prescription pathway', rad('proposedPathway'))
      text += line('Preferred suppliers to contact', val('supplierPreference') || join(checks('suppliers')))
      text += line('Reason for base direction', val('baseDirectionReason'))
      text += fieldRows([['Required seat width mm', 'reqSeatWidth'], ['Estimated/proposed overall wheelchair width mm', 'proposedOverallWidth'], ['Required seat depth mm', 'reqSeatDepth'], ['Required front seat height mm', 'reqSeatHeight'], ['Required backrest height', 'reqBackHeight'], ['Cushion profile', 'cushionProfile'], ['Head support', 'headSupport'], ['Cushion recommendation', 'proposedCushion'], ['Backrest recommendation', 'proposedBackrest'], ['Seat angle/tilt', 'seatAngleTilt'], ['Backrest recline', 'backrestRecline'], ['Legrest angle/support', 'legrestAngle'], ['Arm support', 'armSupport']])
      text += line('Postural supports', join(checks('posturalSupports')))
      text += line('Belts/secondary supports', join(checks('beltsSupports')))
      text += line('Support descriptors/mounting', val('posturalSupportDescriptors'))
      text += line('Manual prescription source', join([rad('proposedPathway'), join(checks('manualCurrentType'))]))
      text += line('Frame material', join(checks('frameMaterial')))
      text += line('Manual wheels/drive', join(checks('manualWheels')))
      text += line('Manual accessories', join(checks('manualAccessories')))
      text += line('Manual configuration notes', val('manualConfigNotes'))
      text += line('Power drive to trial', rad('proposedDrive'))
      text += line('Power seat functions', join(checks('proposedSeatFunctions')))
      text += line('Power controls', val('powerControls'))
      text += line('Power base/seating notes', val('powerBaseNotes'))
      text += line('Charging/storage', val('powerChargingNotes'))
      text += '\n8. TRIAL / QUOTE / HANDOVER\n'
      text += line('Trial locations', join(checks('trialLocations')))
      text += line('Potential trial equipment', val('trialEquipment'))
      text += line('Products trialled/outcomes', val('productsTrialled'))
      text += line('Selected equipment', val('selectedEquipment'))
      text += line('Quote instructions', val('quoteInstructions'))
      text += line('Fitting/training items', join(checks('trainingChecklist')))
      text += line('Training/follow-up notes', val('trainingNotes'))
      text += line('Barriers to goals', val('barriersToGoals'))
      text += line('Postural/mobility issues', val('identifiedIssues'))
      text += line('Product parameters summary', val('productParametersSummary'))
      text += '\nRequested supplier response: itemised quote, trial availability, proposed products that match the clinical parameters, lead time, setup/fitting requirements, warranty, maintenance/repair pathway, freight/delivery cost, and any product constraints that may affect goals, transport or environment.\n'
      return text.replace(/\n{3,}/g, '\n\n')
    }

    function parseMmValues(text) {
      const values = []
      const re = /(\d+(?:\.\d+)?)\s*(mm|cm|m)?/gi
      let match
      while ((match = re.exec(String(text || ''))) !== null) {
        let n = Number(match[1])
        const unit = (match[2] || 'mm').toLowerCase()
        if (!Number.isFinite(n)) continue
        if (unit === 'm') n *= 1000
        if (unit === 'cm') n *= 10
        if (n >= 100) values.push(Math.round(n))
      }
      return values
    }

    function narrowestDoorWidth() {
      const values = parseMmValues(val('doorWidths'))
      return values.length ? Math.min(...values) : 0
    }

    function estimatedOverallWidthFromSeatWidth() {
      const seatWidth = Number(val('reqSeatWidth') || 0)
      return seatWidth ? Math.round(seatWidth + 200) : 0
    }

    function proposedWheelchairWidth() {
      return Number(val('proposedOverallWidth') || 0) || estimatedOverallWidthFromSeatWidth()
    }

    function boolHighRiskPressure() {
      return rad('currentPI') === 'Yes' || rad('historyPI') === 'Yes' || ['Impaired', 'Absent'].includes(rad('sensation')) || val('seatingRiskFactors') === 'Yes'
    }

    function hasBariatricFlag() {
      const flag = $('bariatricFlag')
      return !!(flag && flag.checked) || checks('bariatricFeatures').length > 0
    }

    function hasComplexPosture() {
      const fixed = [rad('tiltFlex'), rad('rotationFlex'), rad('obliquityFlex')].includes('Non-reducible')
      const spine = checks('spineCervical').some(v => ['Scoliosis convex right', 'Scoliosis convex left', 'Thoracic kyphosis', 'Spinal rotation R', 'Spinal rotation L'].includes(v))
      const pelvis = [rad('pelvisSag'), rad('pelvisFront'), rad('pelvisTrans')].some(v => v && v !== 'Neutral')
      return fixed || spine || pelvis || checks('lowerExt').some(v => v.includes('Wind') || v.includes('adducted') || v.includes('abducted'))
    }

    function maxPair(code) {
      return Math.max(Number(val(`meas${code}_L`) || 0), Number(val(`meas${code}_R`) || 0))
    }

    function roundTo(value, step = 10) {
      if (!value || value <= 0) return ''
      return String(Math.max(0, Math.round(value / step) * step))
    }

    function setGuide(id, html) {
      const el = $(id)
      if (el) el.innerHTML = html
    }

    function setAutoValue(id, value, force = false) {
      const el = $(id)
      if (!el || value === undefined || value === null || value === '') return
      const manual = el.dataset.manual === 'true'
      const wasAuto = el.dataset.auto === 'true'
      if (force || !manual || wasAuto || !el.value.trim()) {
        applyingAuto = true
        el.value = value
        el.dataset.auto = 'true'
        el.dataset.manual = 'false'
        applyingAuto = false
      }
    }

    function initAutoCalcTracking() {
      autoCalcIds.forEach(id => {
        const el = $(id)
        if (!el) return
        const markManual = () => {
          if (!applyingAuto) {
            el.dataset.manual = 'true'
            el.dataset.auto = 'false'
          }
        }
        el.addEventListener('input', markManual)
        el.addEventListener('change', markManual)
      })
    }

    function calculationInputs() {
      const pressureRisk = boolHighRiskPressure()
      const complexPosture = hasComplexPosture()
      const poorBalance = ['Sitting with propping', 'Unable to sit without support'].includes(rad('sittingBalance'))
      const fullTime = rad('wcTime') === 'Full-time use'
      const independentManual = ['Independent full-time', 'Independent part-time'].includes(rad('propulsion')) || /manual/i.test(rad('proposedPathway')) || checks('manualCurrentType').length > 0
      return {
        hip: maxPair('M'),
        depth: maxPair('A'),
        lowerLeg: maxPair('B'),
        scap: maxPair('G'),
        axilla: maxPair('H'),
        shoulder: maxPair('I'),
        head: maxPair('J'),
        seatToElbow: maxPair('E'),
        externalKnee: maxPair('N'),
        ankleWidth: maxPair('P'),
        pressureRisk,
        complexPosture,
        poorBalance,
        fullTime,
        independentManual,
        powerSeatFunctions: checks('proposedSeatFunctions'),
      }
    }

    function suggestedBackHeight(c) {
      if (val('headSupport') === 'Yes' && c.head) return `${c.head} mm to top-of-head support level`
      if ((c.poorBalance || c.powerSeatFunctions.some(v => /tilt|recline/i.test(v))) && c.shoulder) return `${c.shoulder} mm to top of shoulder`
      if (c.complexPosture && c.axilla) return `${c.axilla} mm to axilla level - refine for laterals/head clearance`
      if (c.independentManual && c.scap) return `${c.scap} mm to inferior scapula - preserves shoulder movement for propulsion`
      if (c.axilla) return `${c.axilla} mm to axilla level`
      if (c.scap) return `${c.scap} mm to inferior scapula`
      if (c.shoulder) return `${c.shoulder} mm to top of shoulder`
      if (c.head) return `${c.head} mm to top of head`
      return ''
    }

    function applyAutoCalculations(force = false) {
      const c = calculationInputs()
      if (c.hip) setAutoValue('reqSeatWidth', roundTo(c.hip + 30), force)
      const seatWidthForOverall = Number(val('reqSeatWidth') || (c.hip ? roundTo(c.hip + 30) : 0))
      if (seatWidthForOverall) setAutoValue('proposedOverallWidth', String(Math.round(seatWidthForOverall + 200)), force)
      if (c.depth) setAutoValue('reqSeatDepth', roundTo(c.depth - (c.depth >= 430 ? 50 : 35)), force)
      if (c.lowerLeg) setAutoValue('reqSeatHeight', roundTo(c.lowerLeg + 25), force)
      const back = suggestedBackHeight(c)
      if (back) setAutoValue('reqBackHeight', back, force)
      setAutoValue('cushionProfile', (c.pressureRisk || c.fullTime || c.poorBalance) ? 'High profile 3 inch +' : 'Low profile 1-2 inch', force)
      setAutoValue('headSupport', (c.poorBalance || rad('travelPosition') === 'In wheelchair' || c.powerSeatFunctions.some(v => /tilt|recline/i.test(v))) ? 'Yes' : 'No', force)

      let cushion = 'General positioning cushion to trial; confirm comfort, stability, transfers and skin response.'
      if (c.pressureRisk && c.complexPosture) cushion = 'Pressure-redistributing contoured cushion to trial; confirm pelvic stability, offloading, skin response and transfer impact.'
      else if (c.pressureRisk) cushion = 'Pressure-redistributing cushion to trial; document pressure relief routine and follow-up skin review.'
      else if (c.complexPosture) cushion = 'Contoured positioning cushion to trial; match to pelvic/lower-limb alignment and reducibility.'
      setAutoValue('proposedCushion', cushion, force)

      let backrest = 'Standard or tension-adjustable backrest to trial; confirm comfort, reach and propulsion/functional access.'
      if (c.complexPosture && c.poorBalance) backrest = 'Contoured supportive backrest with lateral support to trial; confirm level of correction/accommodation from MAT.'
      else if (c.complexPosture) backrest = 'Contoured or tension-adjustable backrest to trial; consider lateral/pelvic supports based on MAT findings.'
      else if (c.poorBalance) backrest = 'Higher supportive backrest to trial; confirm trunk stability, reach, comfort and caregiver access.'
      setAutoValue('proposedBackrest', backrest, force)

      setAutoValue('seatAngleTilt', (c.pressureRisk || c.poorBalance || c.complexPosture || c.fullTime)
        ? 'Tilt-in-space / adjustable seat angle to trial; confirm pressure relief, pelvic stability, gaze, function and transfer impact.'
        : 'Standard 0-5 deg or mild dump only if it improves stability/propulsion without limiting function.', force)
      setAutoValue('backrestRecline', (c.pressureRisk || c.powerSeatFunctions.some(v => /recline/i.test(v)))
        ? 'Recline only with clear care/rest/pressure rationale; verify shear, sliding, belt position and return-to-function.'
        : 'Standard/fixed recline unless comfort, care tasks or fatigue management require adjustment.', force)
      setAutoValue('legrestAngle', c.lowerLeg
        ? `Set footplate/leg support from lower leg length B ${c.lowerLeg} mm; consider angle-adjustable footplates or calf/heel support if ROM, tone, swelling or foot position requires.`
        : 'Use lower leg length B, ROM, tone, swelling, foot position and transfer needs to set legrest angle/support.', force)
      setAutoValue('armSupport', c.seatToElbow
        ? `Seat-to-elbow E ${c.seatToElbow} mm; trial height-adjustable armrests/arm troughs to keep shoulders level and support transfers/reach.`
        : 'Use seat-to-elbow E to set arm support height; confirm reach, transfers, shoulder position and table access.', force)
    }

    function reapplyAutoCalculations() {
      if (!window.confirm('Re-apply auto-calculated starting points and overwrite any manual edits in the key seating dimension fields?')) return
      autoCalcIds.forEach(id => {
        const el = $(id)
        if (el) {
          el.dataset.manual = 'false'
          el.dataset.auto = 'true'
        }
      })
      applyAutoCalculations(true)
      updateAll(true)
    }

    function updateDimensionGuidance() {
      applyAutoCalculations(false)
      const c = calculationInputs()
      setGuide('guide_reqSeatWidth', c.hip ? `<strong>Auto-start:</strong> ${roundTo(c.hip + 30)} mm from hip width M ${c.hip} mm + approx. 30 mm clearance. Overwrite for asymmetry, tissue shape, clothing, lateral supports, hand access, transfers or supplier sizing.` : '<strong>Auto-start:</strong> Enter hip width M to calculate a starting seat width.')
      const doorWidth = narrowestDoorWidth()
      const overallWidth = proposedWheelchairWidth()
      const seatWidth = Number(val('reqSeatWidth') || 0)
      const overallSource = val('proposedOverallWidth') ? 'Current overall-width value' : 'Estimated overall width'
      const accessEscalation = !!(overallWidth && doorWidth && overallWidth >= doorWidth)
      if (overallWidth && doorWidth) {
        setGuide('guide_proposedOverallWidth', accessEscalation
          ? `<strong>Escalation:</strong> ${overallSource} ${overallWidth} mm is equal to or wider than the narrowest recorded door width ${doorWidth} mm. This is based on seat width ${seatWidth || '-'} mm + 200 mm unless overwritten. Confirm supplier total width, hand rims/tyres, clear opening, door swing, thresholds and approach before quoting.`
          : `<strong>Door check:</strong> ${overallSource} ${overallWidth} mm is narrower than the narrowest recorded door width ${doorWidth} mm. This estimate uses seat width ${seatWidth || '-'} mm + 200 mm unless overwritten; still confirm supplier total width and trial through the narrowest doorway.`)
      } else if (overallWidth) {
        setGuide('guide_proposedOverallWidth', `<strong>Auto-estimate:</strong> ${overallWidth} mm from seat width ${seatWidth || '-'} mm + 200 mm. Enter measured clear door openings to trigger the access flag. Overwrite once supplier outside-to-outside width is confirmed.`)
      } else {
        setGuide('guide_proposedOverallWidth', '<strong>Door check:</strong> Enter required seat width to estimate overall wheelchair width, then enter measured clear door openings to trigger the access flag.')
      }
      $('guide_proposedOverallWidth')?.classList.toggle('access-warning', accessEscalation)
      setGuide('guide_reqSeatDepth', c.depth ? `<strong>Auto-start:</strong> ${roundTo(c.depth - (c.depth >= 430 ? 50 : 35))} mm from buttock/thigh depth A ${c.depth} mm, allowing posterior knee clearance. Overwrite after cushion/backrest and simulated posture are confirmed.` : '<strong>Auto-start:</strong> Enter buttock/thigh depth A to calculate starting seat depth.')
      setGuide('guide_reqSeatHeight', c.lowerLeg ? `<strong>Auto-start:</strong> ${roundTo(c.lowerLeg + 25)} mm from lower leg length B ${c.lowerLeg} mm + approx. footwear/clearance allowance. Confirm whether supplier measures to seat pan or cushion top.` : '<strong>Auto-start:</strong> Enter lower leg length B to calculate starting front seat height.')
      const backText = suggestedBackHeight(c)
      setGuide('guide_reqBackHeight', backText ? `<strong>Auto-start:</strong> ${backText}. Overwrite based on trunk control, propulsion, lateral support, head support and comfort during trial.` : '<strong>Auto-start:</strong> Enter PSIS, inferior scapula, axilla, shoulder and head measurements to guide support height.')
      setGuide('guide_cushionProfile', (c.pressureRisk || c.fullTime || c.poorBalance) ? '<strong>Auto-start:</strong> High profile selected because pressure risk, full-time use or reduced sitting balance is present. Overwrite if transfer height, propulsion, posture or supplier cushion choice requires.' : '<strong>Auto-start:</strong> Low profile selected as a simple starting point where pressure risk is not yet identified. Overwrite if skin, stability or posture needs require more immersion/contour.')
      setGuide('guide_headSupport', (c.poorBalance || rad('travelPosition') === 'In wheelchair' || c.powerSeatFunctions.some(v => /tilt|recline/i.test(v))) ? '<strong>Auto-start:</strong> Head support selected because balance, transport or power seat functions may require it. Confirm by trial.' : '<strong>Auto-start:</strong> No head support selected unless balance, transport, fatigue, recline/tilt or positioning indicates otherwise.')
      setGuide('guide_proposedCushion', c.pressureRisk ? '<strong>Reasoning:</strong> Skin/sensation findings require explicit pressure-distribution, relief routine and follow-up skin review.' : '<strong>Reasoning:</strong> Match cushion to pelvic stability, posture, transfers, sitting tolerance and daily use.')
      setGuide('guide_proposedBackrest', c.complexPosture ? '<strong>Reasoning:</strong> Postural findings require backrest contour/support decisions from MAT: correct, partially correct or accommodate.' : '<strong>Reasoning:</strong> Match backrest height and contour to trunk control, arm function, comfort and propulsion/reach.')
      setGuide('guide_seatAngleTilt', (c.pressureRisk || c.poorBalance || c.complexPosture) ? '<strong>Reasoning:</strong> Tilt/seat angle may be needed for pressure, stability, fatigue or supported sitting. Confirm effect on function and transfers.' : '<strong>Reasoning:</strong> Keep simple unless mild dump/tilt improves stability or function.')
      setGuide('guide_backrestRecline', (c.pressureRisk || c.powerSeatFunctions.some(v => /recline/i.test(v))) ? '<strong>Reasoning:</strong> Recline can assist rest/care but can also increase shear/sliding. Trial with tilt and belt position.' : '<strong>Reasoning:</strong> Use recline only if it has a clear functional, care or comfort purpose.')
      setGuide('guide_legrestAngle', c.lowerLeg || c.externalKnee || c.ankleWidth ? `<strong>Measurement link:</strong> Lower leg B ${c.lowerLeg || '-'} mm, external knee width N ${c.externalKnee || '-'} mm and ankle/foot width P ${c.ankleWidth || '-'} mm guide leg support, hanger angle and footplate width.` : '<strong>Measurement link:</strong> Enter lower leg B, knee N and foot/ankle P measurements to guide leg support.')
      setGuide('guide_armSupport', c.seatToElbow ? `<strong>Auto-start:</strong> Use seat-to-elbow E ${c.seatToElbow} mm to trial armrest/arm-trough height. Overwrite if shoulder posture, transfers, tray/table access or propulsion require.` : '<strong>Auto-start:</strong> Enter seat-to-elbow E to guide arm support height.')
    }

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
    }

    function card(title, items, risk = '') {
      if (!items || !items.length) return ''
      return `<div class="guidance-card ${risk}"><h4>${escapeHtml(title)}</h4><ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>`
    }

    function missing(items) {
      return items.filter(([, idOrFn]) => typeof idOrFn === 'function' ? !idOrFn() : !val(idOrFn)).map(x => x[0])
    }

    function renderGuidance() {
      const highRisk = []
      const pathway = []
      const posture = []
      const measurement = []
      const trial = []
      const gaps = []

      if (boolHighRiskPressure()) highRisk.push('Skin/pressure risk is active or likely. Prioritise cushion selection, pressure relief strategy, skin check/wound care input where indicated, and follow-up after delivery.')
      if (rad('currentPI') === 'Yes') highRisk.push('Current pressure injury: avoid final equipment decisions without clear wound plan and pressure-management rationale. Consider pressure mapping or specialist seating input where available.')
      if (rad('sittingBalance') === 'Unable to sit without support' || rad('sittingBalance') === 'Sitting with propping') highRisk.push('Reduced sitting balance: backrest height, lateral support, pelvic stability, tilt and caregiver access need explicit trial goals.')
      if (hasComplexPosture()) highRisk.push('Postural asymmetry/deformity recorded. Use MAT findings to decide whether to correct toward midline, partially correct, or accommodate. Do not simulate beyond available ROM.')
      if (checks('impairment').includes('Cognitive') || checks('impairment').includes('Sensory')) highRisk.push('Cognitive/sensory issues affect mobility safety, training requirements and carer controls. Document screening and risk controls.')
      if (rad('conditionStatus') === 'Deteriorating' || rad('conditionStatus') === 'Fluctuating') highRisk.push('Condition is not stable. Consider adjustability, future growth/change, review timing and funding justification for changing needs.')
      if (rad('travelPosition') === 'In wheelchair') highRisk.push('Transport in wheelchair requires confirmation of wheelchair tie-down/occupant restraint compatibility and transport assessment.')
      const doorWidth = narrowestDoorWidth()
      const overallWidth = proposedWheelchairWidth()
      if (overallWidth && doorWidth && overallWidth >= doorWidth) highRisk.push(`Doorway access escalation: proposed overall wheelchair width ${overallWidth} mm is equal to or greater than the narrowest recorded door width ${doorWidth} mm. Do not finalise quote until total chair width, clear opening, door swing, hand rims/tyres, thresholds and turning approach are confirmed.`)
      if (hasBariatricFlag()) highRisk.push('Bariatric flag recorded. Check safe working load, tissue distribution, cushion loading, seat width/depth, transfer method, doorway clearance, hoist/handling plan and follow-up pressure review.')

      const wcTime = rad('wcTime')
      const propulsion = rad('propulsion')
      if (rad('proposedPathway')) pathway.push(`Clinician-selected pathway: ${rad('proposedPathway')}. Use this as a trial direction, not the final prescription, until function/environment/fit are verified.`)
      else if (boolHighRiskPressure() || hasComplexPosture() || wcTime === 'Full-time use') pathway.push('Likely needs scripted seating rather than a basic loan/hire chair because risk, posture or full-time use increases the cost of a poor fit.')
      else if (propulsion === 'Dependent') pathway.push('Dependent mobility: consider attendant-propelled manual or manual tilt-in-space depending goals, pressure needs and carer capacity.')
      else if (propulsion.includes('Independent')) pathway.push('Independent propulsion: prioritise efficient configuration, seat-to-floor height, rear axle position, shoulder preservation, access to brakes/wheels and real-world terrain trial.')
      else pathway.push('Enter propulsion, wheelchair-use duration and goals to sharpen likely equipment pathway.')
      if (checks('externalTerrain').some(v => ['Grass/soft ground', 'Gravel/dirt', 'Uneven terrain', 'Hills', 'Steep ramps', 'Curbs'].includes(v))) pathway.push('Environment includes difficult terrain/gradients. Trial castor/wheel size, tyre type, frame setup or power assist in the real environment where possible.')
      if (checks('manualAccessories').includes('Power assist required') || rad('proposedPathway') === 'Manual chair plus power assist') pathway.push('Power assist reasoning should link to fatigue, shoulder preservation, slopes, community distance, independence and ability to manage setup/charging/transport.')

      if (rad('pelvisSag') === 'Posterior pelvic tilt' || rad('supinePelvicTilt') === 'Posterior pelvic tilt') posture.push('Posterior pelvic tilt: check seat depth, hamstring length, pelvic belt angle, lumbar support, pre-ischial contour and seat-to-back angle.')
      if (rad('pelvisSag') === 'Anterior pelvic tilt' || rad('supinePelvicTilt') === 'Anterior pelvic tilt') posture.push('Anterior pelvic tilt/lordosis: check pelvic stability, anterior trunk support needs, cushion contour and whether hip flexor tightness limits neutral sitting.')
      if (rad('pelvisFront') && rad('pelvisFront') !== 'Neutral') posture.push('Pelvic obliquity: decide whether it is reducible. Reducible may need gentle correction/support; fixed usually needs accommodation to avoid pressure concentration.')
      if (rad('pelvisTrans') && rad('pelvisTrans') !== 'Neutral') posture.push('Pelvic rotation: consider cushion contour, pelvic/thigh guides, lateral supports and foot positioning to prevent migration.')
      if (checks('spineCervical').some(v => v.includes('Scoliosis'))) posture.push('Scoliosis: start from pelvic position, then trial backrest contour/laterals to support trunk while preserving reach, respiration, comfort and transfers.')
      if (checks('spineCervical').includes('Thoracic kyphosis')) posture.push('Thoracic kyphosis: check backrest shape/height, head/neck posture, gaze, swallowing/respiration and ability to reach/propel.')
      if (checks('lowerExt').some(v => v.includes('Wind'))) posture.push('Windswept/asymmetrical lower limbs: confirm overall width, thigh/foot support, cushion contour and whether chair width must accommodate asymmetry without excessive overall width.')
      if (!posture.length) posture.push('Postural guidance will appear here as pelvis, spine, lower-limb and MAT fields are completed.')

      const hip = maxPair('M')
      const depth = maxPair('A')
      const leg = maxPair('B')
      if (hip) measurement.push(`Hip width entered: ${hip} mm. Seat width commonly starts slightly wider than measured hip width to allow clothing and tissue clearance, then is refined against posture, transfers, hand access and supplier sizing.`)
      if (depth) measurement.push(`Buttock/thigh depth entered: ${depth} mm. Seat depth should support the thigh without loading behind the knee; verify with cushion/backrest choice and proposed pelvic position.`)
      if (leg) measurement.push(`Lower leg length entered: ${leg} mm. Seat-to-floor and footplate height must account for cushion height, footwear, footplate clearance and propulsion/transfer method.`)
      if (val('reqSeatWidth') || val('reqSeatDepth') || val('reqSeatHeight')) measurement.push('Required product dimensions have been entered. Confirm whether these are body measurements, final chair dimensions, or trial starting points before sending to supplier.')
      if (val('reqSeatWidth') && overallWidth) measurement.push(`Estimated overall wheelchair width: ${overallWidth} mm from seat width ${val('reqSeatWidth')} mm + 200 mm allowance unless the supplier outside-to-outside width has been manually entered.`)
      if (hasBariatricFlag()) measurement.push(`Bariatric features recorded${checks('bariatricFeatures').length ? `: ${join(checks('bariatricFeatures'))}` : ''}. Validate the auto-calculated seat dimensions against tissue distribution, pannus/gluteal shelf, thigh position, postural support, safe working load and pressure care strategy.`)
      if (overallWidth && doorWidth && overallWidth < doorWidth) measurement.push(`Doorway check: proposed overall wheelchair width ${overallWidth} mm is narrower than the narrowest recorded door width ${doorWidth} mm. Still confirm clear opening, hand rims/tyres, thresholds and approach during trial.`)
      if (!hip && !depth && !leg) measurement.push('Enter proposed-position measurements A, B and M early. These drive seat depth, lower-leg/seat-to-floor setup and seat width decisions.')

      trial.push('Ask suppliers to respond with trial availability, itemised quote, product constraints, lead time, setup/fitting requirements and maintenance pathway.')
      if (checks('trialLocations').length) trial.push(`Trial location(s) selected: ${join(checks('trialLocations'))}. Make sure each location tests a specific goal or risk.`)
      if (checks('externalTerrain').length || val('steepestSlope')) trial.push('Trial must include the hardest expected terrain/slope or a safe equivalent before finalising wheel/base configuration.')
      if (val('doorWidths') || val('turningCircles')) trial.push('Compare estimated/proposed overall wheelchair width and turning radius against measured clear door widths and turning spaces before quote finalisation.')
      if (rad('travelPosition')) trial.push('Transport plan should be checked during trial/fitting, including transfer method or wheelchair transport restraints.')
      if (checks('trainingChecklist').length) trial.push('Training items are selected; ensure the supplier/fitting plan identifies who trains the client/carers and when follow-up occurs.')

      missing([
        ['client goals', 'mobilityGoals'], ['funding pathway', 'fundingBody'], ['weight', 'weight'], ['pressure history/sensation', () => rad('historyPI') && rad('sensation')],
        ['proposed-position measurements', () => val('measA_L') || val('measM_L') || val('measM_R')], ['propulsion status', () => rad('propulsion') || rad('proposedPathway')],
        ['environment constraints', () => val('doorWidths') || checks('externalTerrain').length || val('communityEnvironment')], ['overall wheelchair width for door check', () => !val('doorWidths') || proposedWheelchairWidth()], ['trial equipment', 'trialEquipment'],
      ]).forEach(g => gaps.push(g))

      let html = ''
      html += card('Escalation / risk flags', highRisk.length ? highRisk : ['No major risk flags yet. Continue completing skin, posture, cognition/sensation, environment and transport fields before relying on this.'], highRisk.length ? 'risk-high' : 'risk-low')
      html += card('Likely equipment reasoning', pathway, pathway.length > 1 ? 'risk-mod' : '')
      html += card('Posture and seating reasoning', posture, hasComplexPosture() ? 'risk-mod' : '')
      html += card('Measurement checks', measurement, '')
      html += card('Trial and supplier handover priorities', trial, '')
      html += card('Missing information before supplier handover', gaps.length ? gaps.map(g => `Add: ${g}.`) : ['Core supplier handover fields are reasonably complete.'], gaps.length ? 'risk-mod' : 'risk-low')
      const guidance = $('guidanceOutput')
      if (guidance) guidance.innerHTML = html
    }

    function buildSupplierBriefHTML() {
      const lines = buildSupplierBriefText().split('\n')
      const sections = []
      let current = null
      lines.forEach(raw => {
        const cleanLine = raw.trim()
        if (!cleanLine || /^=+$/.test(cleanLine)) return
        if (cleanLine === 'WHEELCHAIR PRESCRIPTION - SUPPLIER BRIEF') return
        if (/^\d+\.\s+/.test(cleanLine)) {
          current = { heading: cleanLine, rows: [] }
          sections.push(current)
          return
        }
        if (!current) return
        const idx = cleanLine.indexOf(':')
        if (idx > 0 && idx < 80) current.rows.push({ label: cleanLine.slice(0, idx), value: cleanLine.slice(idx + 1).trim() })
        else current.rows.push({ label: '', value: cleanLine })
      })
      const client = escapeHtml(val('clientName') || 'Client not entered')
      const date = escapeHtml(val('assessmentDate') || new Date().toLocaleDateString())
      let html = `<div class="print-title"><h1>Wheelchair Prescription - Supplier Brief</h1><p>${client} - ${date} - generated from assessment tool</p></div>`
      html += '<div class="print-note"><strong>Clinical note:</strong> This supplier brief is generated from the assessment form. Auto-calculated dimensions are starting points only and must be checked against posture, pressure care, function, transfers, supplier measurement conventions and trial outcomes.</div>'
      sections.forEach(sec => {
        html += `<section class="print-section"><h2>${escapeHtml(sec.heading)}</h2>`
        sec.rows.forEach(row => {
          if (row.label) html += `<div class="print-row"><div class="print-label">${escapeHtml(row.label)}</div><div class="print-value">${escapeHtml(row.value)}</div></div>`
          else html += `<div class="print-paragraph">${escapeHtml(row.value)}</div>`
        })
        html += '</section>'
      })
      return html
    }

    function updateManualSourceSummary() {
      const el = $('manualSourceSummary')
      if (!el) return
      const pathway = rad('proposedPathway') || 'No prescription pathway selected yet'
      const selectedManual = join(checks('manualCurrentType')) || 'No manual chair class selected in Section 2 yet'
      el.innerHTML = `<strong>Linked source:</strong> Proposed pathway: ${escapeHtml(pathway)}. Manual chair class already captured in Section 2: ${escapeHtml(selectedManual)}. Use the configuration notes below to specify the proposed frame setup, axle/CxG, transport needs, material and trial changes.`
    }

    function toggleSection(sectionId, button) {
      const section = $(sectionId)
      if (!section) return
      const collapsed = section.classList.toggle('is-collapsed')
      if (button) button.textContent = collapsed ? 'Expand' : 'Minimise'
    }

    function setAllSectionsCollapsed(collapsed = true) {
      qsa('.section').forEach(section => {
        section.classList.toggle('is-collapsed', collapsed)
        const btn = section.querySelector('.section-toggle')
        if (btn) btn.textContent = collapsed ? 'Expand' : 'Minimise'
      })
    }

    function setInitialSectionState() {
      qsa('.section').forEach((section, index) => {
        const collapsed = index !== 0
        section.classList.toggle('is-collapsed', collapsed)
        const btn = section.querySelector('.section-toggle')
        if (btn) btn.textContent = collapsed ? 'Expand' : 'Minimise'
      })
    }

    function toggleBariatricPanel() {
      const panel = $('bariatricPanel')
      const flag = $('bariatricFlag')
      if (panel) panel.hidden = !(flag && flag.checked)
    }

    function syncConditionalPanels() {
      toggleBariatricPanel()
    }

    function saveFormState() {
      const formState = collectFormStateFromRoot(root)
      const updatedAt = new Date().toISOString()
      const existing = readPersistentDraft(storageKey)
      writePersistentDraft(storageKey, {
        ...formState,
        meta: {
          ...(existing?.meta || {}),
          schemaVersion: WHEELCHAIR_PRESCRIPTION_SCHEMA_VERSION,
          updatedAt,
          sourceVersionId: activeVersionIdRef.current,
        },
      })
      setDraftStatus({
        tone: activeVersionIdRef.current ? 'muted' : 'warning',
        title: 'Local autosave current',
        detail: activeVersionIdRef.current
          ? `Local edits saved ${formatDateTime(updatedAt)}. Save a new version when the script reaches a useful checkpoint.`
          : `Local draft saved ${formatDateTime(updatedAt)}. Save a patient-record version when ready.`,
      })
    }

    function restoreFormState() {
      const localDraft = readPersistentDraft(storageKey)
      const savedFormState = getFormStateFromAssessment(latestSavedVersion)
      const localAt = getFormStateUpdatedAt(localDraft)
      const savedAt = getRecordSavedAt(latestSavedVersion)
      const localSavedCheckpoint = localDraft?.meta?.savedAt || ''
      const localMatchesLatestVersion = !!(localDraft?.meta?.sourceVersionId && localDraft.meta.sourceVersionId === latestSavedVersion?.id)
      const localHasNewerEdits = !!(localAt && localSavedCheckpoint && new Date(localAt) > new Date(localSavedCheckpoint))
      const useLocal = !!localDraft && (
        !savedFormState ||
        (
          new Date(localAt || 0) >= new Date(savedAt || 0) &&
          (!localMatchesLatestVersion || localHasNewerEdits)
        )
      )
      const selectedState = useLocal ? localDraft : savedFormState
      if (!selectedState) return false

      const restored = applyFormStateToRoot(root, selectedState)
      if (!restored) return false

      const sourceVersionId = useLocal
        ? selectedState?.meta?.sourceVersionId || null
        : latestSavedVersion?.id || null
      setActiveVersionId(sourceVersionId)
      activeVersionIdRef.current = sourceVersionId
      setDraftStatus(useLocal
        ? {
            tone: sourceVersionId ? 'muted' : 'warning',
            title: 'Local draft restored',
            detail: localAt
              ? `Restored local autosave from ${formatDateTime(localAt)}. Save a new patient-record version when ready.`
              : 'Restored local autosave. Save a patient-record version when ready.',
          }
        : {
            tone: 'success',
            title: 'Latest patient version restored',
            detail: `Loaded saved version from ${formatDateTime(savedAt)}. Continue refining from here.`,
          })
      return true
    }

    function prefillFromPatient() {
      return applyPatientDetailsToForm(root, patient, { overwrite: true })
    }

    function updateAll(shouldSave = true) {
      syncConditionalPanels()
      updateDimensionGuidance()
      const supplierBrief = $('supplierBrief')
      if (supplierBrief) supplierBrief.textContent = buildSupplierBriefText()
      renderGuidance()
      updateManualSourceSummary()
      if (shouldSave) saveFormState()
    }

    function writeClipboard(text, successMessage) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => window.alert(successMessage))
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
        window.alert(successMessage)
      }
    }

    function copySupplierBrief() {
      writeClipboard(buildSupplierBriefText(), 'Supplier brief copied.')
    }

    function copyClinicalReasoningGuide() {
      renderGuidance()
      const text = $('guidanceOutput') ? $('guidanceOutput').innerText.trim() : ''
      const headerParts = ['CLINICAL REASONING GUIDE']
      if (val('clientName')) headerParts.push(`Client: ${val('clientName')}`)
      if (val('assessmentDate')) headerParts.push(`Date: ${val('assessmentDate')}`)
      writeClipboard(`${headerParts.join('\n')}\n\n${text || 'No clinical reasoning generated yet. Complete the assessment fields first.'}`, 'Clinical reasoning guide copied.')
    }

    function printSupplierBrief() {
      const printSupplier = $('printSupplier')
      if (!printSupplier) return
      printSupplier.innerHTML = buildSupplierBriefHTML()
      document.body.dataset.wcPrint = 'supplier'
      setTimeout(() => window.print(), 50)
    }

    function printAssessmentForm() {
      document.body.dataset.wcPrint = 'assessment'
      setTimeout(() => window.print(), 50)
    }

    function clearForm() {
      if (!window.confirm('Clear all entered data from this form?')) return
      $('wcForm')?.reset()
      autoCalcIds.forEach(id => {
        const el = $(id)
        if (el) {
          delete el.dataset.auto
          delete el.dataset.manual
        }
      })
      try {
        removePersistentDraft(storageKey)
      } catch {}
      setActiveVersionId(null)
      setDraftStatus({
        tone: 'warning',
        title: 'Draft cleared',
        detail: 'The local workspace is empty. Saved patient-record versions remain available in the progress panel.',
      })
      updateAll(false)
    }

    function initialiseFormState() {
      $('wcForm')?.reset()
      const restored = restoreFormState()
      const prefilled = prefillFromPatient()
      setInitialSectionState()
      updateAll(!restored || prefilled)
    }

    const form = $('wcForm')
    const handleFormChange = () => updateAll(true)
    const handleAfterPrint = () => {
      document.body.dataset.wcPrint = ''
    }

    initAutoCalcTracking()
    form?.addEventListener('input', handleFormChange)
    form?.addEventListener('change', handleFormChange)
    window.addEventListener('afterprint', handleAfterPrint)

    const globals = {
      toggleSection,
      toggleBariatricPanel,
      reapplyAutoCalculations,
      copySupplierBrief,
      copyClinicalReasoningGuide,
      printSupplierBrief,
      printAssessmentForm,
      clearForm,
      refreshWheelchairPrescription: updateAll,
      getWheelchairSupplierBrief: buildSupplierBriefText,
      getWheelchairFormState: () => collectFormStateFromRoot(root),
    }
    Object.assign(window, globals)
    initialiseFormState()

    return () => {
      form?.removeEventListener('input', handleFormChange)
      form?.removeEventListener('change', handleFormChange)
      window.removeEventListener('afterprint', handleAfterPrint)
      Object.entries(globals).forEach(([key, fn]) => {
        if (window[key] === fn) delete window[key]
      })
    }
  }, [latestSavedVersion, patient?.diagnosis, patient?.dob, patient?.initials, storageKey])

  return (
    <section className="wc-tool" ref={rootRef}>
      <style>{wheelchairToolStyles}</style>
      <div className="wc-tool__header">
        <div className="wc-tool__header-main">
          <span className="wc-tool__eyebrow">Clinical Support Tool</span>
          <h2>Prescription Workspace</h2>
          <p>Decision support only. Confirm recommendations through trial, clinical review, supplier specifications and local funding requirements.</p>
          <div className="wc-tool__patient-picker">
            <label className="wc-tool__patient-field" htmlFor="wcPatientSelect">
              <span>Patient</span>
              <select
                id="wcPatientSelect"
                value={selectedPatientId}
                onChange={handlePatientChange}
                disabled={patients.length === 0}
              >
                <option value="" disabled>{patients.length ? 'Select patient' : 'No patients available'}</option>
                {patients.map(item => (
                  <option key={item.id} value={item.id}>{formatPatientOption(item)}</option>
                ))}
              </select>
            </label>
            {patient && (
              <div className="wc-tool__patient-meta" aria-live="polite">
                <span>{patient.diagnosis || 'Diagnosis not recorded'}</span>
                <span>{formatPatientDob(patient) || 'DOB not recorded'}</span>
              </div>
            )}
          </div>
        </div>
        <div className="brand-iq-mark wc-tool__iq-mark" aria-hidden="true">IQ</div>
        <div className="wc-tool__actions">
          <button
            type="button"
            data-primary=""
            disabled={!canSaveToPatient || saveState === 'saving'}
            onClick={handleSaveVersion}
            title={canSaveToPatient ? 'Save this workspace as a new patient-record version' : 'Select a patient to save versions'}
          >
            <Save size={15} /> {saveState === 'saving' ? (
              <span className="button-loading">
                <ThreeBarMotif size="xs" tone="light" loading label="Saving wheelchair prescription" />
                Saving...
              </span>
            ) : saveState === 'saved' ? 'Saved' : 'Save progress'}
          </button>
          <button type="button" onClick={() => window.copySupplierBrief?.()}>
            <ClipboardCopy size={15} /> Supplier brief
          </button>
          <button type="button" onClick={() => window.copyClinicalReasoningGuide?.()}>
            <FileText size={15} /> Reasoning guide
          </button>
          <button type="button" onClick={() => window.printSupplierBrief?.()}>
            <Printer size={15} /> Brief
          </button>
          <button type="button" onClick={() => window.printAssessmentForm?.()}>
            <Printer size={15} /> Form
          </button>
          <button type="button" data-danger="" onClick={() => window.clearForm?.()}>
            <RotateCcw size={15} /> Clear
          </button>
        </div>
      </div>
      <WheelchairPrescriptionForm
        activeVersionId={activeVersionId}
        canSaveToPatient={canSaveToPatient}
        draftStatus={draftStatus}
        latestSavedVersion={latestSavedVersion}
        onLoadVersion={handleLoadVersion}
        saveError={saveError}
        savedVersions={savedVersions}
      />
      <div className="wc-tool__print-supplier" id="printSupplier" />
    </section>
  )
}

function WheelchairPrescriptionForm({ activeVersionId, canSaveToPatient, draftStatus, latestSavedVersion, onLoadVersion, saveError, savedVersions }) {
  return (
    <div className="wc-tool__content">
      <form autoComplete="off" className="main-panel" id="wcForm">
        <FormSection
          id="section1"
          title="Section 1: Client profile, medical background and goals"
          description="Captures the reason for referral, person-context and clinical risks that must shape any equipment direction."
        >
          <Grid>
            <TextField id="clientName" label="Client name" span="span-4" />
            <TextField id="assessmentDate" label="Date of assessment" type="date" span="span-4" />
            <TextField id="dob" label="DOB" type="date" span="span-2" />
            <TextField id="weight" label="Weight kg" type="number" min="0" step="0.1" span="span-2" />
            <TextField id="primaryDx" label="Primary diagnosis" span="span-6" />
            <TextField id="otherDx" label="Other relevant diagnosis" span="span-6" />
            <TextField id="fundingBody" label="Funding body / pathway" placeholder="public program, insurance, hospital, private, other" span="span-4" />
            <TextField id="reasonReferral" label="Reason for referral" placeholder="New prescription, replacement, review, pressure/posture concern, discharge planning" span="span-8" />
            <TextAreaField id="mobilityGoals" label="Mobility and seating related goals" placeholder="What must the wheelchair enable? Include home, community, care, work/education, transport and discharge goals." span="span-12" />
          </Grid>

          <Subhead>Client context</Subhead>
          <Grid compact>
            <TextField id="productivity" label="Productivity roles" placeholder="work / volunteering / education / caring" span="span-4" />
            <TextField id="recreation" label="Recreation and community interests" span="span-4" />
            <TextField id="carerComments" label="Carer comments" span="span-4" />
            <OptionGroup title="Remoteness" name="remoteness" options={OPTIONS.remoteness} span="span-4" columns="two" />
            <OptionGroup title="Amount of time in wheelchair" name="wcTime" options={OPTIONS.wcTime} span="span-4" columns="two" />
            <OptionGroup title="Carer/s" name="carers" type="checkbox" options={OPTIONS.carers} span="span-4" columns="two" />
          </Grid>

          <Subhead>Medical background</Subhead>
          <Grid compact>
            <OptionGroup title="Cause" name="cause" options={OPTIONS.cause} span="span-4" columns="two" />
            <OptionGroup title="Impairment" name="impairment" type="checkbox" options={OPTIONS.impairment} span="span-4" columns="two" />
            <OptionGroup title="Condition" name="conditionStatus" options={OPTIONS.conditionStatus} span="span-4" columns="two" />
            <TextAreaField id="historyOnset" label="History / onset" span="span-6" />
            <TextAreaField id="medicalPrecautions" label="Medication / precautions / other related assessments" placeholder="Include hip precautions, epilepsy, pain, home mods, FIM/FCA, gait/transfer assessment, behavioural support etc." span="span-6" />
          </Grid>

          <Subhead>Pressure injury history and skin risk</Subhead>
          <Grid compact>
            <OptionGroup title="History of pressure injury" name="historyPI" options={OPTIONS.yesNo} span="span-3" columns="two" />
            <OptionGroup title="Sensation" name="sensation" options={OPTIONS.sensation} span="span-3" />
            <OptionGroup title="Current pressure injury" name="currentPI" options={OPTIONS.yesNo} span="span-3" columns="two" />
            <OptionGroup title="Requires wound care referral" name="woundReferral" options={OPTIONS.yesNo} span="span-3" columns="two" />
            <TextField id="piStage" label="PI stage / staged by" span="span-3" />
            <TextField id="piLocation" label="Location" span="span-3" />
            <SelectField id="seatingRelated" label="Seating related?" options={OPTIONS.yesNoUnknown} span="span-3" />
            <SelectField id="seatingRiskFactors" label="Risk factors related to seating?" options={OPTIONS.yesNoUnknown} span="span-3" />
            <TextAreaField id="pressureManagement" label="Current management strategies and AT" placeholder="Cushion, repositioning routine, wound plan, skin checks, hoist/transfer approach, tilt/recline use, bed surfaces." span="span-12" />
            <div className="span-12 pressure-actions">
              <label className="check bariatric-flag">
                <input id="bariatricFlag" name="bariatricFlag" type="checkbox" value="Bariatric flag" />
                Flag bariatric considerations
              </label>
            </div>
            <div className="span-12 conditional-panel" hidden id="bariatricPanel">
              <Subhead inline>Bariatric features</Subhead>
              <Grid compact className="wc-tool__nested-grid">
                <OptionGroup title="Bariatric features" name="bariatricFeatures" type="checkbox" options={OPTIONS.bariatricFeatures} span="span-12" />
              </Grid>
            </div>
          </Grid>
        </FormSection>

        <FormSection
          id="section2"
          defaultCollapsed
          title="Section 2: Proposed-position measurements and current seating/mobility base"
          description="Measurements are placed first so the supplier-ready output starts with what suppliers most need to size and shortlist trial equipment."
        >
          <Subhead>Client measurements in proposed position</Subhead>
          <div className="measurement-layout">
            <div>
              <MeasurementTable />
              <TextAreaField id="overallWidthNotes" label="Overall width / asymmetrical width notes" placeholder="Include windswept legs, scoliosis, thigh position, abducted/adducted posture, pannus/gluteal shelf implications." className="wc-tool__field-offset" />
            </div>
            <div className="measurement-side">
              <div className="visual-card body-chart-card">
                <img alt="Body landmark reference chart for A-P seating measurements" className="body-chart-img" src="/assets/wheelchair-prescription/body-landmark-reference.png" />
                <div className="visual-caption">Body landmark reference for A-P measurements. Use the proposed seated posture for dimensions and document accommodated overall width where posture or tissue shape changes fit.</div>
              </div>
              <div className="note">Use the proposed seated posture for measurements before sending through seat width, seat depth, back height and support requirements. If posture is asymmetrical, document the accommodated overall width in the notes.</div>
            </div>
          </div>

          <Subhead>Current seating base</Subhead>
          <Grid compact>
            <OptionGroup title="Seating base" name="seatingBase" options={['Manual', 'Power']} span="span-3" columns="two" />
            <TextField id="currentModel" label="Current manufacturer/model" span="span-5" />
            <TextField id="baseAge" label="Age of base" span="span-2" />
            <TextField id="baseCondition" label="Condition" span="span-2" />
            <OptionGroup title="Current wheelchair base" name="currentBaseMeets" options={['Meets needs', 'No longer meets needs']} span="span-3" columns="two" />
            <TextAreaField id="currentBaseComments" label="Client comments about current base" span="span-9" />
          </Grid>

          <Subhead>Current seating and mobility base - manual</Subhead>
          <div className="selection-cards">
            {MANUAL_SELECTIONS.map(card => <SelectionCard key={card.value} {...card} type="checkbox" name="manualCurrentType" />)}
          </div>

          <div className="manual-propulsion-layout manual-power-notes">
            <OptionPanel title="Propulsion">
              <OptionChoices name="propulsion" options={OPTIONS.propulsion} columns="two" />
            </OptionPanel>
            <OptionPanel title="Power add-on / assist">
              <OptionChoices name="powerAddon" type="checkbox" options={OPTIONS.powerAddon} columns="four" />
              <TextField id="powerAddonOther" label="Other power add-on details" className="manual-power-notes" />
            </OptionPanel>
          </div>

          <Subhead>Current seating and mobility base - power</Subhead>
          <div className="selection-cards">
            {POWER_DRIVE_SELECTIONS.map(card => <SelectionCard key={card.value} {...card} type="radio" name="driveConfig" />)}
          </div>
          <Grid compact className="manual-power-notes">
            <TextField id="currentSeatWidth" label="Current seat width mm" type="number" min="0" step="1" span="span-3" />
            <TextField id="currentSeatDepth" label="Current seat depth mm" type="number" min="0" step="1" span="span-3" />
            <OptionGroup title="Current power seat functions" name="currentSeatFunctions" type="checkbox" options={OPTIONS.currentSeatFunctions} span="span-6" columns="four" />
          </Grid>

          <Subhead>Current seating system and accessories</Subhead>
          <Grid compact>
            <TextField id="currentCushion" label="Current cushion" span="span-4" />
            <TextField id="currentCushionSize" label="Cushion size" span="span-3" />
            <SelectField id="currentCushionMeets" label="Cushion meets needs?" options={OPTIONS.meetsNeeds} span="span-3" />
            <TextField id="currentCushionNotes" label="Cushion notes" span="span-2" />
            <TextField id="currentBackrest" label="Current backrest" span="span-4" />
            <TextField id="currentBackrestSize" label="Backrest size" span="span-3" />
            <SelectField id="backrestHardware" label="Backrest hardware" options={OPTIONS.backrestHardware} span="span-2" />
            <SelectField id="currentBackrestMeets" label="Backrest meets needs?" options={OPTIONS.meetsNeeds} span="span-3" />
            <OptionGroup title="Current accessories" name="currentAccessories" type="checkbox" options={OPTIONS.currentAccessories} span="span-12" columns="four" />
            <TextAreaField id="currentSeatingInfo" label="Current seating information / issues" span="span-12" />
          </Grid>
        </FormSection>

        <FormSection
          id="section3"
          defaultCollapsed
          title="Section 3: Functional assessment, seated posture and MAT"
          description="Records what the client can do, how they sit now, what is reducible, and what the proposed posture needs to accommodate or support."
        >
          <Subhead>Current seated position</Subhead>
          <Grid compact className="mat-grid">
            <OptionGroup title="Pelvis sagittal" name="pelvisSag" options={OPTIONS.pelvisSag} span="span-4" />
            <OptionGroup title="Pelvis frontal" name="pelvisFront" options={OPTIONS.pelvisFront} span="span-4" />
            <OptionGroup title="Pelvis transverse" name="pelvisTrans" options={OPTIONS.pelvisTrans} span="span-4" />
            <TextAreaField id="pelvisNotes" label="Pelvic position notes" span="span-12" />
            <OptionGroup title="Lower extremity / foot posture" name="lowerExt" type="checkbox" options={OPTIONS.lowerExt} span="span-6" columns="four" />
            <OptionGroup title="Spine, cervical and shoulder posture" name="spineCervical" type="checkbox" options={OPTIONS.spineCervical} span="span-6" columns="four" />
            <TextAreaField id="postureImpactNotes" label="Impact on pressure, function, comfort or equipment fit" span="span-12" />
          </Grid>

          <Subhead>Functional activities</Subhead>
          <ActivityTable />

          <Subhead>Home, community and transport environment</Subhead>
          <Grid compact>
            <OptionGroup title="Household" name="household" options={OPTIONS.household} span="span-3" columns="two" />
            <OptionGroup title="Support" name="support" options={OPTIONS.support} span="span-5" />
            <TextField id="formalSupport" label="Formal support details" span="span-4" />
            <TextField id="doorWidths" label="Door widths / clear openings" span="span-3" />
            <TextField id="thresholds" label="Thresholds / steps" span="span-3" />
            <TextField id="turningCircles" label="Turning circles / tight spaces" span="span-3" />
            <TextField id="surfaceHeights" label="Bed/chair/toilet heights" span="span-3" />
            <OptionGroup title="Internal surfaces" name="internalSurfaces" type="checkbox" options={OPTIONS.internalSurfaces} span="span-4" columns="two" />
            <OptionGroup title="External terrain" name="externalTerrain" type="checkbox" options={OPTIONS.externalTerrain} span="span-8" columns="four" />
            <TextField id="steepestSlope" label="Steepest ramp / slope" span="span-4" />
            <TextAreaField id="communityEnvironment" label="Community environment notes" span="span-8" />
            <OptionGroup title="Transport" name="transport" type="checkbox" options={OPTIONS.transport} span="span-6" columns="three" />
            <OptionGroup title="Travel position" name="travelPosition" options={OPTIONS.travelPosition} span="span-6" />
            <TextAreaField id="transportDetails" label="Transport details / restraints / vehicle access" span="span-12" />
          </Grid>

          <Subhead>Supine MAT evaluation and sitting balance</Subhead>
          <Grid compact className="mat-grid">
            <OptionGroup title="MAT completed on plinth" name="matCompleted" options={OPTIONS.yesNo} span="span-3" columns="two" />
            <OptionGroup title="Supine pelvic tilt" name="supinePelvicTilt" options={OPTIONS.supinePelvicTilt} span="span-3" />
            <OptionGroup title="Tilt flexibility" name="tiltFlex" options={OPTIONS.flexibility} span="span-3" columns="two" />
            <OptionGroup title="Sitting balance" name="sittingBalance" options={OPTIONS.sittingBalance} span="span-3" />
            <OptionGroup title="Supine pelvic rotation" name="supineRotation" options={OPTIONS.supineRotation} span="span-3" />
            <OptionGroup title="Rotation flexibility" name="rotationFlex" options={OPTIONS.flexibility} span="span-3" columns="two" />
            <OptionGroup title="Supine pelvic obliquity" name="supineObliquity" options={OPTIONS.supineObliquity} span="span-3" />
            <OptionGroup title="Obliquity flexibility" name="obliquityFlex" options={OPTIONS.flexibility} span="span-3" columns="two" />
            <OptionGroup title="Tone / movement" name="toneMovement" type="checkbox" options={OPTIONS.toneMovement} span="span-12" columns="four" />
            <TextAreaField id="romNotes" label="ROM notes" span="span-6" />
            <TextAreaField id="simulationFindings" label="Simulation findings / proposed posture" span="span-6" />
          </Grid>
        </FormSection>

        <FormSection
          id="section4"
          defaultCollapsed
          title="Section 4: Proposed product parameters"
          description="This is the supplier-facing prescription frame. Complete as a proposed trial direction first; finalise after trial, fitting and review."
        >
          <Subhead>Base direction and trial class</Subhead>
          <Grid compact>
            <OptionGroup title="Likely prescription pathway" name="proposedPathway" options={OPTIONS.proposedPathway} span="span-12" columns="four" />
            <TextField id="supplierPreference" label="Preferred suppliers to contact" span="span-4" />
            <TextAreaField id="baseDirectionReason" label="Reason for base direction" span="span-8" />
            <div className="note span-12 wc-tool__auto-note">
              <span>Dimension fields are auto-starting points only. Overwrite them when posture, pressure care, transfers, supplier measurement conventions or trial outcomes indicate a better fit.</span>
              <button className="btn" type="button" onClick={() => window.reapplyAutoCalculations?.()}>Re-apply auto-calculations</button>
            </div>
          </Grid>

          <Subhead>Key seating dimensions and seating system</Subhead>
          <Grid compact>
            <div className="dimension-grid span-12">
              <DimensionField id="reqSeatWidth" label="Required seat width mm" type="number" />
              <DimensionField id="proposedOverallWidth" label="Estimated / proposed overall wheelchair width mm" type="number" placeholder="Auto-estimates seat width + 200 mm; overwrite with supplier total width" />
              <DimensionField id="reqSeatDepth" label="Required seat depth mm" type="number" />
              <DimensionField id="reqSeatHeight" label="Required front seat height mm" type="number" />
              <DimensionField id="reqBackHeight" label="Required backrest height" textarea placeholder="e.g. 400 mm to inferior scapula, or shoulder/head level where clinically indicated." />
              <DimensionField id="cushionProfile" label="Cushion profile" select options={OPTIONS.cushionProfile} />
              <DimensionField id="headSupport" label="Head support" select options={OPTIONS.yesNo} />
              <DimensionField id="proposedCushion" label="Cushion recommendation" textarea placeholder="Describe cushion type, contour, pressure rationale, transfer impact and skin follow-up." />
              <DimensionField id="proposedBackrest" label="Backrest recommendation" textarea placeholder="Describe backrest style, height, contour, laterals and correction/accommodation rationale." />
              <DimensionField id="seatAngleTilt" label="Seat angle / tilt" textarea placeholder="Describe fixed seat angle, tilt-in-space, anterior tilt, pressure/posture rationale and transfer impact." />
              <DimensionField id="backrestRecline" label="Backrest recline" textarea placeholder="Describe recline angle/function, care/rest rationale, shear/sliding considerations and belt position." />
              <DimensionField id="legrestAngle" label="Legrest angle / support" textarea placeholder="Describe hanger/legrest angle, footplate setup, calf/heel support, ROM and swelling/tone considerations." />
              <DimensionField id="armSupport" label="Arm support" textarea placeholder="Describe armrest/arm trough height, length, padding, swing-away/flip-back needs and transfer/reach impact." />
            </div>
            <OptionGroup title="Postural supports" name="posturalSupports" type="checkbox" options={OPTIONS.posturalSupports} span="span-12" columns="four" />
            <OptionGroup title="Belts / secondary supports" name="beltsSupports" type="checkbox" options={OPTIONS.beltsSupports} span="span-12" columns="four" />
            <TextAreaField id="posturalSupportDescriptors" label="Postural support descriptors / mounting notes" span="span-12" />
          </Grid>

          <Subhead>Manual wheelchair parameters</Subhead>
          <Grid compact>
            <div className="note span-12 manual-source-note" id="manualSourceSummary">Manual type and frame are not repeated here. Use the prescription pathway above and manual chair selection in Section 2, then record any proposed frame/configuration changes in the notes below.</div>
            <OptionGroup title="Frame material" name="frameMaterial" type="checkbox" options={OPTIONS.frameMaterial} span="span-4" columns="two" />
            <OptionGroup title="Wheels / drive" name="manualWheels" type="checkbox" options={OPTIONS.manualWheels} span="span-6" columns="two" />
            <OptionGroup title="Manual accessories" name="manualAccessories" type="checkbox" options={OPTIONS.manualAccessories} span="span-6" columns="two" />
            <TextAreaField id="manualConfigNotes" label="Manual wheelchair configuration notes" placeholder="Rear axle position, centre of gravity, seat-to-floor height, foot propulsion needs, shoulder preservation, carer handling, transport/storage." span="span-12" />
          </Grid>

          <Subhead>Power wheelchair parameters</Subhead>
          <Grid compact>
            <OptionGroup title="Drive configuration to trial" name="proposedDrive" options={OPTIONS.proposedDrive} span="span-4" />
            <OptionGroup title="Power seat functions requested for trial" name="proposedSeatFunctions" type="checkbox" options={OPTIONS.proposedSeatFunctions} span="span-8" columns="four" />
            <TextField id="powerControls" label="Controls" placeholder="Joystick, attendant control, alternate drive control, tray mount, swing-away" span="span-4" />
            <TextField id="powerBaseNotes" label="Power base / seating notes" span="span-4" />
            <TextField id="powerChargingNotes" label="Battery/charging/storage considerations" span="span-4" />
          </Grid>
        </FormSection>

        <FormSection
          id="section5"
          defaultCollapsed
          title="Section 5: Trial plan, supplier handover, fitting and training"
          description="Turns assessment findings into a practical trial and quote request, then captures what must be checked at delivery."
        >
          <Subhead>Trial and quote request</Subhead>
          <Grid compact>
            <OptionGroup title="Suppliers to consider" name="suppliers" type="checkbox" options={OPTIONS.suppliers} span="span-12" columns="four" />
            <OptionGroup title="Trial completed / planned location" name="trialLocations" type="checkbox" options={OPTIONS.trialLocations} span="span-6" columns="two" />
            <TextAreaField id="trialEquipment" label="Potential trial equipment to meet goals and needs" placeholder="List product classes/models, alternatives and features that must be trialled." span="span-6" />
            <TextAreaField id="productsTrialled" label="Products trialled / outcomes" span="span-6" />
            <TextAreaField id="selectedEquipment" label="Selected wheelchair, seating and accessories" span="span-6" />
            <TextAreaField id="quoteInstructions" label="Supplier quote instructions" placeholder="Request itemised quote with base, seating, cushion, accessories, mounting hardware, delivery/setup, training, freight, warranty, maintenance/repair pathway and expected lead time." span="span-12" />
          </Grid>

          <Subhead>Fitting, training and follow-up checklist</Subhead>
          <Grid compact>
            <OptionGroup name="trainingChecklist" type="checkbox" options={OPTIONS.trainingChecklist} span="span-12" columns="four" />
            <TextAreaField id="trainingNotes" label="Training / follow-up notes" span="span-12" />
          </Grid>

          <Subhead>Final supplier handover comments</Subhead>
          <Grid compact>
            <TextAreaField id="barriersToGoals" label="Identified barriers to goals" span="span-4" />
            <TextAreaField id="identifiedIssues" label="Identified postural / mobility issues" span="span-4" />
            <TextAreaField id="productParametersSummary" label="Potential product parameters summary" span="span-4" />
          </Grid>
          <div className="note wc-tool__field-offset">Supplier output is generated from the fields above. It deliberately leaves live clinical guidance out of the copied brief, while retaining risk flags and trial requirements relevant to supplier shortlisting.</div>
        </FormSection>
      </form>

      <aside className="sidebar">
        <div className="side-card progress-card">
          <h3>Prescription progress</h3>
          <div className="side-body">
            <div className="progress-status" data-tone={draftStatus.tone}>
              <strong>{draftStatus.title}</strong>
              <p>{draftStatus.detail}</p>
            </div>
            {!canSaveToPatient && (
              <div className="progress-note">
                Select a patient before saving longitudinal prescription versions. The current workspace still autosaves locally on this device.
              </div>
            )}
            {saveError && <div className="progress-error">{saveError}</div>}
            <div className="version-summary">
              <span>Latest patient version</span>
              <strong>{latestSavedVersion ? formatDateTime(getRecordSavedAt(latestSavedVersion)) : 'None saved yet'}</strong>
            </div>
            <div className="version-list">
              {savedVersions.length > 0 ? savedVersions.slice(0, 6).map((version, index) => {
                const meta = version.results?.meta || {}
                return (
                  <button
                    className="version-item"
                    data-active={activeVersionId === version.id ? '' : undefined}
                    key={version.id}
                    onClick={() => onLoadVersion(version)}
                    type="button"
                  >
                    <span>Version {savedVersions.length - index}</span>
                    <strong>{formatDateTime(getRecordSavedAt(version))}</strong>
                    <small>{meta.statusLabel || version.results?.interpretation || 'Wheelchair prescription draft'}{typeof meta.completionPercent === 'number' ? ` - ${meta.completionPercent}%` : ''}</small>
                  </button>
                )
              }) : (
                <p className="empty-progress">No patient-record versions yet. Save progress when the draft reaches a useful clinical checkpoint.</p>
              )}
            </div>
          </div>
        </div>
        <div className="side-card">
          <h3>Live clinical reasoning guidance</h3>
          <div className="side-body" id="guidanceOutput" />
        </div>
        <div className="side-card">
          <h3>Supplier brief preview</h3>
          <div className="side-body">
            <div className="brief-preview" id="supplierBrief" />
            <div className="footer-note">Use "Copy supplier brief" for email handover or "Print supplier brief" for PDF/printing.</div>
          </div>
        </div>
        <div className="side-card">
          <h3>Reference basis</h3>
          <div className="side-body wc-tool__reference-body">
            <ul className="links-list">
              <li><a href="https://www.who.int/publications/i/item/9789240074521" rel="noreferrer" target="_blank">WHO Wheelchair provision guidelines, 2023</a></li>
              <li><a href="https://www.ncbi.nlm.nih.gov/books/NBK143782/" rel="noreferrer" target="_blank">WHO manual wheelchair guideline definition of appropriate wheelchair</a></li>
              <li><a href="https://www.resna.org/Resources/Position-Papers-and-Service-Provision-Guidelines" rel="noreferrer" target="_blank">RESNA service provision framework</a></li>
              <li><a href="https://wheelchairskillsprogram.ca/" rel="noreferrer" target="_blank">Wheelchair Skills Program</a></li>
            </ul>
            <div className="footer-note">Use these as the guidance basis only. The tool still requires clinical judgement, trial confirmation, supplier specification checks and local funding review.</div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function FormSection({ id, title, description, defaultCollapsed = false, children }) {
  const toggle = event => window.toggleSection?.(id, event.currentTarget)
  return (
    <section className={`card section${defaultCollapsed ? ' is-collapsed' : ''}`} id={id}>
      <div className="section-header">
        <h2>{title}</h2>
        <p>{description}</p>
        <button className="section-toggle" onClick={toggle} type="button">{defaultCollapsed ? 'Expand' : 'Minimise'}</button>
      </div>
      <div className="section-body">{children}</div>
    </section>
  )
}

function Grid({ children, compact = false, className = '' }) {
  return <div className={`grid${compact ? ' compact' : ''}${className ? ` ${className}` : ''}`}>{children}</div>
}

function Subhead({ children, inline = false }) {
  return <div className={`subhead${inline ? ' inline-subhead' : ''}`}>{children}</div>
}

function TextField({ id, label, span = '', className = '', type = 'text', ...props }) {
  return (
    <label className={`field${span ? ` ${span}` : ''}${className ? ` ${className}` : ''}`}>
      {label}
      <input id={id} type={type} {...props} />
    </label>
  )
}

function TextAreaField({ id, label, span = '', className = '', ...props }) {
  return (
    <label className={`field${span ? ` ${span}` : ''}${className ? ` ${className}` : ''}`}>
      {label}
      <textarea id={id} {...props} />
    </label>
  )
}

function SelectField({ id, label, options, span = '', className = '' }) {
  return (
    <label className={`field${span ? ` ${span}` : ''}${className ? ` ${className}` : ''}`}>
      {label}
      <select id={id}>
        <option value="" />
        {options.map(option => <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>)}
      </select>
    </label>
  )
}

function OptionGroup({ title, name, options, type = 'radio', span = '', columns = '', className = '' }) {
  return (
    <div className={`${span || ''}${className ? ` ${className}` : ''}`}>
      {title && <strong>{title}</strong>}
      <OptionChoices name={name} options={options} type={type} columns={columns} />
    </div>
  )
}

function OptionPanel({ title, children }) {
  return (
    <div className="option-panel">
      <strong>{title}</strong>
      {children}
    </div>
  )
}

function OptionChoices({ name, options, type = 'radio', columns = '' }) {
  return (
    <div className={`check-grid${columns ? ` ${columns}` : ''}`}>
      {options.map(option => (
        <label className={type === 'checkbox' ? 'check' : 'radio'} key={`${name}-${optionValue(option)}`}>
          <input name={name} type={type} value={optionValue(option)} />
          {optionLabel(option)}
        </label>
      ))}
    </div>
  )
}

function SelectionCard({ title, value, label, caption, src, type, name }) {
  return (
    <div className="selection-card">
      <img alt="" src={src} />
      <h4>{title}</h4>
      <label className={type === 'checkbox' ? 'check' : 'radio'}>
        <input name={name} type={type} value={value} />
        {label}
      </label>
      <div className="card-caption">{caption}</div>
    </div>
  )
}

function MeasurementTable() {
  return (
    <table className="measurement-table">
      <thead>
        <tr><th>Measurement</th><th>Left / value mm</th><th>Right mm</th></tr>
      </thead>
      <tbody>
        {MEASUREMENT_ROWS.map(row => (
          <tr key={row.code}>
            <td><span className="measure-label"><span className="measure-code">{row.code}</span><span className="measure-desc">{row.label}</span></span></td>
            <td><input id={`meas${row.code}_L`} min="0" step="1" type="number" /></td>
            <td><input id={`meas${row.code}_R`} min="0" step="1" type="number" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ActivityTable() {
  return (
    <table className="activity-table">
      <thead>
        <tr><th>Activity</th><th>Performance</th><th>Notes</th></tr>
      </thead>
      <tbody>
        {ACTIVITY_ROWS.map((activity, index) => (
          <tr key={activity}>
            <td>{activity}</td>
            <td>
              <select id={`act_${index}`}>
                <option value="" />
                {OPTIONS.activityLevels.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </td>
            <td><input id={`actNote_${index}`} type="text" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DimensionField({ id, label, textarea = false, select = false, options = [], type = 'text', ...props }) {
  return (
    <label className="field">
      {label}
      {textarea ? (
        <textarea id={id} {...props} />
      ) : select ? (
        <select id={id}>
          <option value="" />
          {options.map(option => <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>)}
        </select>
      ) : (
        <input id={id} min="0" step="1" type={type} {...props} />
      )}
      <div className="guidance-line" id={`guide_${id}`} />
    </label>
  )
}

function optionValue(option) {
  return typeof option === 'string' ? option : option.value
}

function optionLabel(option) {
  return typeof option === 'string' ? option : option.label
}

const ASSET_BASE = '/assets/wheelchair-prescription'

const MEASUREMENT_ROWS = [
  ['A', 'Buttock/thigh depth'],
  ['B', 'Lower leg length'],
  ['C', 'Foot length'],
  ['D', 'Ischial well length'],
  ['E', 'Seat to elbow'],
  ['F', 'PSIS'],
  ['G', 'Inferior scapula'],
  ['H', 'Axilla'],
  ['I', 'Top of shoulder'],
  ['J', 'Top of head'],
  ['K', 'Shoulder width'],
  ['L', 'Chest width'],
  ['M', 'Hip width'],
  ['N', 'External knee width'],
  ['O', 'Internal knee width'],
  ['P', 'External ankle/foot at widest point'],
].map(([code, label]) => ({ code, label }))

const ACTIVITY_ROWS = ['Eating', 'Grooming', 'Bathing', 'Dressing - upper body', 'Dressing - lower body', 'Toileting', 'Bed/chair/wheelchair transfer', 'Toilet transfer', 'Shower/bath transfer', 'Propel', 'Reposition / pressure relieve', 'Reach / pick up objects', 'Navigate tight spaces', 'Manage ramps / inclines / curbs', 'Cross streets / community safety']

const MANUAL_SELECTIONS = [
  { title: 'Folding manual', value: 'Folding', label: 'Select folding manual', caption: 'Useful when transport/storage and simpler handling are priorities.', src: `${ASSET_BASE}/folding-manual-wheelchair.jpg` },
  { title: 'Rigid manual', value: 'Rigid', label: 'Select rigid manual', caption: 'Useful when propulsion efficiency, performance and reduced flex are priorities.', src: `${ASSET_BASE}/rigid-manual-wheelchair.jpg` },
  { title: 'Tilt in space', value: 'Tilt in space', label: 'Select tilt in space', caption: 'Useful when posture support, pressure management and caregiver handling are priorities.', src: `${ASSET_BASE}/tilt-in-space-manual-wheelchair.jpg` },
]

const POWER_DRIVE_SELECTIONS = [
  { title: 'Front wheel drive', value: 'Front wheel drive', label: 'Select front wheel drive', caption: 'Often prioritised where climbing obstacles and more direct obstacle approach are important.', src: `${ASSET_BASE}/front-wheel-drive-power-wheelchair.jpg` },
  { title: 'Mid wheel drive', value: 'Mid wheel drive', label: 'Select mid wheel drive', caption: 'Often prioritised for tighter indoor turning and central drive feel.', src: `${ASSET_BASE}/mid-wheel-drive-power-wheelchair.jpg` },
  { title: 'Rear wheel drive', value: 'Rear wheel drive', label: 'Select rear wheel drive', caption: 'Often prioritised for directional stability and outdoor tracking.', src: `${ASSET_BASE}/rear-wheel-drive-power-wheelchair.jpg` },
]

const OPTIONS = {
  yesNo: ['Yes', 'No'],
  yesNoUnknown: ['Yes', 'No', 'Unknown'],
  remoteness: ['Metropolitan', 'Regional', 'Rural', 'Remote', 'Very remote'],
  wcTime: ['Community access only', 'Outdoor home access only', 'Indoor transit only', 'Full-time use'],
  carers: ['None', 'Informal', 'Formal'],
  cause: ['Injury', 'Health condition', 'Other'],
  impairment: ['Physical', 'Neurological', 'Cognitive', 'Psychosomatic', 'Sensory'],
  conditionStatus: ['Stable', 'Deteriorating', 'Fluctuating'],
  sensation: ['Intact', 'Impaired', 'Absent'],
  bariatricFeatures: ['Apple ascites', 'Apple pannus', 'Pear abduction', 'Pear adduction', 'Gluteal shelf'],
  propulsion: ['Independent full-time', 'Independent part-time', 'Requires assistance', 'Dependent'],
  powerAddon: ['Front attached', 'Push-rim activated', 'SmartDrive', 'Other'],
  currentSeatFunctions: ['Tilt', 'Recline - power', 'Recline - manual', 'Elevating leg rests - power', 'Elevating leg rests - manual', 'Seat elevate', 'Anterior tilt', 'Active reach', 'Stand'],
  currentAccessories: ['Headrest', 'Laterals', 'Postural hip belt', 'Shoulder harness', 'Ankle huggers', 'Foot cups', 'Tray', 'Other'],
  meetsNeeds: ['Meets needs', 'Does not meet needs', 'Unknown'],
  backrestHardware: ['Removable', 'Fixed', 'Integrated'],
  pelvisSag: ['Neutral', 'Posterior pelvic tilt', 'Anterior pelvic tilt'],
  pelvisFront: ['Neutral', 'Right obliquity', 'Left obliquity'],
  pelvisTrans: ['Neutral', 'Right rotation', 'Left rotation'],
  lowerExt: ['Hip neutral', 'Hip abducted R', 'Hip abducted L', 'Hip adducted R', 'Hip adducted L', 'Externally rotated R', 'Externally rotated L', 'Internally rotated R', 'Internally rotated L', 'Wind sweeping R', 'Wind sweeping L', 'Foot eversion', 'Foot inversion', 'Plantarflexed', 'Dorsiflexed'],
  spineCervical: ['Scoliosis convex right', 'Scoliosis convex left', 'Thoracic kyphosis', 'Lumbar lordosis', 'Spinal rotation R', 'Spinal rotation L', 'Cervical flexed', 'Cervical extended', 'Cervical lateral flexion L', 'Cervical lateral flexion R', 'Cervical rotation L', 'Cervical rotation R', 'Shoulder protracted L', 'Shoulder protracted R', 'Shoulder low L', 'Shoulder low R'],
  household: ['Lives alone', 'Lives with others'],
  support: ['Independent', 'Family support', 'Carer support'],
  internalSurfaces: ['Tiles/vinyl/wood', 'Carpet/rugs', 'Tight spaces', 'Narrow doors'],
  externalTerrain: ['Concrete/paver/tile', 'Gravel/dirt', 'Grass/soft ground', 'Uneven terrain', 'Hills', 'Steep ramps', 'Curbs'],
  transport: ['Modified vehicle', 'Standard vehicle', 'Taxi', 'Bus', 'Train', 'Other'],
  travelPosition: ['In wheelchair', 'In vehicle seat', 'Further assessment required'],
  supinePelvicTilt: [{ value: 'NAD', label: 'NAD' }, { value: 'Anterior pelvic tilt', label: 'Anterior' }, { value: 'Posterior pelvic tilt', label: 'Posterior' }],
  flexibility: ['Reducible', 'Non-reducible'],
  sittingBalance: [{ value: 'Independent sitting', label: 'Independent' }, { value: 'Sitting with propping', label: 'Propping' }, { value: 'Unable to sit without support', label: 'Unable' }],
  supineRotation: [{ value: 'NAD', label: 'NAD' }, { value: 'Right rotation', label: 'Right' }, { value: 'Left rotation', label: 'Left' }],
  supineObliquity: [{ value: 'NAD', label: 'NAD' }, { value: 'Right obliquity', label: 'Right' }, { value: 'Left obliquity', label: 'Left' }],
  toneMovement: ['Hypertonic', 'Hypotonic', 'Mixed tone', 'Ataxia', 'Athetosis', 'Spasm/reflex triggers'],
  activityLevels: ['Independent', 'Partial assistance', 'Dependent', 'Not applicable'],
  proposedPathway: ['Basic manual / transit', 'Highly adjustable manual', 'Scripted/custom manual', 'Manual tilt-in-space', 'Power wheelchair', 'Manual chair plus power assist', 'Further specialist assessment before product direction'],
  cushionProfile: ['Low profile 1-2 inch', 'High profile 3 inch +'],
  posturalSupports: ['Pre-ischial contour / ridge', 'Cushion build-up', 'Cushion wedge', 'Thigh guide', 'Pommel', 'Lateral supports', 'Deep contour backrest', 'Lumbar support', 'Pelvic pad PSIS-level', 'Tray', 'Footrest build-up', 'Angle adjustable footrest / wedge', 'Calf strap', 'Heel strap'],
  beltsSupports: ['Pelvic belt', 'Four-point pelvic belt', 'Chest belt', 'Shoulder harness', 'Calf strap', 'Ankle huggers', 'Foot box', 'Head strap'],
  frameMaterial: ['Aluminium', 'Steel', 'Carbon fibre', 'Titanium'],
  manualWheels: ['Attendant/transit', 'Large rear wheel', 'One arm drive - level', 'One arm drive - through axle', 'Solid tyres', 'Pneumatic tyres', 'High tread tyres', 'Spoke wheels', 'Mag wheels', 'Spoke guard'],
  manualAccessories: ['Wheel camber', 'Aluminium rims', 'Plastic rims', 'High friction rims', 'Ergonomic rims', 'Castors <6 inch', 'Castors 6 inch', 'Castors 8 inch', 'Castors >8 inch', 'Brake extensions', 'Scissor brakes', 'Attendant drum brakes', 'Anti-tips', 'Tip-assist', 'Extended push handles', 'Stroller handles', 'Lightweight', 'Foldable', 'Dismantleable', 'Robust', 'Power assist required'],
  proposedDrive: ['Front wheel drive', 'Mid wheel drive', 'Rear wheel drive', 'To trial / compare'],
  proposedSeatFunctions: ['Power tilt', 'Power recline', 'Power elevating legrests', 'Seat elevate', 'Anterior tilt', 'Active reach', 'Standing', 'Manual recline/ELR only'],
  suppliers: ['Primary wheelchair supplier', 'Custom seating supplier', 'Power mobility supplier', 'Manual wheelchair supplier', 'Local service/repair provider', 'Other supplier', 'Specialist custom fabrication', 'Engineering / technical input'],
  trialLocations: ['Hospital', 'Home', 'Showroom', 'Community', 'Vehicle/transport', 'Work/school'],
  trainingChecklist: ['Product review after delivery/setup', 'Propulsion training', 'Navigating tight spaces', 'Doors and thresholds', 'Curbs', 'Ramps/inclines', 'Wheelie/manual wheelchair skill', 'Pressure relieving routine', 'Repositioning in chair', 'Folding/dismantling/transport', 'Power mobility controls and safe use', 'Charging and storage routine', 'Manual freewheel / motor disengagement', 'Cleaning', 'Device inspection/common issues', 'Backup plans for breakdown', 'Maintenance/repair process', 'Replacement schedule - device/seating', 'Caregiver training'],
}

const wheelchairToolStyles = `
  .wc-tool {
    --wc-ink: var(--color-ink);
    --wc-muted: var(--color-muted);
    --wc-subtle: var(--color-subtle);
    --wc-line: var(--color-border);
    --wc-card-border: rgba(216,225,234,0.9);
    --wc-surface: rgba(255,255,255,0.72);
    --wc-nested-surface: rgba(247,250,252,0.82);
    --wc-control-surface: var(--color-surface-soft);
    --wc-soft: var(--color-surface-soft);
    --wc-primary: var(--color-primary);
    --wc-primary-dark: var(--color-primary-dark);
    --wc-primary-soft: var(--color-primary-soft);
    --wc-secondary: var(--color-secondary);
    --wc-danger: #b5451b;
    --wc-radius-panel: 16px;
    --wc-radius-inner: 10px;
    --wc-radius-control: 8px;
    color: var(--wc-ink);
    font-family: 'Inter', sans-serif;
  }

  .wc-tool,
  .wc-tool * {
    box-sizing: border-box;
  }

  .wc-tool h2,
  .wc-tool h3,
  .wc-tool h4,
  .wc-tool p,
  .wc-tool ul,
  .wc-tool ol,
  .wc-tool figure {
    margin: 0;
    padding: 0;
  }

  .wc-tool button,
  .wc-tool input,
  .wc-tool textarea,
  .wc-tool select {
    font: inherit;
  }

  .wc-tool__header {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
    padding: 20px 24px;
    border: 1px solid var(--wc-card-border);
    border-radius: var(--wc-radius-panel);
    background:
      linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.86) 58%, rgba(234,243,251,0.82) 100%),
      url('/assets/wheelchair-prescription/mid-wheel-drive-power-wheelchair.jpg') right center / 330px auto no-repeat,
      var(--wc-surface);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(16px);
  }

  .wc-tool__header > * {
    position: relative;
    z-index: 1;
  }

  .wc-tool__iq-mark {
    position: absolute !important;
    right: 28px;
    bottom: 18px;
    z-index: 0 !important;
    color: rgba(127,179,230,0.32);
    font-size: 82px;
    pointer-events: none;
  }

  .button-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
  }

  .wc-tool__header-main {
    flex: 1;
    min-width: 0;
  }

  .wc-tool__eyebrow {
    display: block;
    margin-bottom: 6px;
    color: var(--wc-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }

  .wc-tool__header h2 {
    margin: 0;
    color: var(--wc-ink);
    font-size: 22px;
    line-height: 1.15;
    font-weight: 800;
  }

  .wc-tool__header p {
    max-width: 680px;
    margin-top: 6px;
    color: var(--wc-muted);
    font-size: 13px;
    line-height: 1.55;
  }

  .wc-tool__patient-picker {
    display: grid;
    grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
    gap: 12px;
    align-items: end;
    max-width: 760px;
    margin-top: 14px;
  }

  .wc-tool__patient-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .wc-tool__patient-field > span {
    color: var(--wc-muted);
    font-size: 12px;
    font-weight: 800;
    line-height: 1.35;
  }

  .wc-tool__patient-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 38px;
    align-items: center;
  }

  .wc-tool__patient-meta span {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    max-width: 100%;
    padding: 0 10px;
    border: 1px solid var(--wc-line);
    border-radius: 999px;
    background: var(--wc-nested-surface);
    color: var(--wc-muted);
    font-size: 12px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .wc-tool__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    justify-content: flex-end;
    gap: 8px;
    min-width: 330px;
  }

  .wc-tool__actions button,
  .wc-tool .btn,
  .wc-tool .section-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 38px;
    padding: 0 13px;
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-control);
    background: rgba(255,255,255,0.86);
    color: var(--wc-primary);
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }

  .wc-tool__actions button:hover,
  .wc-tool .btn:hover,
  .wc-tool .section-toggle:hover {
    border-color: rgba(23,61,104,0.35);
    background: #fff;
  }

  .wc-tool__actions button[data-primary] {
    border-color: transparent;
    background: var(--wc-primary);
    box-shadow: 0 8px 18px rgba(23,61,104,0.22);
    color: #fff;
  }

  .wc-tool__actions button[data-danger] {
    color: var(--wc-danger);
  }

  .wc-tool__actions button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }

  .wc-tool__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(340px, 390px);
    gap: 22px;
    align-items: start;
  }

  .wc-tool .main-panel,
  .wc-tool .sidebar {
    min-width: 0;
  }

  .wc-tool .sidebar {
    position: sticky;
    top: 18px;
    display: grid;
    gap: 16px;
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-gutter: stable;
  }

  .wc-tool .card,
  .wc-tool .side-card {
    overflow: hidden;
    margin-bottom: 18px;
    border: 1px solid var(--wc-card-border);
    border-radius: var(--wc-radius-panel);
    background: var(--wc-surface);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(16px);
  }

  .wc-tool .side-card {
    margin-bottom: 0;
  }

  .wc-tool .section-header {
    position: relative;
    min-height: 70px;
    padding: 18px 120px 16px 20px;
    border-bottom: 1px solid var(--wc-line);
    background: var(--wc-nested-surface);
  }

  .wc-tool .section-header h2 {
    margin: 0;
    color: var(--wc-ink);
    font-size: 18px;
    line-height: 1.2;
    font-weight: 800;
  }

  .wc-tool .section-header p {
    margin-top: 5px;
    color: var(--wc-muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .wc-tool .section-toggle {
    position: absolute;
    top: 16px;
    right: 18px;
    min-width: 88px;
  }

  .wc-tool .section.is-collapsed .section-body {
    display: none;
  }

  .wc-tool .section.is-collapsed .section-header {
    border-bottom: 0;
  }

  .wc-tool .section-body {
    padding: 18px 20px 22px;
  }

  .wc-tool .side-card h3 {
    margin: 0;
    padding: 13px 15px;
    border-bottom: 1px solid var(--wc-line);
    background: var(--wc-nested-surface);
    color: var(--wc-ink);
    font-size: 13px;
    font-weight: 800;
  }

  .wc-tool .side-body {
    padding: 14px 15px;
  }

  .wc-tool .progress-status,
  .wc-tool .progress-note,
  .wc-tool .progress-error,
  .wc-tool .version-summary,
  .wc-tool .empty-progress {
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-inner);
    background: var(--wc-nested-surface);
    padding: 10px 12px;
  }

  .wc-tool .progress-status {
    margin-bottom: 10px;
  }

  .wc-tool .progress-status[data-tone="success"] {
    border-color: #b7dfc9;
    background: #e8f4ef;
  }

  .wc-tool .progress-status[data-tone="warning"],
  .wc-tool .progress-error {
    border-color: #f5d49a;
    background: #fef3e2;
  }

  .wc-tool .progress-status strong,
  .wc-tool .version-summary strong {
    display: block;
    color: var(--wc-primary);
    font-size: 13px;
    font-weight: 800;
    line-height: 1.3;
  }

  .wc-tool .progress-status p,
  .wc-tool .progress-note,
  .wc-tool .progress-error,
  .wc-tool .empty-progress {
    margin: 6px 0 0;
    color: var(--wc-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .wc-tool .progress-note,
  .wc-tool .progress-error {
    margin-bottom: 10px;
  }

  .wc-tool .version-summary {
    display: grid;
    gap: 4px;
    margin-bottom: 10px;
  }

  .wc-tool .version-summary span {
    color: var(--wc-subtle);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.7px;
    text-transform: uppercase;
  }

  .wc-tool .version-list {
    display: grid;
    gap: 8px;
  }

  .wc-tool .version-item {
    display: grid;
    gap: 3px;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-inner);
    background: var(--wc-nested-surface);
    color: var(--wc-muted);
    cursor: pointer;
    text-align: left;
  }

  .wc-tool .version-item:hover {
    border-color: rgba(23,61,104,0.28);
    background: #fff;
  }

  .wc-tool .version-item[data-active] {
    border-color: rgba(23,61,104,0.42);
    background: var(--wc-primary-soft);
  }

  .wc-tool .version-item span {
    color: var(--wc-subtle);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .wc-tool .version-item strong {
    color: var(--wc-primary);
    font-size: 12px;
    line-height: 1.35;
  }

  .wc-tool .version-item small {
    color: var(--wc-muted);
    font-size: 11px;
    line-height: 1.35;
  }

  .wc-tool .grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 14px;
  }

  .wc-tool .span-12 { grid-column: span 12; }
  .wc-tool .span-9 { grid-column: span 9; }
  .wc-tool .span-8 { grid-column: span 8; }
  .wc-tool .span-6 { grid-column: span 6; }
  .wc-tool .span-5 { grid-column: span 5; }
  .wc-tool .span-4 { grid-column: span 4; }
  .wc-tool .span-3 { grid-column: span 3; }
  .wc-tool .span-2 { grid-column: span 2; }

  .wc-tool label.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    color: var(--wc-muted);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
  }

  .wc-tool .span-12 > strong,
  .wc-tool .span-9 > strong,
  .wc-tool .span-8 > strong,
  .wc-tool .span-6 > strong,
  .wc-tool .span-5 > strong,
  .wc-tool .span-4 > strong,
  .wc-tool .span-3 > strong,
  .wc-tool .span-2 > strong,
  .wc-tool .option-panel > strong {
    display: block;
    margin-bottom: 7px;
    color: var(--wc-muted);
    font-size: 12px;
    font-weight: 800;
    line-height: 1.35;
  }

  .wc-tool label.field .hint {
    color: var(--wc-muted);
    font-size: 11px;
    font-weight: 500;
  }

  .wc-tool input[type="text"],
  .wc-tool input[type="date"],
  .wc-tool input[type="number"],
  .wc-tool select,
  .wc-tool textarea {
    width: 100%;
    min-height: 38px;
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-control);
    background: var(--wc-control-surface);
    color: var(--wc-ink);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    padding: 8px 10px;
    outline: none;
  }

  .wc-tool textarea {
    min-height: 78px;
    resize: vertical;
    line-height: 1.45;
  }

  .wc-tool input:focus,
  .wc-tool select:focus,
  .wc-tool textarea:focus {
    border-color: rgba(23,61,104,0.6);
    box-shadow: 0 0 0 3px rgba(23,61,104,0.10);
    background: #fff;
  }

  .wc-tool .subhead {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 22px 0 12px;
    color: var(--wc-primary);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0;
  }

  .wc-tool .subhead:first-child {
    margin-top: 0;
  }

  .wc-tool .subhead::before {
    content: "";
    width: 4px;
    height: 16px;
    border-radius: 99px;
    background: var(--wc-secondary);
  }

  .wc-tool .check-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
  }

  .wc-tool .check-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .wc-tool .check-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .wc-tool .check-grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }

  .wc-tool .check,
  .wc-tool .radio {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    min-height: 38px;
    padding: 9px 10px;
    border: 1px solid rgba(216,225,234,0.95);
    border-radius: var(--wc-radius-inner);
    background: var(--wc-nested-surface);
    color: var(--wc-muted);
    font-size: 12px;
    line-height: 1.3;
  }

  .wc-tool .check:hover,
  .wc-tool .radio:hover {
    border-color: rgba(23,61,104,0.26);
    background: rgba(255,255,255,0.96);
  }

  .wc-tool .check:has(input:checked),
  .wc-tool .radio:has(input:checked) {
    border-color: rgba(23,61,104,0.36);
    background: var(--wc-primary-soft);
    color: var(--wc-primary);
  }

  .wc-tool .check input,
  .wc-tool .radio input {
    flex: 0 0 auto;
    margin-top: 2px;
    accent-color: var(--wc-primary);
  }

  .wc-tool .note,
  .wc-tool .guidance-line {
    border: 1px solid #d7e4ef;
    border-radius: var(--wc-radius-inner);
    background: #eef3fa;
    color: #1d4e89;
    font-size: 12px;
    line-height: 1.5;
    padding: 10px 12px;
  }

  .wc-tool .guidance-line {
    margin-top: 6px;
    background: var(--wc-nested-surface);
    color: var(--wc-muted);
  }

  .wc-tool .guidance-line.access-warning {
    border-color: #f0b8a2;
    background: #fdf0ec;
    color: #9a3a16;
  }

  .wc-tool .measurement-layout {
    display: grid;
    grid-template-columns: minmax(420px, 1.05fr) minmax(320px, 0.8fr);
    gap: 16px;
    align-items: start;
  }

  .wc-tool .measurement-table,
  .wc-tool .activity-table {
    width: 100%;
    overflow: hidden;
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-inner);
    border-collapse: separate;
    border-spacing: 0;
    background: rgba(255,255,255,0.86);
    font-size: 12px;
  }

  .wc-tool .measurement-table th,
  .wc-tool .activity-table th {
    padding: 9px;
    background: var(--wc-soft);
    color: var(--wc-subtle);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    text-align: left;
  }

  .wc-tool .measurement-table td,
  .wc-tool .activity-table td {
    padding: 7px 9px;
    border-top: 1px solid var(--wc-line);
    vertical-align: middle;
  }

  .wc-tool .measurement-table tr:hover td,
  .wc-tool .activity-table tr:hover td {
    background: var(--wc-soft);
  }

  .wc-tool .measurement-table input,
  .wc-tool .activity-table input,
  .wc-tool .activity-table select {
    min-height: 34px;
    padding: 6px 8px;
  }

  .wc-tool .measure-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .wc-tool .measure-code {
    display: inline-grid;
    place-items: center;
    min-width: 26px;
    height: 26px;
    border: 1px solid #cfe0ee;
    border-radius: 999px;
    background: var(--wc-primary-soft);
    color: var(--wc-primary);
    font-weight: 800;
  }

  .wc-tool .visual-card,
  .wc-tool .selection-card,
  .wc-tool .option-panel,
  .wc-tool .conditional-panel {
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-inner);
    background: var(--wc-nested-surface);
    padding: 12px;
  }

  .wc-tool .conditional-panel[hidden] {
    display: none !important;
  }

  .wc-tool .inline-subhead {
    margin-top: 0;
  }

  .wc-tool .wc-tool__nested-grid,
  .wc-tool .wc-tool__field-offset,
  .wc-tool .manual-power-notes {
    margin-top: 12px;
  }

  .wc-tool .wc-tool__auto-note {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .wc-tool .wc-tool__reference-body {
    color: var(--wc-muted);
    font-size: 13px;
  }

  .wc-tool .visual-card img,
  .wc-tool .selection-card img {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid #edf3f7;
    border-radius: var(--wc-radius-control);
    background: #fff;
    object-fit: contain;
  }

  .wc-tool .body-chart-img {
    max-height: 540px;
  }

  .wc-tool .visual-caption,
  .wc-tool .card-caption,
  .wc-tool .footer-note {
    margin-top: 8px;
    color: var(--wc-muted);
    font-size: 11px;
    line-height: 1.45;
  }

  .wc-tool .selection-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .wc-tool .selection-card {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .wc-tool .selection-card:hover {
    border-color: rgba(23,61,104,0.26);
    box-shadow: 0 10px 24px rgba(21,34,56,0.08);
  }

  .wc-tool .selection-card img {
    aspect-ratio: 1 / 1;
  }

  .wc-tool .selection-card h4 {
    margin: 0;
    color: var(--wc-primary);
    font-size: 13px;
    font-weight: 800;
  }

  .wc-tool .manual-propulsion-layout {
    display: grid;
    grid-template-columns: minmax(240px, 0.8fr) minmax(320px, 1.2fr);
    gap: 12px;
  }

  .wc-tool .power-addon-panel .check-grid {
    grid-template-columns: repeat(4, minmax(100px, 1fr));
  }

  .wc-tool .dimension-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(220px, 1fr));
    gap: 12px;
  }

  .wc-tool .guidance-card {
    margin-bottom: 10px;
    padding: 12px;
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-inner);
    background: var(--wc-nested-surface);
  }

  .wc-tool .guidance-card h4 {
    margin: 0 0 7px;
    color: var(--wc-primary);
    font-size: 13px;
  }

  .wc-tool .guidance-card ul {
    margin: 0;
    padding-left: 18px;
    color: var(--wc-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .wc-tool .guidance-card li {
    margin: 4px 0;
  }

  .wc-tool .risk-high {
    border-color: #f0b8a2;
    background: #fdf0ec;
  }

  .wc-tool .risk-mod {
    border-color: #f5d49a;
    background: #fef3e2;
  }

  .wc-tool .risk-low {
    border-color: #b7dfc9;
    background: #e8f4ef;
  }

  .wc-tool .brief-preview {
    min-height: 520px;
    max-height: calc(100vh - 310px);
    overflow: auto;
    white-space: pre-wrap;
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-inner);
    background: var(--wc-nested-surface);
    color: var(--wc-ink);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 1.45;
    padding: 12px;
  }

  .wc-tool .links-list {
    margin: 0;
    padding-left: 18px;
    color: var(--wc-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .wc-tool .links-list li {
    margin-bottom: 8px;
  }

  .wc-tool .links-list a {
    color: var(--wc-primary);
  }

  .wc-tool__print-supplier {
    display: none;
  }

  .wc-tool__print-supplier .print-title {
    border-bottom: 2px solid var(--wc-primary);
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  .wc-tool__print-supplier .print-title h1 {
    margin: 0 0 4px;
    color: var(--wc-primary);
    font-size: 22px;
  }

  .wc-tool__print-supplier .print-title p,
  .wc-tool__print-supplier .print-note,
  .wc-tool__print-supplier .print-row,
  .wc-tool__print-supplier .print-paragraph {
    font-size: 11px;
    line-height: 1.35;
  }

  .wc-tool__print-supplier .print-note {
    margin: 8px 0 12px;
    padding: 8px 10px;
    border: 1px solid #f5d49a;
    border-radius: var(--wc-radius-control);
    background: #fef3e2;
  }

  .wc-tool__print-supplier .print-section {
    overflow: hidden;
    margin: 12px 0 16px;
    border: 1px solid var(--wc-line);
    border-radius: var(--wc-radius-control);
    break-inside: avoid;
  }

  .wc-tool__print-supplier .print-section h2 {
    margin: 0;
    padding: 8px 10px;
    background: var(--wc-primary-soft);
    color: var(--wc-primary);
    font-size: 14px;
  }

  .wc-tool__print-supplier .print-row {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    gap: 8px;
    padding: 6px 10px;
    border-top: 1px solid #eef3f7;
  }

  .wc-tool__print-supplier .print-label {
    color: var(--wc-muted);
    font-weight: 800;
  }

  .wc-tool__print-supplier .print-value,
  .wc-tool__print-supplier .print-paragraph {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .wc-tool__print-supplier .print-paragraph {
    padding: 7px 10px;
    border-top: 1px solid #eef3f7;
  }

  @media (max-width: 1320px) {
    .wc-tool__content,
    .wc-tool .measurement-layout {
      grid-template-columns: 1fr;
    }

    .wc-tool .sidebar {
      position: static;
      max-height: none;
      overflow: visible;
    }

    .wc-tool .brief-preview {
      max-height: 460px;
      min-height: 320px;
    }
  }

  @media (max-width: 960px) {
    .wc-tool__header {
      flex-direction: column;
    }

    .wc-tool__patient-picker {
      grid-template-columns: 1fr;
      max-width: none;
      width: 100%;
    }

    .wc-tool__actions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      min-width: 0;
      width: 100%;
    }

    .wc-tool .grid,
    .wc-tool .dimension-grid,
    .wc-tool .selection-cards,
    .wc-tool .manual-propulsion-layout {
      grid-template-columns: 1fr;
    }

    .wc-tool .span-12,
    .wc-tool .span-9,
    .wc-tool .span-8,
    .wc-tool .span-6,
    .wc-tool .span-5,
    .wc-tool .span-4,
    .wc-tool .span-3,
    .wc-tool .span-2 {
      grid-column: span 1;
    }

    .wc-tool .check-grid,
    .wc-tool .check-grid.two,
    .wc-tool .check-grid.four,
    .wc-tool .power-addon-panel .check-grid {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    body[data-wc-print] .app-sidebar,
    body[data-wc-print] .page-toolbar,
    body[data-wc-print] .wc-tool__header {
      display: none !important;
    }

    body[data-wc-print] .app-main {
      padding: 0 !important;
      overflow: visible !important;
    }

    body[data-wc-print="supplier"] .wc-tool__content {
      display: none !important;
    }

    body[data-wc-print="supplier"] .wc-tool__print-supplier {
      display: block !important;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
      color: #182331;
    }

    body[data-wc-print="assessment"] .wc-tool__content {
      display: block !important;
    }

    body[data-wc-print="assessment"] .wc-tool .sidebar {
      display: none !important;
    }

    body[data-wc-print="assessment"] .wc-tool .card {
      box-shadow: none !important;
      break-inside: avoid;
    }

    body[data-wc-print="assessment"] .wc-tool .section.is-collapsed .section-body {
      display: block !important;
    }

    body[data-wc-print="assessment"] .wc-tool .section-toggle {
      display: none !important;
    }
  }
`
