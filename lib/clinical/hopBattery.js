// Single-leg hop test battery — Limb Symmetry Index (LSI) clinical engine.
// Pure JS — no React/DOM/Supabase. The four-hop battery (Reid 2007, Phys Ther
// 87:337; Noyes 1991) is the standard functional limb-symmetry test after ACL
// injury/reconstruction:
//   1. Single hop for distance        (longer = better)
//   2. Triple hop for distance        (longer = better)
//   3. Triple crossover hop for dist. (longer = better)
//   4. 6-metre timed hop              (FASTER = better → LSI inverts)
//
// LSI per distance hop  = involved / uninvolved × 100.
// LSI for the timed hop = uninvolved / involved × 100 (lower time is better, so
//   the ratio inverts to keep "higher LSI = better").
// Pass threshold for return to sport: each hop LSI >= 90% (Grindem 2016, BJSM
// 50:804; Reid 2007). The limiting (minimum) LSI is the primary value — the
// battery passes only when the weakest hop clears 90%. Bands are descriptive;
// only the 90% cut-off is a published RTS criterion.
//
// Input (all > 0, paired same-unit values):
//   { singleInv, singleUninv, tripleInv, tripleUninv,
//     crossInv, crossUninv, timedInv, timedUninv }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const RTS_PASS = 90  // % — return-to-sport hop LSI cut-off (Grindem 2016)

function distanceLSI(involved, uninvolved) {
  return (involved / uninvolved) * 100
}

// Timed hop: faster (smaller time) is better, so invert the ratio.
function timedLSI(involvedTime, uninvolvedTime) {
  return (uninvolvedTime / involvedTime) * 100
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function classify(minLSI) {
  if (minLSI >= RTS_PASS) return { label: 'All hops symmetrical (≥90%) — meets RTS hop cut-off', color: 'green' }
  if (minLSI >= 80) return { label: 'Mild hop asymmetry (80–89%)', color: 'amber' }
  return { label: 'Hop deficit (<80%)', color: 'red' }
}

export function calcHopBattery(input = {}) {
  const fields = [
    'singleInv', 'singleUninv', 'tripleInv', 'tripleUninv',
    'crossInv', 'crossUninv', 'timedInv', 'timedUninv',
  ]
  const entries = []
  for (const f of fields) {
    const n = Number(input[f])
    if (!Number.isFinite(n) || n <= 0) return null
    entries.push([f, n])
  }
  const v = Object.fromEntries(entries)

  const single = round1(distanceLSI(v.singleInv, v.singleUninv))
  const triple = round1(distanceLSI(v.tripleInv, v.tripleUninv))
  const crossover = round1(distanceLSI(v.crossInv, v.crossUninv))
  const timed = round1(timedLSI(v.timedInv, v.timedUninv))

  const all = [single, triple, crossover, timed]
  const minLSI = Math.min(...all)
  const { label, color } = classify(minLSI)

  return {
    primaryValue: minLSI,
    primaryUnit: '%',
    interpretation: label,
    meta: {
      classColor: color,
      single, triple, crossover, timed,
      meetsRTS: all.every(lsi => lsi >= RTS_PASS),
    },
  }
}

export const HOP_BATTERY_RTS_PASS = RTS_PASS
