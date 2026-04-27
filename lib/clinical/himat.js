// HiMAT item definitions — 3 types: time, dist, dep
// time: scored 0–4 via scoreTime thresholds
// dist: 3 trials averaged, scored 1–4 via scoreDist thresholds
// dep:  IND=5, DEP+time scored 0–4 via scoreTime thresholds
export const HIMAT_ITEMS = [
  { id: 'h0',  label: 'Walk',                         type: 'time', t: [6.6,  5.4,  4.3],  note: 'Middle 10m of 20m. Unable = score 0.' },
  { id: 'h1',  label: 'Walk Backward',                type: 'time', t: [13.3, 8.1,  5.8],  note: 'As Walk, backwards.' },
  { id: 'h2',  label: 'Walk on Toes',                 type: 'time', t: [8.9,  7.0,  5.4],  note: 'Heel contact in middle 10m = fail (0).' },
  { id: 'h3',  label: 'Walk Over Obstacle',           type: 'time', t: [7.1,  5.4,  4.5],  note: 'House brick. Step around = fail (0).' },
  { id: 'h4',  label: 'Run',                          type: 'time', t: [2.7,  2.0,  1.7],  note: 'Middle 10m. No flight phase = fail (0).' },
  { id: 'h5',  label: 'Skip',                         type: 'time', t: [4.0,  3.5,  3.0],  note: 'Middle 10m. No flight phase = fail (0).' },
  { id: 'h6',  label: 'Hop Forward',                  type: 'time', t: [7.0,  5.3,  4.1],  note: '10m on more-affected leg. Unable = 0.' },
  { id: 'h7',  label: 'Bound Affected (avg cm)',      type: 'dist', t: [80,   104,  132],   note: 'Jump from less-affected, land on affected. Avg 3 trials.' },
  { id: 'h8',  label: 'Bound Less-Affected (avg cm)', type: 'dist', t: [82,   106,  129],   note: 'Jump from affected, land on less-affected. Avg 3 trials.' },
  { id: 'h9',  label: 'Up Stairs Dependent',          type: 'dep',  t: [22.8, 14.6, 12.3], note: "Rail or non-reciprocal. 'Independent' = score 5." },
  { id: 'h10', label: 'Up Stairs Independent',        type: 'time', t: [9.1,  7.6,  6.8],  note: 'No rail, reciprocal. Unable = 0.' },
  { id: 'h11', label: 'Down Stairs Dependent',        type: 'dep',  t: [24.3, 17.6, 12.8], note: 'As Up Dependent, reverse.' },
  { id: 'h12', label: 'Down Stairs Independent',      type: 'time', t: [8.4,  6.6,  5.8],  note: 'As Up Independent, reverse.' },
]

function scoreTime(val, t, unable) {
  if (unable || !isFinite(val) || val <= 0) return 0
  const [t1, t2, t3] = t
  if (val <= t3) return 4
  if (val <= t2) return 3
  if (val <= t1) return 2
  return 1
}

function scoreDist(avg, t) {
  if (!isFinite(avg) || avg <= 0) return null
  const [t1, t2, t3] = t
  if (avg < t1) return 1
  if (avg < t2) return 2
  if (avg <= t3) return 3
  return 4
}

function classify(total) {
  if (total >= 50) return { label: 'Within normal limits',             color: 'green' }
  if (total >= 40) return { label: 'Mild reduction from norms',       color: 'amber' }
  return                  { label: 'Significant reduction from norms', color: 'red'   }
}

// inputs: array of 13 items matching HIMAT_ITEMS order
// time item:  { val: number, unable: boolean }
// dist item:  { trials: [number, number, number] }
// dep item:   { mode: 'IND'|'DEP', val?: number }
export function calcHiMAT(inputs) {
  if (!Array.isArray(inputs) || inputs.length !== 13) return null

  let total = 0
  const itemScores = []

  for (let i = 0; i < HIMAT_ITEMS.length; i++) {
    const item = HIMAT_ITEMS[i]
    const inp  = inputs[i]
    if (!inp) return null

    let score

    if (item.type === 'time') {
      const val    = Number(inp.val)
      const unable = Boolean(inp.unable)
      if (!unable && (!isFinite(val) || val <= 0)) return null
      score = scoreTime(val, item.t, unable)

    } else if (item.type === 'dist') {
      const trials = (inp.trials || []).map(Number)
      if (trials.length !== 3 || trials.some(v => !isFinite(v) || v <= 0)) return null
      const avg = (trials[0] + trials[1] + trials[2]) / 3
      score = scoreDist(avg, item.t)
      if (score === null) return null

    } else if (item.type === 'dep') {
      if (!inp.mode) return null
      if (inp.mode === 'IND') {
        score = 5
      } else {
        const val = Number(inp.val)
        if (!isFinite(val) || val <= 0) return null
        score = scoreTime(val, item.t, false)
      }
    }

    itemScores.push(score)
    total += score
  }

  const { label, color } = classify(total)
  return {
    primaryValue: total,
    primaryUnit: '/54',
    interpretation: label,
    meta: { classColor: color, itemScores },
  }
}
