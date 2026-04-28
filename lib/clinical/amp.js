// Amputee Mobility Predictor — clinical engine
// Input: { mode: 'pro' | 'nopro', score: number (0–47) }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

const K_LEVELS = {
  K4: { label: 'K4 — High activity',                   color: 'green' },
  K3: { label: 'K3 — Community ambulator',              color: 'green' },
  K2: { label: 'K2 — Limited community ambulator',      color: 'amber' },
  K1: { label: 'K1 — Household ambulator',              color: 'amber' },
  K0: { label: 'K0 — Limited/no ambulation potential',  color: 'red'   },
}

function classifyPRO(score) {
  if (score >= 43) return K_LEVELS.K4
  if (score >= 35) return K_LEVELS.K3
  if (score >= 26) return K_LEVELS.K2
  if (score >= 17) return K_LEVELS.K1
  return K_LEVELS.K0
}

function classifyNoPRO(score) {
  if (score >= 37) return K_LEVELS.K4
  if (score >= 29) return K_LEVELS.K3
  if (score >= 23) return K_LEVELS.K2
  if (score >= 17) return K_LEVELS.K1
  return K_LEVELS.K0
}

export function calcAMP({ mode, score }) {
  if (!mode || isNaN(score) || score < 0 || score > 47) return null

  const { label, color } = mode === 'pro' ? classifyPRO(score) : classifyNoPRO(score)

  return {
    primaryValue: score,
    primaryUnit: '/47',
    interpretation: label,
    meta: { kLevel: label.slice(0, 2), classColor: color },
  }
}
