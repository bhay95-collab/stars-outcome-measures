import { useState } from 'react'
import { calcFABQ, FABQ_ITEMS, FABQ_RESPONSE_OPTIONS } from '../lib/clinical'

const EMPTY_ITEMS = Array(FABQ_ITEMS.length).fill('')

export default function FormFABQ({ onSubmit, loading }) {
  const [items, setItems] = useState(EMPTY_ITEMS)

  const scores    = items.map(v => (v === '' ? NaN : Number(v)))
  const allFilled = scores.every(s => !isNaN(s))
  const preview   = allFilled ? calcFABQ({ items: scores }) : null

  function setItem(index, value) {
    setItems(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ items: scores }, preview)
  }

  const rows = FABQ_ITEMS.flatMap((item, i) => {
    const isSectionStart = i === 0 || item.section !== FABQ_ITEMS[i - 1].section
    const itemRow = (
      <tr key={`item-${i}`}>
        <td className="na-text">{i + 1}</td>
        <td>{item.label}</td>
        <td>
          <select
            className="field-input input-narrow"
            value={items[i]}
            onChange={e => setItem(i, e.target.value)}
            required
          >
            <option value="">—</option>
            {FABQ_RESPONSE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </td>
      </tr>
    )
    if (!isSectionStart) return [itemRow]
    return [
      <tr key={`section-${i}`}>
        <td colSpan={3} className="na-text"><strong>{item.section}</strong></td>
      </tr>,
      itemRow,
    ]
  })

  return (
    <form onSubmit={handleSubmit}>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Statement (0 completely disagree – 6 completely agree)</th>
            <th>Response</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>

      <div className="info-panel">
        <strong>FABQ (Waddell 1993):</strong>{' '}
        16 items, two scored subscales (5 distractors). Physical Activity (items
        2–5, /24, &gt;15 high) and Work (items 6,7,9,10,11,12,15, /42, &gt;34
        high). Higher = more fear-avoidance — a yellow flag for delayed recovery.
      </div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">Fear-Avoidance Beliefs Questionnaire</span>
              <div>Physical activity: <strong>{preview.primaryValue}/24</strong> · Work: <strong>{preview.meta.work}/42</strong></div>
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>{preview.interpretation}</span>
          </div>
        ) : (
          <em>Complete all 16 items to calculate results.</em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}
