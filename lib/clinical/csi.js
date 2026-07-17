// Central Sensitization Inventory (CSI) — clinical engine
// Mayer TG, Neblett R, Cohen H, et al. The development and psychometric
// validation of the central sensitization inventory. Pain Pract. 2012;12(4):276-85.
// Severity levels: Neblett R, Cohen H, Choi Y, et al. Establishing clinically
// relevant severity levels for the central sensitization inventory. Pain Pract.
// 2013;13(5):359-69. User's manual: Neblett R. The Central Sensitization
// Inventory: A User's Manual. J Appl Biobehav Res. 2018;23:e12123.
//
// Part A: 25 items, each Never(0)–Always(4). Sum = 0–100. Higher = worse.
// Severity bands (Neblett 2013): subclinical 0–29, mild 30–39, moderate 40–49,
// severe 50–59, extreme 60–100. Clinical cutoff ≥40 (sensitivity 81%,
// specificity 75%, Mayer/Neblett 2013, Journal of Pain ROC analysis).
// No published MCID or MDC exists for the CSI in the literature — do not
// invent one; previous/current comparison is raw point change only.
//
// Part B: 10 yes/no diagnosis-history items (7 central sensitivity syndromes +
// 3 CS-related conditions). Informational only — the manual is explicit that
// "Part B is for information only and is not scored." Never fold into the total.
//
// Input: { items: number[25] } — each 0–4 integer.
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const CSI_RESPONSE_OPTIONS = [
  { value: 0, label: '0 — Never' },
  { value: 1, label: '1 — Rarely' },
  { value: 2, label: '2 — Sometimes' },
  { value: 3, label: '3 — Often' },
  { value: 4, label: '4 — Always' },
]

export const CSI_ITEMS = [
  'I feel tired and unrefreshed when I wake from sleeping.',
  'My muscles feel stiff and achy.',
  'I have anxiety attacks.',
  'I grind or clench my teeth.',
  'I have problems with diarrhea and/or constipation.',
  'I need help in performing my daily activities.',
  'I am sensitive to bright lights.',
  'I get tired very easily when I am physically active.',
  'I feel pain all over my body.',
  'I have headaches.',
  'I feel discomfort in my bladder and/or burning when I urinate.',
  'I do not sleep well.',
  'I have difficulty concentrating.',
  'I have skin problems such as dryness, itchiness, or rashes.',
  'Stress makes my physical symptoms get worse.',
  'I feel sad or depressed.',
  'I have low energy.',
  'I have muscle tension in my neck and shoulders.',
  'I have pain in my jaw.',
  'Certain smells, such as perfumes, make me feel dizzy and nauseated.',
  'I have to urinate frequently.',
  'My legs feel uncomfortable and restless when I am trying to go to sleep at night.',
  'I have difficulty remembering things.',
  'I suffered trauma as a child.',
  'I have pain in my pelvic area.',
]

// Part B — informational diagnosis history, NOT scored (Neblett 2018).
export const CSI_PART_B_ITEMS = [
  'Restless Leg Syndrome',
  'Chronic Fatigue Syndrome',
  'Fibromyalgia',
  'Temporomandibular Joint Disorder',
  'Migraine or tension headaches',
  'Irritable Bowel Syndrome',
  'Multiple Chemical Sensitivities',
  'Neck injury (including whiplash)',
  'Anxiety or panic attacks',
  'Depression',
]

const CUTOFF = 40

function classify(score) {
  if (score <= 29) return { label: 'Subclinical (0–29)', color: 'green' }
  if (score <= 39) return { label: 'Mild (30–39)',        color: 'green' }
  if (score <= 49) return { label: 'Moderate (40–49)',    color: 'amber' }
  if (score <= 59) return { label: 'Severe (50–59)',      color: 'red'   }
  return                 { label: 'Extreme (60–100)',     color: 'red'   }
}

export function calcCSI({ items, partB }) {
  if (!Array.isArray(items) || items.length !== CSI_ITEMS.length) return null

  const scores = items.map(Number)
  if (scores.some(value => !Number.isInteger(value) || value < 0 || value > 4)) return null

  const total = scores.reduce((sum, value) => sum + value, 0)
  const band = classify(total)
  const meetsCutoff = total >= CUTOFF

  return {
    primaryValue: total,
    primaryUnit: '/100',
    interpretation: `${band.label}${meetsCutoff ? ' — meets ≥40 cutoff for central sensitization' : ''}`,
    meta: {
      classColor: band.color,
      meetsCutoff,
      items: scores,
      partB: Array.isArray(partB) ? partB.map(Boolean) : [],
    },
  }
}
