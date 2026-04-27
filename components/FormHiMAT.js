import { useState } from 'react'
import { calcHiMAT, HIMAT_ITEMS } from '../lib/clinical'

function makeEmpty() {
  return HIMAT_ITEMS.map(item => {
    if (item.type === 'time') return { val: '', unable: false }
    if (item.type === 'dist') return { trials: ['', '', ''] }
    return { mode: '', val: '' }
  })
}

function itemScore(item, inp) {
  if (item.type === 'time') {
    if (inp.unable) return 0
    const v = Number(inp.val)
    if (!inp.val || !isFinite(v) || v <= 0) return null
    const [t1, t2, t3] = item.t
    if (v <= t3) return 4
    if (v <= t2) return 3
    if (v <= t1) return 2
    return 1
  }
  if (item.type === 'dist') {
    const ts = inp.trials.map(Number)
    if (inp.trials.some(v => v === '') || ts.some(v => !isFinite(v) || v <= 0)) return null
    const avg = (ts[0] + ts[1] + ts[2]) / 3
    const [t1, t2, t3] = item.t
    if (avg < t1) return 1
    if (avg < t2) return 2
    if (avg <= t3) return 3
    return 4
  }
  if (item.type === 'dep') {
    if (!inp.mode) return null
    if (inp.mode === 'IND') return 5
    const v = Number(inp.val)
    if (!inp.val || !isFinite(v) || v <= 0) return null
    const [t1, t2, t3] = item.t
    if (v <= t3) return 4
    if (v <= t2) return 3
    if (v <= t1) return 2
    return 1
  }
  return null
}

function toCalcInput(item, inp) {
  if (item.type === 'time') return { val: Number(inp.val), unable: inp.unable }
  if (item.type === 'dist') return { trials: inp.trials.map(Number) }
  return { mode: inp.mode, val: inp.val ? Number(inp.val) : undefined }
}

export default function FormHiMAT({ onSubmit, loading }) {
  const [inputs, setInputs] = useState(makeEmpty)

  function update(index, patch) {
    setInputs(prev => {
      const next = [...prev]
      next[index] = { ...prev[index], ...patch }
      return next
    })
  }

  function updateTrial(index, trialIndex, value) {
    setInputs(prev => {
      const next = [...prev]
      const trials = [...prev[index].trials]
      trials[trialIndex] = value
      next[index] = { ...prev[index], trials }
      return next
    })
  }

  const scores   = HIMAT_ITEMS.map((item, i) => itemScore(item, inputs[i]))
  const allDone  = scores.every(s => s !== null)
  const total    = allDone ? scores.reduce((a, b) => a + b, 0) : null
  const preview  = allDone ? calcHiMAT(HIMAT_ITEMS.map((item, i) => toCalcInput(item, inputs[i]))) : null
  const classColor = preview?.meta?.classColor ?? 'grey'

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ items: HIMAT_ITEMS.map((item, i) => toCalcInput(item, inputs[i])) }, preview)
  }

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Input</th>
            <th>Score</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {HIMAT_ITEMS.map((item, i) => {
            const inp   = inputs[i]
            const score = scores[i]

            if (item.type === 'time') return (
              <tr key={item.id}>
                <td className="na-text">{i + 1}</td>
                <td>{item.label}</td>
                <td>
                  <input
                    className="input-narrow"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="sec"
                    value={inp.val}
                    disabled={inp.unable}
                    onChange={e => update(i, { val: e.target.value })}
                    style={{ width: 70 }}
                  />
                  {' '}
                  <label style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={inp.unable}
                      onChange={e => update(i, { unable: e.target.checked, val: '' })}
                    />{' '}Unable
                  </label>
                </td>
                <td className="na-text" style={{ fontWeight: 600 }}>
                  {inp.unable ? 0 : (score !== null ? score : '—')}
                </td>
                <td className="na-text">{item.note}</td>
              </tr>
            )

            if (item.type === 'dist') {
              const ts  = inp.trials.map(Number)
              const avg = inp.trials.every(v => v !== '' && isFinite(Number(v)) && Number(v) > 0)
                ? ((ts[0] + ts[1] + ts[2]) / 3).toFixed(1)
                : null
              return (
                <tr key={item.id}>
                  <td className="na-text">{i + 1}</td>
                  <td>{item.label}</td>
                  <td>
                    {inp.trials.map((t, j) => (
                      <input
                        key={j}
                        className="input-narrow"
                        type="number"
                        min="0"
                        step="1"
                        placeholder={`T${j + 1}`}
                        value={t}
                        onChange={e => updateTrial(i, j, e.target.value)}
                        style={{ width: 55, marginRight: 4 }}
                      />
                    ))}
                    {avg && <span className="na-text"> avg {avg} cm</span>}
                  </td>
                  <td className="na-text" style={{ fontWeight: 600 }}>{score !== null ? score : '—'}</td>
                  <td className="na-text">{item.note}</td>
                </tr>
              )
            }

            if (item.type === 'dep') return (
              <tr key={item.id}>
                <td className="na-text">{i + 1}</td>
                <td>{item.label}</td>
                <td>
                  <select
                    className="field-input input-narrow"
                    value={inp.mode}
                    onChange={e => update(i, { mode: e.target.value, val: '' })}
                    style={{ width: 80, marginRight: 6 }}
                  >
                    <option value="">—</option>
                    <option value="IND">IND</option>
                    <option value="DEP">DEP</option>
                  </select>
                  {inp.mode === 'DEP' && (
                    <input
                      className="input-narrow"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="sec"
                      value={inp.val}
                      onChange={e => update(i, { val: e.target.value })}
                      style={{ width: 70 }}
                    />
                  )}
                </td>
                <td className="na-text" style={{ fontWeight: 600 }}>{score !== null ? score : '—'}</td>
                <td className="na-text">{item.note}</td>
              </tr>
            )

            return null
          })}
        </tbody>
      </table>

      <div className="info-panel">
        <strong>HiMAT (Williams 2006):</strong>{' '}
        13 items, total 0–54. IND (independent) on stair items = 5 pts; time items scored 1–4 by thresholds.
        ≥50 = Within normal limits · 40–49 = Mild reduction · &lt;40 = Significant reduction.
        MDC95 ±4/−2 pts. MCID = 2 pts. Norms (18–25yr): male median 54, female median 51.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">HiMAT Total Score</span>
              <div><strong>{total}</strong><span> / 54</span></div>
            </div>
            <span className={`interp-chip chip-${classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 13 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}
