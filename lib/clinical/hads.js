// Hospital Anxiety and Depression Scale — clinical engine
// 14 items, each scored 0–3
// Odd-indexed items (0,2,4,6,8,10,12) → Anxiety subscale (max 21)
// Even-indexed items (1,3,5,7,9,11,13) → Depression subscale (max 21)
// Input: { items: number[] } — array of 14 scores (0–3 each)
// primaryValue = Anxiety score; depression stored in meta

export const HADS_ITEMS = [
  { text: 'I feel tense or wound up',                                                    subscale: 'A' },
  { text: 'I still enjoy the things I used to enjoy',                                    subscale: 'D' },
  { text: 'I get a sort of frightened feeling as if something awful is about to happen', subscale: 'A' },
  { text: 'I can laugh and see the funny side of things',                                subscale: 'D' },
  { text: 'Worrying thoughts go through my mind',                                        subscale: 'A' },
  { text: 'I feel cheerful',                                                             subscale: 'D' },
  { text: 'I can sit at ease and feel relaxed',                                          subscale: 'A' },
  { text: 'I feel as if I am slowed down',                                               subscale: 'D' },
  { text: 'I get a sort of frightened feeling like butterflies in my stomach',           subscale: 'A' },
  { text: 'I have lost interest in my appearance',                                       subscale: 'D' },
  { text: 'I feel restless as if I have to be on the move',                             subscale: 'A' },
  { text: 'I look forward with enjoyment to things',                                    subscale: 'D' },
  { text: 'I get sudden feelings of panic',                                              subscale: 'A' },
  { text: 'I can enjoy a good book or radio or TV programme',                           subscale: 'D' },
]

function classify(score) {
  if (score <= 7)  return { label: 'Normal',      color: 'green' }
  if (score <= 10) return { label: 'Borderline',  color: 'amber' }
  return           { label: 'Probable case',       color: 'red'   }
}

export function calcHADS({ items }) {
  if (!items || items.length !== 14) return null

  const scores = items.map(Number)
  if (scores.some(s => isNaN(s) || s < 0 || s > 3)) return null

  const anxietyScore    = scores.filter((_, i) => i % 2 === 0).reduce((sum, s) => sum + s, 0)
  const depressionScore = scores.filter((_, i) => i % 2 !== 0).reduce((sum, s) => sum + s, 0)

  const a = classify(anxietyScore)
  const d = classify(depressionScore)

  return {
    primaryValue: anxietyScore,
    primaryUnit: '/21',
    interpretation: a.label,
    meta: {
      classColor: a.color,
      depressionScore,
      depressionClassification: d.label,
      depressionColor: d.color,
      items: scores,
    },
  }
}
