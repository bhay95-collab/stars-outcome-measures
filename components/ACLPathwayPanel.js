import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  ACL_PHASES,
  getACLPhase,
  evaluatePhaseGate,
  evaluateRTSBattery,
} from '../lib/clinical'
import RTSBatteryDashboard from './RTSBatteryDashboard'

// ACL Rehabilitation Phase Tracker (Module A) — stateful, per-patient.
// The tool SHOWS gate readiness; the clinician advances the phase. It never
// auto-progresses and never issues a clearance.

const DAYS_PER_MONTH = 30.44

function latestResult(assessments, measureId) {
  const rows = (assessments || [])
    .filter(a => a.measure === measureId && a.results)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return rows[0]?.results ?? null
}

function monthsSince(indexDate) {
  if (!indexDate) return null
  const then = new Date(indexDate)
  if (isNaN(then)) return null
  const days = (Date.now() - then.getTime()) / (1000 * 60 * 60 * 24)
  return Math.round((days / DAYS_PER_MONTH) * 10) / 10
}

function gateChip(met) {
  if (met === true) return <span className="interp-chip chip-green">Met</span>
  if (met === false) return <span className="interp-chip chip-red">Not met</span>
  return <span className="interp-chip chip-grey">Not recorded</span>
}

// Map Supabase wire errors to clinician-friendly text — avoids leaking internal
// constraint/table names while still distinguishing the common cases.
function friendlyPathwayError(err) {
  if (err?.code === '23505') return 'This patient already has an ACL pathway.'
  if (err?.code === '42501') return 'Access denied — check your subscription is active.'
  return 'Something went wrong saving the ACL pathway. Please try again.'
}

const GRAFT_TYPE_MAX = 200

export default function ACLPathwayPanel({ patient, userId, assessments }) {
  const [pathway, setPathway] = useState(undefined) // undefined = loading
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // New-pathway form state.
  const [pathwayType, setPathwayType] = useState('surgical')
  const [indexDate, setIndexDate] = useState('')
  const [graftType, setGraftType] = useState('')

  // Clinical signs the clinician confirms (not stored as measures in v1).
  const [fullExtension, setFullExtension] = useState(null)
  const [effusionTraceToZero, setEffusionTraceToZero] = useState(null)

  useEffect(() => {
    let cancelled = false
    // Reset session-local clinical signs so one patient's signs never bleed
    // into another patient's gate/battery evaluation.
    setFullExtension(null)
    setEffusionTraceToZero(null)
    async function load() {
      setPathway(undefined)
      setError('')
      const { data, error: selErr } = await supabase
        .from('acl_pathways')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('user_id', userId)
        .maybeSingle()
      if (cancelled) return
      if (selErr) {
        setError(friendlyPathwayError(selErr))
        setPathway(null)
        return
      }
      setPathway(data ?? null)
    }
    load()
    return () => { cancelled = true }
  }, [patient.id, userId])

  // Memoise the latest result per measure so the battery memo has stable deps
  // (latestResult builds new array/object refs each call).
  const latest = useMemo(() => ({
    quad: latestResult(assessments, 'QuadLSI'),
    hop: latestResult(assessments, 'HopBattery'),
    less: latestResult(assessments, 'LESS'),
  }), [assessments])
  const quad = latest.quad
  const hop = latest.hop
  const less = latest.less
  const monthsSinceIndex = monthsSince(pathway?.index_date)

  const battery = useMemo(() => evaluateRTSBattery({
    monthsSinceSurgery: monthsSinceIndex,
    quadLSI: latest.quad?.primaryValue ?? null,
    hopMinLSI: latest.hop?.primaryValue ?? null,
    effusionTraceToZero,
    less: latest.less?.primaryValue ?? null,
    pathwayType: pathway?.pathway_type ?? 'surgical',
  }), [latest, monthsSinceIndex, effusionTraceToZero, pathway?.pathway_type])

  const currentGate = pathway
    ? evaluatePhaseGate(pathway.current_phase, {
        fullExtension,
        effusionTraceToZero,
        quadLSI: quad?.primaryValue ?? null,
        hopMinLSI: hop?.primaryValue ?? null,
        monthsSinceIndex,
        rtsHardMet: battery.hardCriteriaMet,
      })
    : null

  async function createPathway(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    const now = new Date().toISOString()
    const { data, error: insErr } = await supabase
      .from('acl_pathways')
      .insert({
        user_id: userId,
        patient_id: patient.id,
        pathway_type: pathwayType,
        index_date: indexDate || null,
        graft_type: graftType || null,
        current_phase: 1,
        phase_history: [{ phase: 1, enteredAt: now }],
      })
      .select()
      .single()
    setBusy(false)
    if (insErr) { setError(friendlyPathwayError(insErr)); return }
    setPathway(data)
  }

  async function changePhase(delta) {
    if (!pathway || busy) return
    const nextPhase = pathway.current_phase + delta
    if (nextPhase < 1 || nextPhase > ACL_PHASES.length) return
    setBusy(true)
    setError('')
    const now = new Date().toISOString()
    const nextHistory = [...(pathway.phase_history || []), { phase: nextPhase, enteredAt: now }]
    const { data, error: updErr } = await supabase
      .from('acl_pathways')
      .update({ current_phase: nextPhase, phase_history: nextHistory, updated_at: now })
      .eq('id', pathway.id)
      .eq('user_id', userId)
      .select()
      .single()
    setBusy(false)
    if (updErr) { setError(friendlyPathwayError(updErr)); return }
    setPathway(data)
  }

  if (pathway === undefined) {
    return <p className="empty-hint">Loading ACL pathway…</p>
  }

  // ─── No pathway yet → offer to start one ──────────────────────────────────
  if (pathway === null) {
    return (
      <div className="acl-panel" data-acl-pathway="">
        <div className="summary-card">
          <span className="section-label">Start an ACL pathway</span>
          <p className="acl-intro">
            Track this patient through criterion-based rehab phases and the
            return-to-sport readiness battery. Surgical pathway is supported in
            this version; the conservative (non-operative) pathway is in development.
          </p>
          {error && <p className="error">{error}</p>}
          <form className="acl-form" onSubmit={createPathway}>
            <div className="field-group">
              <label htmlFor="acl-pathway-type" className="field-label">Pathway type</label>
              <select id="acl-pathway-type" className="field-input" value={pathwayType} onChange={e => setPathwayType(e.target.value)}>
                <option value="surgical">Surgical (ACL reconstruction)</option>
                <option value="conservative">Conservative (non-operative) — limited support</option>
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="acl-index-date" className="field-label">{pathwayType === 'surgical' ? 'Surgery date' : 'Injury date'}</label>
              <input id="acl-index-date" className="field-input" type="date" value={indexDate} onChange={e => setIndexDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label htmlFor="acl-graft-type" className="field-label">Graft type (optional)</label>
              <input id="acl-graft-type" className="field-input" type="text" maxLength={GRAFT_TYPE_MAX} placeholder="e.g. BPTB, hamstring, quad tendon" value={graftType} onChange={e => setGraftType(e.target.value)} />
            </div>
            <button type="submit" className="acl-btn" disabled={busy}>
              {busy ? 'Starting…' : 'Start ACL pathway'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─── Active pathway → phase ladder + battery ──────────────────────────────
  const phase = getACLPhase(pathway.current_phase)

  return (
    <div className="acl-panel" data-acl-pathway="">
      {error && <p className="error">{error}</p>}

      {/* Phase status + ladder */}
      <div className="summary-card">
        <div className="summary-card__head">
          <div>
            <span className="section-label">ACL pathway — {pathway.pathway_type}</span>
            <h3>Phase {pathway.current_phase} of {ACL_PHASES.length}: {phase?.name}</h3>
            {monthsSinceIndex !== null && (
              <p className="acl-meta">{monthsSinceIndex} months since {pathway.pathway_type === 'surgical' ? 'surgery' : 'injury'}</p>
            )}
          </div>
          <div className="acl-phase-controls">
            <button type="button" disabled={busy || pathway.current_phase <= 1} onClick={() => changePhase(-1)}>Back</button>
            <button type="button" disabled={busy || pathway.current_phase >= ACL_PHASES.length} onClick={() => changePhase(1)}>Advance phase</button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Phase</th><th>Focus</th></tr>
          </thead>
          <tbody>
            {ACL_PHASES.map(p => (
              <tr key={p.id} data-active={p.id === pathway.current_phase ? '' : undefined}>
                <td className="na-text">{p.id}</td>
                <td>{p.id === pathway.current_phase ? <strong>{p.name}</strong> : p.name}</td>
                <td className="na-text">{p.focus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clinical-sign toggles feeding the gates (not persisted in v1) */}
      <div className="summary-card">
        <span className="section-label">Clinical signs (this session)</span>
        <div className="acl-signs">
          <label>
            <input type="checkbox" checked={fullExtension === true} onChange={e => setFullExtension(e.target.checked ? true : null)} />
            Full active knee extension
          </label>
          <label>
            <input type="checkbox" checked={effusionTraceToZero === true} onChange={e => setEffusionTraceToZero(e.target.checked ? true : null)} />
            Effusion trace-to-zero
          </label>
        </div>
        <p className="acl-hint">
          Confirmed by the clinician for this session only — these feed the phase
          gate and the readiness battery below and are not saved as assessments.
        </p>
      </div>

      {/* Current-phase gate */}
      {currentGate && !currentGate.terminal && (
        <div className="summary-card">
          <div className="summary-card__head">
            <div>
              <span className="section-label">Gate to next phase</span>
              <p className="acl-meta">{phase?.gate?.summary}</p>
            </div>
            {currentGate.allMet
              ? <span className="interp-chip chip-green">Criteria met</span>
              : <span className="interp-chip chip-grey">Outstanding</span>}
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Check</th><th>Threshold</th><th>Status</th></tr>
            </thead>
            <tbody>
              {currentGate.checks.map(c => (
                <tr key={c.key}>
                  <td>{c.label}</td>
                  <td className="na-text">{c.threshold}</td>
                  <td>{gateChip(c.met)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="acl-hint">
            {currentGate.allMet
              ? 'Gate criteria met — clinician may advance the phase.'
              : 'Gate criteria not all recorded/met. Advancing remains a clinician decision.'}
          </p>
        </div>
      )}
      {currentGate?.terminal && (
        <div className="info-panel">
          Secondary prevention is ongoing — maintain strength, hop symmetry and an
          injury-prevention programme to reduce re-injury risk.
        </div>
      )}

      {/* Return-to-sport battery (Module B) */}
      {pathway.pathway_type === 'conservative' && (
        <div className="info-panel">
          <strong>Conservative pathway:</strong> the time criterion counts months
          since injury, and the battery&apos;s evidence (9-month gate, LSI cut-offs)
          comes from post-ACL-reconstruction cohorts — interpret it as an
          extrapolation for non-operative management.
        </div>
      )}
      <RTSBatteryDashboard battery={battery} />
    </div>
  )
}
