import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { calcISNCSCI, ISNCSCI_LEVELS, ISNCSCI_MOTOR_LEVELS, ISNCSCI_KEY_MUSCLES, ISNCSCI_AIS_DETAIL } from '../lib/clinical'
import { exportISNCSCIPdf } from '../lib/clinical/isncsciPdfExport'

const DermatomeMap = dynamic(() => import('./DermatomeMap'), { ssr: false })

const MOTOR_SET = new Set(ISNCSCI_MOTOR_LEVELS)

function initMotor() {
  return Object.fromEntries(ISNCSCI_MOTOR_LEVELS.map(lv => [lv, '']))
}
function initSens() {
  return Object.fromEntries(ISNCSCI_LEVELS.map(lv => [lv, '']))
}

function validateMotor(raw) {
  const v = raw.toUpperCase().replace(/[^0-9NT*]/g, '')
  if (/^\d+$/.test(v)) return String(Math.min(5, parseInt(v, 10)))
  return v.slice(0, 3)
}
function validateSens(raw) {
  const v = raw.toUpperCase().replace(/[^0-9NT*]/g, '')
  if (/^\d+$/.test(v)) return String(Math.min(2, parseInt(v, 10)))
  return v.slice(0, 3)
}

function motorCellStyle(val) {
  const up = String(val).toUpperCase()
  if (up.startsWith('NT')) return { background: '#f0eafa', borderColor: '#9b7fd4' }
  const n = val === '' ? null : parseInt(val, 10)
  if (n === null) return { background: '#e8f0f9', borderColor: '#b8cfe8' }
  if (n === 0)   return { background: '#fde8e4', borderColor: '#e07060' }
  if (n <= 2)    return { background: '#fef5e7', borderColor: '#e8b84b' }
  if (n <= 4)    return { background: '#e8f5f0', borderColor: '#56b87a' }
  return               { background: '#e8f5ee', borderColor: '#3da864' }
}
function sensCellStyle(val) {
  if (!val) return { background: '#fffef9', borderColor: '#d8e2ec' }
  const v = String(val).toUpperCase()
  if (v === '0')         return { background: '#fde8e4', borderColor: '#e07060' }
  if (v === '1')         return { background: '#fef5e7', borderColor: '#e8b84b' }
  if (v === '2')         return { background: '#e8f5ee', borderColor: '#56b87a' }
  return                        { background: '#f0eafa', borderColor: '#9b7fd4' }
}

const CELL_BASE = {
  width: 36, textAlign: 'center', fontFamily: 'monospace', fontSize: 12,
  color: '#111', outline: 'none', borderRadius: 4, padding: '3px 2px',
  border: '1px solid', boxSizing: 'border-box',
}

function CellInput({ value, onChange, isMotor }) {
  return (
    <input
      className="field-input"
      type="text"
      maxLength={3}
      placeholder="—"
      value={value}
      style={{ ...CELL_BASE, ...(isMotor ? motorCellStyle(value) : sensCellStyle(value)) }}
      onChange={e => onChange(isMotor ? validateMotor(e.target.value) : validateSens(e.target.value))}
    />
  )
}

const AIS_COLOR = { A: '#c0392b', B: '#a05c00', C: '#6b6b00', D: '#2d6a4f', E: '#236499' }

const TH = (extra = {}) => ({ textAlign: 'center', fontSize: 11, padding: '3px 4px 6px', fontWeight: 600, color: '#5f6b7a', ...extra })
const TD = { padding: '2px 3px', borderBottom: '1px solid #d8e2ec', verticalAlign: 'middle', textAlign: 'center' }
const TD_LVL = (isMotor) => ({
  ...TD, padding: '3px 8px', borderLeft: '2px solid #b8cfe8', borderRight: '2px solid #b8cfe8',
  fontSize: 12, fontWeight: 700, width: 60, whiteSpace: 'nowrap',
  color: isMotor ? '#236499' : '#5f6b7a',
  background: isMotor ? '#eaf3fb' : '#f7fafc',
})
const BOX = { padding: '10px 14px', background: '#f7fafc', border: '1px solid #d8e2ec', borderRadius: 8 }

export default function FormISNCSCI({ patient, onSubmit, loading }) {
  const [motorR, setMotorR] = useState(initMotor)
  const [motorL, setMotorL] = useState(initMotor)
  const [ltR,    setLtR]    = useState(initSens)
  const [ltL,    setLtL]    = useState(initSens)
  const [ppR,    setPpR]    = useState(initSens)
  const [ppL,    setPpL]    = useState(initSens)
  const [vac,    setVac]    = useState('')
  const [dap,    setDap]    = useState('')
  const [exporting, setExporting] = useState(false)

  const preview = useMemo(
    () => calcISNCSCI({ motorR, motorL, ltR, ltL, ppR, ppL, vac, dap }),
    [motorR, motorL, ltR, ltL, ppR, ppL, vac, dap],
  )

  const setMotorCell = useCallback((side, lv, val) => {
    const set = side === 'r' ? setMotorR : setMotorL
    set(prev => ({ ...prev, [lv]: val }))
  }, [])

  const setSensCell = useCallback((side, mod, lv, val) => {
    const set = mod === 'lt'
      ? (side === 'r' ? setLtR : setLtL)
      : (side === 'r' ? setPpR : setPpL)
    set(prev => ({ ...prev, [lv]: val }))
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview?.primaryValue || loading) return
    onSubmit({ motorR, motorL, ltR, ltL, ppR, ppL, vac, dap }, preview)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportISNCSCIPdf({
        patient,
        inputs: { motorR, motorL, ltR, ltL, ppR, ppL, vac, dap },
        results: preview || { meta: {} },
      })
    } catch (err) {
      alert('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const meta   = preview?.meta ?? {}
  const detail = meta.aisGrade ? ISNCSCI_AIS_DETAIL[meta.aisGrade] : null
  const aisClr = meta.aisGrade ? AIS_COLOR[meta.aisGrade] : '#8a96a3'

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div className="measure-title">ISNCSCI — Spinal Cord Injury Classification</div>
          <div className="measure-subtitle">International Standards for Neurological Classification of Spinal Cord Injury (ASIA/ISCOS 2019). Type values directly into each cell. Scores auto-calculate.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: '3px 8px', borderRadius: 4, background: '#eaf3fb', color: '#236499', border: '1px solid #b8cfe8' }}>ASIA/ISCOS 2019</span>
          <button type="button" onClick={handleExport} disabled={exporting}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: '#236499', color: '#fff', border: 'none', borderRadius: 6, cursor: exporting ? 'default' : 'pointer', opacity: exporting ? 0.7 : 1 }}>
            {exporting ? 'Generating…' : '⬇ Export ASIA PDF'}
          </button>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px', background: '#f7fafc', border: '1px solid #d8e2ec', borderRadius: 8, fontSize: 12 }}>
        <div><strong style={{ color: '#5f6b7a' }}>Sensory (LT &amp; PP):</strong>&nbsp; 0 = Absent &nbsp;·&nbsp; 1 = Altered &nbsp;·&nbsp; 2 = Normal &nbsp;·&nbsp; NT = Not testable</div>
        <div><strong style={{ color: '#236499' }}>Motor (M):</strong>&nbsp; 0–5 MRC scale &nbsp;·&nbsp; NT = Not testable &nbsp;·&nbsp; Motor cells shaded blue — key muscles only</div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, width: 'fit-content', margin: '0 auto' }}>

          {/* Right-side inputs */}
          <div>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#236499', marginBottom: 4 }}>RIGHT</div>
            <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={TH({ color: '#236499', width: 40 })}>M</th>
                  <th style={TH({ width: 40 })}>LT</th>
                  <th style={TH({ width: 40 })}>PP</th>
                  <th style={TH({ width: 60 })}>LEVEL</th>
                </tr>
              </thead>
              <tbody>
                {ISNCSCI_LEVELS.map(lv => {
                  const hasM   = MOTOR_SET.has(lv)
                  const muscle = ISNCSCI_KEY_MUSCLES[lv]
                  const dash   = <span style={{ display: 'inline-block', width: 36, color: '#8a96a3', fontSize: 10, textAlign: 'center' }}>—</span>
                  return (
                    <tr key={lv}>
                      <td style={TD}>{hasM ? <CellInput value={motorR[lv]} isMotor onChange={v => setMotorCell('r', lv, v)} /> : dash}</td>
                      <td style={TD}><CellInput value={ltR[lv]} isMotor={false} onChange={v => setSensCell('r', 'lt', lv, v)} /></td>
                      <td style={TD}><CellInput value={ppR[lv]} isMotor={false} onChange={v => setSensCell('r', 'pp', lv, v)} /></td>
                      <td style={TD_LVL(hasM)}>
                        {lv}
                        {muscle && <div style={{ fontSize: 9, fontWeight: 400, color: '#8a96a3', marginTop: 1 }}>{muscle}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Dermatome map */}
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 28 }}>
            <DermatomeMap ltR={ltR} ltL={ltL} ppR={ppR} ppL={ppL} />
          </div>

          {/* Left-side inputs */}
          <div>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#236499', marginBottom: 4 }}>LEFT</div>
            <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={TH({ width: 60 })}>LEVEL</th>
                  <th style={TH({ width: 40 })}>LT</th>
                  <th style={TH({ width: 40 })}>PP</th>
                  <th style={TH({ color: '#236499', width: 40 })}>M</th>
                </tr>
              </thead>
              <tbody>
                {ISNCSCI_LEVELS.map(lv => {
                  const hasM   = MOTOR_SET.has(lv)
                  const muscle = ISNCSCI_KEY_MUSCLES[lv]
                  const dash   = <span style={{ display: 'inline-block', width: 36, color: '#8a96a3', fontSize: 10, textAlign: 'center' }}>—</span>
                  return (
                    <tr key={lv}>
                      <td style={TD_LVL(hasM)}>
                        {lv}
                        {muscle && <div style={{ fontSize: 9, fontWeight: 400, color: '#8a96a3', marginTop: 1 }}>{muscle}</div>}
                      </td>
                      <td style={TD}><CellInput value={ltL[lv]} isMotor={false} onChange={v => setSensCell('l', 'lt', lv, v)} /></td>
                      <td style={TD}><CellInput value={ppL[lv]} isMotor={false} onChange={v => setSensCell('l', 'pp', lv, v)} /></td>
                      <td style={TD}>{hasM ? <CellInput value={motorL[lv]} isMotor onChange={v => setMotorCell('l', lv, v)} /> : dash}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ── Sacral sparing ──────────────────────────────────────────── */}
      <div className="section-label" style={{ marginTop: 16, marginBottom: 8 }}>Sacral Sparing</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        {[['VAC', 'Voluntary Anal Contraction', vac, setVac], ['DAP', 'Deep Anal Pressure', dap, setDap]].map(([abbr, label, val, set]) => (
          <div key={abbr} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2933' }}>{abbr}</span>
            <span style={{ fontSize: 12, color: '#5f6b7a' }}>{label}</span>
            <select className="field-input input-narrow" value={val} onChange={e => set(e.target.value)}>
              <option value="">—</option>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
        ))}
      </div>

      {/* ── Subscores ───────────────────────────────────────────────── */}
      <div className="section-label" style={{ marginBottom: 8 }}>Subscores &amp; Totals</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          ['UEMS Right', meta.uems?.r,    '/25'],
          ['UEMS Left',  meta.uems?.l,    '/25'],
          ['LEMS Right', meta.lems?.r,    '/25'],
          ['LEMS Left',  meta.lems?.l,    '/25'],
          ['LT Total',   meta.lt?.total,  '/112'],
          ['PP Total',   meta.pp?.total,  '/112'],
        ].map(([label, val, denom]) => (
          <div key={label} style={{ ...BOX, textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1f2933', lineHeight: 1 }}>{val != null ? val : '—'}</div>
            <div style={{ fontSize: 11, color: '#8a96a3' }}>{denom}</div>
            <div style={{ fontSize: 11, color: '#5f6b7a', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Classification ──────────────────────────────────────────── */}
      <div className="section-label" style={{ marginBottom: 8 }}>Neurological Classification</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {[
          ['Sensory Level — Right',    meta.snsR],
          ['Sensory Level — Left',     meta.snsL],
          ['Motor Level — Right',      meta.motR],
          ['Motor Level — Left',       meta.motL],
          ['Neurological Level (NLI)', meta.nli],
          ['Complete / Incomplete',    meta.complete],
          ['ZPP Sensory (R / L)',      meta.zppSns ? `${meta.zppSns.r} / ${meta.zppSns.l}` : null],
          ['ZPP Motor (R / L)',        meta.zppMot ? `${meta.zppMot.r} / ${meta.zppMot.l}` : null],
        ].map(([label, val]) => (
          <div key={label} style={{ ...BOX, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: '#8a96a3', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2933' }}>{val || '—'}</div>
          </div>
        ))}
        <div style={{ ...BOX, minWidth: 160 }}>
          <div style={{ fontSize: 11, color: '#8a96a3', marginBottom: 6 }}>ASIA Impairment Scale (AIS)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: aisClr, color: '#fff', fontWeight: 800, fontSize: 16 }}>
              {meta.aisGrade || '?'}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2933' }}>{meta.aisGrade ? `AIS ${meta.aisGrade}` : '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Interpretation ──────────────────────────────────────────── */}
      {detail && (
        <div style={{ marginBottom: 16, border: '1px solid #d8e2ec', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: '#236499', color: '#fff', padding: '12px 20px', fontWeight: 700, fontSize: 13 }}>Clinical Interpretation</div>
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 8, borderLeft: `4px solid ${detail.colour}`, background: detail.bg }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: detail.colour, marginBottom: 6 }}>{detail.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: '#1f2933' }}>{detail.body}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#8a96a3', marginBottom: 10 }}>Classification Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
              <tbody>
                {[
                  ['NLI',        meta.nli || '—',   'Most caudal segment with intact sensory and motor function on both sides'],
                  ['AIS Grade',  meta.aisGrade ? `AIS ${meta.aisGrade}` : '—', detail.title],
                  ['Complete / Incomplete', meta.complete || '—', meta.complete === 'Complete' ? 'No sacral sparing — VAC absent, DAP absent, no S4-5 sensation' : 'Sacral sparing present'],
                  ['UEMS Total', meta.uems ? `${meta.uems.total}/50`  : '—', 'Upper extremity motor score (C5–T1 bilateral)'],
                  ['LEMS Total', meta.lems ? `${meta.lems.total}/50`  : '—', 'Lower extremity motor score (L2–S1 bilateral)'],
                  ['LT Total',   meta.lt   ? `${meta.lt.total}/112`   : '—', 'Light touch score across 28 dermatomes × 2 sides'],
                  ['PP Total',   meta.pp   ? `${meta.pp.total}/112`   : '—', 'Pin prick score across 28 dermatomes × 2 sides'],
                  ['ZPP Sensory', meta.zppSns ? `R: ${meta.zppSns.r} / L: ${meta.zppSns.l}` : '—', meta.aisGrade === 'A' ? 'Most caudal level with any sensory innervation (AIS A only)' : 'ZPP applies to AIS A only'],
                  ['ZPP Motor',   meta.zppMot ? `R: ${meta.zppMot.r} / L: ${meta.zppMot.l}` : '—', meta.aisGrade === 'A' ? 'Most caudal level with any motor innervation (AIS A only)' : 'ZPP applies to AIS A only'],
                ].map(([lbl, val, note]) => (
                  <tr key={lbl} style={{ borderBottom: '1px solid #d8e2ec' }}>
                    <td style={{ padding: '8px 0', fontWeight: 600, color: '#5f6b7a', width: '34%' }}>{lbl}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1f2933' }}>{val}</td>
                    <td style={{ padding: '8px 0', color: '#8a96a3', fontSize: 12 }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '14px 16px', background: '#fffbf0', border: '1px solid #e8d9a0', borderRadius: 8, fontSize: 12, color: '#7a5c00', lineHeight: 1.8 }}>
              <strong>Prognosis:</strong> {detail.prognosis}
            </div>
          </div>
        </div>
      )}

      {/* ── References ──────────────────────────────────────────────── */}
      <div className="info-panel" style={{ marginBottom: 16 }}>
        <strong>References:</strong> American Spinal Injury Association (2019). International Standards for Neurological Classification of Spinal Cord Injury. Richmond, VA: ASIA. | Kirshblum SC et al. (2011). J Spinal Cord Med 34(6):535–46. | Fehlings MG et al. (2012). J Neurotrauma 29(S1).
      </div>

      {/* ── Save ────────────────────────────────────────────────────── */}
      <div className="result-box">
        {preview?.primaryValue
          ? <p><strong>{preview.primaryValue}</strong> — {preview.interpretation}</p>
          : <em>Enter motor and sensory scores to generate classification.</em>
        }
        <button type="submit" disabled={!preview?.primaryValue || loading}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>

    </form>
  )
}
