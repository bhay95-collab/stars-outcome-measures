import { useState } from 'react'

function buildEmptyItems(sections) {
  const empty = {}
  for (const section of sections) empty[section.key] = Array(section.items.length).fill('')
  return empty
}

// Shared entry form for the KOOS/HOOS instrument family.
// Each subscale is scored independently; up to 2 unanswered items per subscale
// are tolerated by the scoring engine, more leaves that subscale unscored.
export default function KoosFamilyForm({ sections, calc, measureName, infoText, onSubmit, loading }) {
  const [items, setItems] = useState(() => buildEmptyItems(sections))

  const numericItems = {}
  for (const section of sections) {
    numericItems[section.key] = items[section.key].map(v => (v === '' ? null : Number(v)))
  }
  const preview = calc({ items: numericItems })
  const anyAnswered = sections.some(section => numericItems[section.key].some(v => v != null))
  const unscoredSections = preview
    ? sections.filter(section => section.key !== 'pain' && preview.meta[section.key] == null)
    : []

  function setItem(sectionKey, index, value) {
    setItems(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((item, i) => (i === index ? value : item)),
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!preview || loading) return
    onSubmit({ items: numericItems }, preview)
  }

  function subscaleScore(sectionKey) {
    if (!preview) return null
    return sectionKey === 'pain' ? preview.primaryValue : preview.meta[sectionKey]
  }

  return (
    <form onSubmit={handleSubmit}>
      {sections.map(section => (
        <div key={section.key} data-measure-section="">
          <div data-measure-section-head="">
            <strong>{section.label}</strong>
            <span>
              {subscaleScore(section.key) != null
                ? <>Subscale: <strong>{subscaleScore(section.key)}/100</strong></>
                : 'Subscale pending'}
            </span>
          </div>
          <p className="na-text">{section.intro}</p>
          <table className="data-table">
            <tbody>
              {section.items.map((item, i) => (
                <tr key={i}>
                  <td className="na-text">{i + 1}</td>
                  <td>{item.label}</td>
                  <td>
                    <select
                      className="field-input input-narrow"
                      value={items[section.key][i]}
                      onChange={e => setItem(section.key, i, e.target.value)}
                      aria-label={`${section.label} item ${i + 1}: ${item.label}`}
                    >
                      <option value="">—</option>
                      {item.options.map((label, score) => (
                        <option key={score} value={score}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="info-panel">{infoText}</div>

      <div className="result-box">
        {preview ? (
          <div className="result-row">
            <div>
              <span className="result-label">{measureName}</span>
              <div>{preview.interpretation}</div>
              {unscoredSections.length > 0 && (
                <div className="na-text">
                  Not scored (more than 2 items unanswered): {unscoredSections.map(s => s.shortLabel).join(', ')}
                </div>
              )}
            </div>
            <span className={`interp-chip chip-${preview.meta.classColor}`}>
              Pain {preview.primaryValue}/100
            </span>
          </div>
        ) : (
          <em>
            {anyAnswered
              ? 'Answer more items — the Pain subscale has too many unanswered items to score (maximum 2 missing).'
              : 'Answer the items in each subscale to calculate results. Up to 2 items per subscale may be left unanswered.'}
          </em>
        )}
        <button type="submit" disabled={!preview || loading} style={{ width: 'auto', padding: '8px 20px', alignSelf: 'center' }}>
          {loading ? 'Saving…' : 'Save assessment'}
        </button>
      </div>
    </form>
  )
}
