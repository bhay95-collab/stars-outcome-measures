// Brain Injury Vision Inventory — clinical engine
// 15 items rated 0–3 (0=Not at all, 1=A little, 2=Quite a lot, 3=A great deal)
// Total range 0–45; higher score = greater vision impact on daily life
// Input: { items: number[] } — array of 15 scores

export const BIVI_ITEMS = [
  'My vision affects my ability to look after myself (e.g. washing, dressing, preparing meals)',
  'My vision makes me less confident',
  'My vision makes me feel frustrated or irritated',
  'My vision makes everyday tasks take longer',
  'My vision affects my ability to do leisure activities (e.g. hobbies, sports, watching TV)',
  'My vision affects my ability to read (e.g. books, mail, labels)',
  'My vision affects my ability to use technology (e.g. phone, tablet, computer)',
  'My vision affects my ability to find my way around (inside or outside)',
  "My vision affects my ability to recognise people's faces",
  'My vision makes me feel anxious about my safety',
  'My vision affects my ability to drive or use public transport',
  'My vision makes me feel socially isolated',
  'My vision affects my ability to work or do voluntary activities',
  'My vision affects my relationships with family or friends',
  'Overall, I am bothered by my vision difficulties',
]

function classify(total) {
  if (total <= 10) return { label: 'Low impact on quality of life',      color: 'green' }
  if (total <= 25) return { label: 'Moderate impact on quality of life', color: 'amber' }
  return                  { label: 'High impact on quality of life',      color: 'red'   }
}

export function calcBIVI({ items }) {
  if (!items || items.length !== 15) return null

  const scores = items.map(Number)
  if (scores.some(s => isNaN(s) || s < 0 || s > 3)) return null

  const total = scores.reduce((sum, s) => sum + s, 0)
  const { label, color } = classify(total)

  return {
    primaryValue: total,
    primaryUnit: '/45',
    interpretation: label,
    meta: { classColor: color },
  }
}
