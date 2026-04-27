export const MAS_ITEMS = [
  { label: 'Supine to side lying',               note: 'Turning to the affected side.' },
  { label: 'Supine to sitting over side of bed', note: 'Through side lying.' },
  { label: 'Balanced sitting',                   note: 'No support, feet flat, arms across chest.' },
  { label: 'Sitting to standing',                note: 'From standard chair, arms across chest.' },
  { label: 'Walking',                            note: '10 metres.' },
  { label: 'Upper arm function',                 note: 'Shoulder flexion/extension in supported position.' },
  { label: 'Hand movements',                     note: 'Wrist stability and finger dexterity tasks.' },
  { label: 'Advanced hand activities',           note: 'Picking up and manipulating small objects.' },
]

function classify(total) {
  if (total >= 36) return { label: 'Good motor function (≥36)',          color: 'green' }
  if (total >= 20) return { label: 'Moderate motor impairment (20–35)',  color: 'amber' }
  return                  { label: 'Significant motor impairment (<20)', color: 'red'   }
}

export function calcMAS({ items }) {
  if (!Array.isArray(items) || items.length !== 8) return null
  const scores = items.map(Number)
  if (scores.some(s => !isFinite(s) || s < 0 || s > 6)) return null
  const total = scores.reduce((sum, s) => sum + s, 0)
  const { label, color } = classify(total)
  return {
    primaryValue: total,
    primaryUnit: '/48',
    interpretation: label,
    meta: { classColor: color },
  }
}
