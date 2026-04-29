// ISNCSCI — International Standards for Neurological Classification of SCI
// ASIA/ISCOS 2019 edition. Pure JS — no React, no DOM.

export const ISNCSCI_LEVELS = [
  'C2','C3','C4','C5','C6','C7','C8',
  'T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12',
  'L1','L2','L3','L4','L5',
  'S1','S2','S3','S4-5',
]

export const ISNCSCI_MOTOR_LEVELS = ['C5','C6','C7','C8','T1','L2','L3','L4','L5','S1']

export const ISNCSCI_KEY_MUSCLES = {
  C5: 'Elbow flexors',
  C6: 'Wrist extensors',
  C7: 'Elbow extensors',
  C8: 'Finger flexors (FDP)',
  T1: 'Finger abductors',
  L2: 'Hip flexors',
  L3: 'Knee extensors',
  L4: 'Ankle dorsiflexors',
  L5: 'Long toe extensors',
  S1: 'Ankle plantar flexors',
}

export const ISNCSCI_AIS_DETAIL = {
  A: {
    colour: '#c0392b',
    bg: '#fde8e4',
    title: 'AIS A — Complete Injury',
    body: 'No sensory or motor function is preserved in the sacral segments S4–S5. Voluntary anal contraction (VAC) is absent, deep anal pressure (DAP) is absent, and there is no sacral sensory sparing. This represents the most severe classification.',
    prognosis: 'Approximately 5–10% of AIS A patients convert to AIS B or better within 1 year. Motor recovery below the injury level is uncommon but not impossible, particularly in cervical injuries. The chance of recovering ambulation is low (<5% in thoracic, slightly higher in cervical AIS A). A small number of apparent AIS A patients are reclassified on repeat examination — ensure examination is conducted at least 72 hours post-injury and once spinal shock has resolved.',
  },
  B: {
    colour: '#a05c00',
    bg: '#fef5e7',
    title: 'AIS B — Sensory Incomplete',
    body: 'Sensory but not motor function is preserved below the neurological level of injury, and this includes the sacral segments S4–S5. Motor function may be present more than 3 levels below the motor level on either side (but not in key muscles).',
    prognosis: 'AIS B carries a meaningfully better prognosis than AIS A. Approximately 50–60% of AIS B patients will convert to AIS C or D within 1 year. Preserved sacral sensation is a strong positive prognostic indicator for motor recovery. Preserved sacral pinprick (PP) carries a better prognosis than light touch (LT) alone for motor recovery.',
  },
  C: {
    colour: '#6b6b00',
    bg: '#fafae8',
    title: 'AIS C — Motor Incomplete (Majority Weak)',
    body: 'Motor function is preserved below the neurological level of injury. Fewer than half of key muscles below the single NLI have a muscle grade of 3 or more. Sacral sparing is present (VAC, DAP, or sacral sensation).',
    prognosis: 'AIS C has highly variable outcomes. Approximately 70–80% of AIS C patients will improve by at least one AIS grade. Recovery of functional ambulation is possible, particularly in those with more distal NLI and higher initial motor scores. Predictors of better outcome include higher initial LEMS, younger age, cervical level, and rapid early neurological improvement (particularly in the first 2 weeks).',
  },
  D: {
    colour: '#2d6a4f',
    bg: '#e8f5ee',
    title: 'AIS D — Motor Incomplete (Majority Functional)',
    body: 'Motor function is preserved below the neurological level. At least half of key muscles below the single NLI have a muscle grade of 3 or more. Sacral sparing is present. This represents the most functionally capable incomplete classification.',
    prognosis: 'AIS D carries the best prognosis of incomplete injuries. The majority of AIS D patients will achieve community ambulation with appropriate rehabilitation. Over 90% recover some functional walking, and many return to independent ambulation with or without aids. LEMS >20 at admission is strongly predictive of community ambulation at discharge.',
  },
  E: {
    colour: '#236499',
    bg: '#eaf3fb',
    title: 'AIS E — Normal Neurological Function',
    body: 'Sensation and motor function are graded as normal in all tested segments. AIS E is used in follow-up testing when someone with a documented SCI has recovered normal function — it is not assigned at initial examination in someone without a prior SCI diagnosis.',
    prognosis: 'AIS E does not mean the patient is without SCI — it means neurological testing is normal on this examination. Patients may still experience pain, fatigue, autonomic dysfunction, or other SCI-related sequelae. Continue monitoring and rehabilitation as indicated by functional status.',
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function levelIndex(lv) {
  return ISNCSCI_LEVELS.indexOf(lv)
}

function parseScore(raw) {
  if (raw === null || raw === undefined || raw === '') return null
  const s = String(raw).trim().toUpperCase()
  if (!s || s === '—' || s.startsWith('NT')) return null
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

// ── Core classification functions ─────────────────────────────────────────────

function calcSensoryLevel(ltScores, ppScores) {
  let lastNormal = null
  for (let i = 0; i < ISNCSCI_LEVELS.length - 1; i++) {
    const lv = ISNCSCI_LEVELS[i]
    const lt = parseScore(ltScores[lv])
    const pp = parseScore(ppScores[lv])
    if (lt === null && pp === null) break
    if (lt === 2 && pp === 2) lastNormal = lv
    else break
  }
  return lastNormal
}

function calcMotorLevel(motorScores, sensoryLevel) {
  // Official ISNCSCI rule: lowest key muscle with grade ≥ 3 where ALL muscles
  // above it are grade 5. Inductive check: if every previous step required
  // grade 5, checking only the immediate previous is sufficient.
  let motorLevel = null
  for (let i = 0; i < ISNCSCI_MOTOR_LEVELS.length; i++) {
    const lv  = ISNCSCI_MOTOR_LEVELS[i]
    const raw = motorScores[lv]
    if (raw === '' || raw === null || raw === undefined) break
    if (String(raw).toUpperCase().startsWith('NT')) break
    const n = parseScore(raw)
    if (n === null || n < 3) break
    if (i > 0) {
      const prevN = parseScore(motorScores[ISNCSCI_MOTOR_LEVELS[i - 1]])
      if (prevN !== 5) break
    }
    motorLevel = lv
  }
  return motorLevel || sensoryLevel || null
}

function calcNLI(snsR, snsL, motR, motL) {
  const candidates = [snsR, snsL, motR, motL].filter(Boolean)
  if (!candidates.length) return null
  return candidates.reduce((best, lv) =>
    levelIndex(lv) < levelIndex(best) ? lv : best
  )
}

function calcComplete(vac, dap, ltR_s45, ltL_s45, ppR_s45, ppL_s45) {
  if (vac === 'Y' || dap === 'Y') return 'Incomplete'
  const anySensation = [ltR_s45, ltL_s45, ppR_s45, ppL_s45].some(raw => {
    const n = parseScore(raw)
    return n !== null && n > 0
  })
  if (anySensation) return 'Incomplete'
  const allAbsent = [ltR_s45, ltL_s45, ppR_s45, ppL_s45].every(raw => {
    const s = String(raw || '').trim().toUpperCase()
    return s === '0' || s.startsWith('NT')
  })
  if (vac === 'N' && dap === 'N' && allAbsent) return 'Complete'
  return null
}

function calcAISGrade(complete, nli, motorR, motorL) {
  if (!nli) return null
  if (complete === 'Complete') return 'A'
  if (complete !== 'Incomplete') return null

  const nliIdx = levelIndex(nli)
  let grade3plus = 0, gradeSub3 = 0
  for (const side of [motorR, motorL]) {
    for (const lv of ISNCSCI_MOTOR_LEVELS) {
      if (levelIndex(lv) > nliIdx) {
        const n = parseScore(side[lv])
        if (n !== null) {
          if (n >= 3) grade3plus++
          else gradeSub3++
        }
      }
    }
  }
  const total = grade3plus + gradeSub3
  if (total === 0) return 'B'
  return grade3plus / total >= 0.5 ? 'D' : 'C'
}

function calcZPP(snsLevel, motLevel, ltScores, ppScores, motorScores) {
  const snsIdx = snsLevel ? levelIndex(snsLevel) : -1
  const motIdx = motLevel ? levelIndex(motLevel) : -1

  let zppSns = 'N/A'
  for (let i = snsIdx + 1; i < ISNCSCI_LEVELS.length - 1; i++) {
    const lv = ISNCSCI_LEVELS[i]
    const lt = parseScore(ltScores[lv])
    const pp = parseScore(ppScores[lv])
    if ((lt !== null && lt > 0) || (pp !== null && pp > 0)) zppSns = lv
    else break
  }

  let zppMot = 'N/A'
  for (const lv of ISNCSCI_MOTOR_LEVELS) {
    if (levelIndex(lv) <= motIdx) continue
    const n = parseScore(motorScores[lv])
    if (n !== null && n > 0) zppMot = lv
    else break
  }

  return { zppSns, zppMot }
}

function calcTotals(motorR, motorL, ltR, ltL, ppR, ppL) {
  const UE = ['C5','C6','C7','C8','T1']
  const LE = ['L2','L3','L4','L5','S1']
  const sensLevels = ISNCSCI_LEVELS.slice(0, -1)

  let uemsR = 0, uemsL = 0, lemsR = 0, lemsL = 0
  let uemsRc = 0, uemsLc = 0, lemsRc = 0, lemsLc = 0
  UE.forEach(lv => {
    const r = parseScore(motorR[lv]); if (r !== null) { uemsR += r; uemsRc++ }
    const l = parseScore(motorL[lv]); if (l !== null) { uemsL += l; uemsLc++ }
  })
  LE.forEach(lv => {
    const r = parseScore(motorR[lv]); if (r !== null) { lemsR += r; lemsRc++ }
    const l = parseScore(motorL[lv]); if (l !== null) { lemsL += l; lemsLc++ }
  })

  let ltRt = 0, ltLt = 0, ppRt = 0, ppLt = 0, ltc = 0, ppc = 0
  sensLevels.forEach(lv => {
    const lr = parseScore(ltR[lv]); if (lr !== null) { ltRt += lr; ltc++ }
    const ll = parseScore(ltL[lv]); if (ll !== null) { ltLt += ll; ltc++ }
    const pr = parseScore(ppR[lv]); if (pr !== null) { ppRt += pr; ppc++ }
    const pl = parseScore(ppL[lv]); if (pl !== null) { ppLt += pl; ppc++ }
  })

  return {
    uems: (uemsRc || uemsLc) ? { r: uemsRc ? uemsR : null, l: uemsLc ? uemsL : null, total: uemsR + uemsL } : null,
    lems: (lemsRc || lemsLc) ? { r: lemsRc ? lemsR : null, l: lemsLc ? lemsL : null, total: lemsR + lemsL } : null,
    lt:   ltc  > 0 ? { r: ltRt, l: ltLt, total: ltRt + ltLt } : null,
    pp:   ppc  > 0 ? { r: ppRt, l: ppLt, total: ppRt + ppLt } : null,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function calcISNCSCI({ motorR, motorL, ltR, ltL, ppR, ppL, vac, dap }) {
  const snsR = calcSensoryLevel(ltR, ppR)
  const snsL = calcSensoryLevel(ltL, ppL)
  const motR = calcMotorLevel(motorR, snsR)
  const motL = calcMotorLevel(motorL, snsL)
  const nli  = calcNLI(snsR, snsL, motR, motL)

  const complete = calcComplete(
    vac, dap,
    ltR['S4-5'], ltL['S4-5'],
    ppR['S4-5'], ppL['S4-5'],
  )
  const aisGrade = calcAISGrade(complete, nli, motorR, motorL)
  const totals   = calcTotals(motorR, motorL, ltR, ltL, ppR, ppL)

  const zppR = nli
    ? calcZPP(snsR || nli, motR || nli, ltR, ppR, motorR)
    : { zppSns: 'N/A', zppMot: 'N/A' }
  const zppL = nli
    ? calcZPP(snsL || nli, motL || nli, ltL, ppL, motorL)
    : { zppSns: 'N/A', zppMot: 'N/A' }

  const detail = aisGrade ? ISNCSCI_AIS_DETAIL[aisGrade] : null
  const classColor = !aisGrade ? 'amber'
    : aisGrade === 'A' || aisGrade === 'B' ? 'red'
    : aisGrade === 'C' ? 'amber'
    : 'green'

  return {
    primaryValue: nli && aisGrade ? `${nli} AIS ${aisGrade}` : null,
    primaryUnit: null,
    interpretation: detail ? detail.title : 'Insufficient data',
    meta: {
      classColor,
      aisGrade,
      nli,
      snsR, snsL, motR, motL,
      complete,
      uems:   totals.uems,
      lems:   totals.lems,
      lt:     totals.lt,
      pp:     totals.pp,
      zppSns: { r: zppR.zppSns, l: zppL.zppSns },
      zppMot: { r: zppR.zppMot, l: zppL.zppMot },
    },
  }
}
