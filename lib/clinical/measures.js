// Central registry of all outcome measures — single source of truth for metadata
// Each measure: id, name, category, domains, primaryUnit, higherIsBetter, mcidKey, chart config
// domains: which clinical workspace surfaces the measure — ['rehab'], ['msk'], or both.
//   A missing domains field is treated as both, so consumers never hide a measure by accident.
// primaryLabel: chart label for the primaryValue series (defaults to measure name).
// subscales: extra tracked series stored flat in results.meta[key] —
//   [{ key, label, unit, mcidKey? }] — consumed generically by charts/summary/PDF.
// chart.thresholds colour: green (#2a6b4f) = good zone, amber (#8a6512) = caution, red (#a13b30) = concern

export const MEASURES = {

  // ─── Performance measures ─────────────────────────────────────────────────

  '10MWT': {
    id: '10MWT',
    name: '10 Metre Walk Test',
    category: 'performance',
    domains: ['rehab', 'msk'],
    primaryUnit: 'm/s',
    higherIsBetter: true,
    mcidKey: '10mwt-comfort',
    primaryLabel: 'Comfortable speed',
    subscales: [
      { key: 'fastSpeed', label: 'Fast speed', unit: 'm/s', mcidKey: '10mwt-fast' },
    ],
    chart: {
      yMin: 0,
      yMax: 1.6,
      thresholds: [
        { value: 0.4,  label: 'Household',         color: '#a13b30' },
        { value: 0.8,  label: 'Limited community',  color: '#8a6512' },
        { value: 1.2,  label: 'Full community',     color: '#2a6b4f' },
      ],
    },
  },

  'TUG': {
    id: 'TUG',
    name: 'Timed Up and Go',
    category: 'performance',
    domains: ['rehab', 'msk'],
    primaryUnit: 'sec',
    higherIsBetter: false,
    mcidKey: 'tug',
    primaryLabel: 'Comfortable time',
    subscales: [
      { key: 'fastTime', label: 'Fast time', unit: 'sec' },
      { key: 'dualTime', label: 'Dual-task time', unit: 'sec' },
    ],
    chart: {
      yMin: 0,
      yMax: 60,
      thresholds: [
        { value: 10,   label: 'Normal (<10 s)',      color: '#2a6b4f' },
        { value: 13.5, label: 'Fall risk (≥13.5 s)', color: '#a13b30' },
        { value: 30,   label: 'Requires assist.',    color: '#7e2c24' },
      ],
    },
  },

  'FAC': {
    id: 'FAC',
    name: 'Functional Ambulation Classification',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/5',
    higherIsBetter: true,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 5,
      thresholds: [
        { value: 3, label: 'Independent (level)',   color: '#8a6512' },
        { value: 5, label: 'Community independent', color: '#2a6b4f' },
      ],
    },
  },

  '6MWT': {
    id: '6MWT',
    name: '6 Minute Walk Test',
    category: 'performance',
    domains: ['rehab', 'msk'],
    primaryUnit: 'm',
    higherIsBetter: true,
    mcidKey: '6mwt',
    chart: {
      yMin: 0,
      yMax: 700,
      thresholds: [
        { value: 200, label: 'Severely impaired',   color: '#a13b30' },
        { value: 400, label: 'Moderately impaired', color: '#8a6512' },
        { value: 550, label: 'Good function',       color: '#2a6b4f' },
      ],
    },
  },

  'BBS': {
    id: 'BBS',
    name: 'Berg Balance Scale',
    category: 'performance',
    domains: ['rehab', 'msk'],
    primaryUnit: '/56',
    higherIsBetter: true,
    mcidKey: 'bbs',
    chart: {
      yMin: 0,
      yMax: 56,
      thresholds: [
        { value: 36, label: 'High fall risk (<36)', color: '#a13b30' },
        { value: 45, label: 'Mild impairment',      color: '#8a6512' },
        { value: 56, label: 'Normal',               color: '#2a6b4f' },
      ],
    },
  },

  'PASS': {
    id: 'PASS',
    name: 'Postural Assessment Scale for Stroke',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/36',
    higherIsBetter: true,
    mcidKey: 'pass',
    chart: {
      yMin: 0,
      yMax: 36,
      thresholds: [
        { value: 24, label: 'Moderate impairment', color: '#a13b30' },
        { value: 30, label: 'Mild impairment',     color: '#8a6512' },
        { value: 36, label: 'Full score',          color: '#2a6b4f' },
      ],
    },
  },

  'TIS': {
    id: 'TIS',
    name: 'Trunk Impairment Scale',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/23',
    higherIsBetter: true,
    mcidKey: 'tis',
    chart: {
      yMin: 0,
      yMax: 23,
      thresholds: [
        { value: 14, label: 'Moderate impairment', color: '#a13b30' },
        { value: 19, label: 'Mild impairment',     color: '#8a6512' },
        { value: 23, label: 'Full score',          color: '#2a6b4f' },
      ],
    },
  },

  'MAS': {
    id: 'MAS',
    name: 'Motor Assessment Scale',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/48',
    higherIsBetter: true,
    mcidKey: 'mas',
    chart: {
      yMin: 0,
      yMax: 48,
      thresholds: [
        { value: 16, label: 'Severe',   color: '#a13b30' },
        { value: 32, label: 'Moderate', color: '#8a6512' },
        { value: 48, label: 'Full',     color: '#2a6b4f' },
      ],
    },
  },

  'COVS': {
    id: 'COVS',
    name: 'Clinical Outcome Variation Scale',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/91',
    higherIsBetter: true,
    mcidKey: 'covs',
    chart: {
      yMin: 0,
      yMax: 91,
      thresholds: [
        { value: 50, label: 'Mean admission stroke ≈50', color: '#a13b30' },
        { value: 67, label: 'Mean discharge stroke ≈67', color: '#2a6b4f' },
      ],
    },
  },

  'FGA': {
    id: 'FGA',
    name: 'Functional Gait Assessment',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/30',
    higherIsBetter: true,
    mcidKey: 'fga',
    chart: {
      yMin: 0,
      yMax: 30,
      thresholds: [
        { value: 15, label: 'High fall risk (<15)', color: '#a13b30' },
        { value: 22, label: 'Moderate risk',        color: '#8a6512' },
        { value: 30, label: 'Normal',               color: '#2a6b4f' },
      ],
    },
  },

  'HiMAT': {
    id: 'HiMAT',
    name: 'High-Level Mobility Assessment Tool',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/54',
    higherIsBetter: true,
    mcidKey: 'himat',
    chart: {
      yMin: 0,
      yMax: 54,
      thresholds: [
        { value: 18, label: 'Low-level',  color: '#a13b30' },
        { value: 36, label: 'Moderate',   color: '#8a6512' },
        { value: 54, label: 'High-level', color: '#2a6b4f' },
      ],
    },
  },

  'SARA': {
    id: 'SARA',
    name: 'Scale for the Assessment and Rating of Ataxia',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/40',
    higherIsBetter: false,
    mcidKey: 'sara',
    chart: {
      yMin: 0,
      yMax: 40,
      thresholds: [
        { value: 10, label: 'Mild (≤10)',     color: '#2a6b4f' },
        { value: 20, label: 'Moderate (≤20)', color: '#8a6512' },
        { value: 40, label: 'Severe (>20)',   color: '#a13b30' },
      ],
    },
  },

  'Step': {
    id: 'Step',
    name: 'Step Test',
    category: 'performance',
    domains: ['rehab', 'msk'],
    primaryUnit: 'steps',
    higherIsBetter: true,
    mcidKey: null,
    primaryLabel: 'Affected limb',
    subscales: [
      { key: 'nonAffectedSteps', label: 'Non-affected limb', unit: 'steps' },
    ],
    chart: {
      yMin: 0,
      yMax: 30,
      thresholds: [
        { value: 10, label: 'Community threshold (≥10)', color: '#2a6b4f' },
      ],
    },
  },

  'AMP': {
    id: 'AMP',
    name: 'Amputee Mobility Predictor',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: '/47',
    higherIsBetter: true,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 47,
      thresholds: [
        { value: 28, label: 'K2 — limited community', color: '#a13b30' },
        { value: 36, label: 'K3 — community',         color: '#8a6512' },
        { value: 42, label: 'K4 — high activity',     color: '#2a6b4f' },
      ],
    },
  },

  'BOOMER': {
    id: 'BOOMER',
    name: 'Balance Outcome Measure for Elder Rehabilitation',
    category: 'performance',
    domains: ['rehab', 'msk'],
    primaryUnit: '/16',
    higherIsBetter: true,
    mcidKey: 'boomer',
    chart: {
      yMin: 0,
      yMax: 16,
      thresholds: [
        { value: 6,  label: 'Significant impairment (<6)', color: '#a13b30' },
        { value: 12, label: 'Moderate deficit (6–11)',      color: '#8a6512' },
        { value: 16, label: 'Good balance (≥12)',           color: '#2a6b4f' },
      ],
    },
  },

  // ─── Independence / ADL measures ──────────────────────────────────────────

  'Barthel': {
    id: 'Barthel',
    name: 'Barthel Index',
    category: 'independence',
    domains: ['rehab', 'msk'],
    primaryUnit: '/100',
    higherIsBetter: true,
    mcidKey: 'barthel',
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        { value: 35, label: 'Severe dependence',   color: '#a13b30' },
        { value: 60, label: 'Moderate dependence', color: '#8a6512' },
        { value: 85, label: 'Mild dependence',     color: '#2a6b4f' },
      ],
    },
  },

  'SCIM': {
    id: 'SCIM',
    name: 'Spinal Cord Independence Measure III',
    category: 'independence',
    domains: ['rehab'],
    primaryUnit: '/100',
    higherIsBetter: true,
    mcidKey: 'scim',
    primaryLabel: 'Total score',
    subscales: [
      { key: 'sc', label: 'Self-care', unit: '/20' },
      { key: 'rs', label: 'Respiration/sphincters', unit: '/40' },
      { key: 'mob', label: 'Mobility', unit: '/40' },
    ],
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        { value: 25, label: 'High assistance',     color: '#a13b30' },
        { value: 50, label: 'Moderate assistance', color: '#8a6512' },
        { value: 75, label: 'Minimal assistance',  color: '#2a6b4f' },
      ],
    },
  },

  // ─── Questionnaire measures ────────────────────────────────────────────────

  'FSS': {
    id: 'FSS',
    name: 'Fatigue Severity Scale',
    category: 'questionnaire',
    domains: ['rehab', 'msk'],
    primaryUnit: '/63',
    higherIsBetter: false,
    mcidKey: 'fss',
    chart: {
      yMin: 9,
      yMax: 63,
      thresholds: [
        { value: 36, label: 'Fatigue threshold (≥36)', color: '#a13b30' },
        { value: 45, label: 'Severe fatigue (>45)',    color: '#7e2c24' },
      ],
    },
  },

  'RPQ': {
    id: 'RPQ',
    name: 'Rivermead Post Concussion Questionnaire',
    category: 'questionnaire',
    domains: ['rehab'],
    primaryUnit: '/64',
    higherIsBetter: false,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 64,
      thresholds: [
        { value: 12, label: 'Mild',     color: '#2a6b4f' },
        { value: 26, label: 'Moderate', color: '#8a6512' },
        { value: 52, label: 'Severe',   color: '#a13b30' },
      ],
    },
  },

  'PDQ8': {
    id: 'PDQ8',
    name: "Parkinson's Disease Questionnaire — 8",
    category: 'questionnaire',
    domains: ['rehab'],
    primaryUnit: 'SI',
    higherIsBetter: false,
    mcidKey: 'pdq8',
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        { value: 20, label: 'Mild impact (≤20)',          color: '#2a6b4f' },
        { value: 40, label: 'Moderate impact (21–40)',    color: '#8a6512' },
        { value: 60, label: 'Significant impact (41–60)', color: '#a13b30' },
      ],
    },
  },

  'ABC': {
    id: 'ABC',
    name: 'Activities-Specific Balance Confidence Scale',
    category: 'questionnaire',
    domains: ['rehab', 'msk'],
    primaryUnit: '%',
    higherIsBetter: true,
    mcidKey: 'abc',
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        { value: 67,  label: 'Low function (<67%)',     color: '#a13b30' },
        { value: 80,  label: 'Moderate (67–80%)',       color: '#8a6512' },
        { value: 100, label: 'High confidence (>80%)',  color: '#2a6b4f' },
      ],
    },
  },

  'BIVI': {
    id: 'BIVI',
    name: 'Brain Injury Vision Inventory',
    category: 'questionnaire',
    domains: ['rehab'],
    primaryUnit: '/45',
    higherIsBetter: false,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 45,
      thresholds: [
        { value: 10, label: 'Low impact (≤10)',      color: '#2a6b4f' },
        { value: 25, label: 'Moderate impact (≤25)', color: '#8a6512' },
        { value: 45, label: 'High impact (>25)',     color: '#a13b30' },
      ],
    },
  },

  'HADS': {
    id: 'HADS',
    name: 'Hospital Anxiety and Depression Scale',
    category: 'questionnaire',
    domains: ['rehab', 'msk'],
    primaryUnit: '/21',
    higherIsBetter: false,
    // Two subscales tracked separately — anxiety is the primary series,
    // depression charts via the subscale declaration below.
    mcidKey: null,
    primaryLabel: 'Anxiety',
    subscales: [
      { key: 'depressionScore', label: 'Depression', unit: '/21', mcidKey: 'hads-d' },
    ],
    chart: {
      yMin: 0,
      yMax: 21,
      thresholds: [
        { value: 7,  label: 'Normal (≤7)',         color: '#2a6b4f' },
        { value: 10, label: 'Borderline (8–10)',   color: '#8a6512' },
        { value: 21, label: 'Probable case (≥11)', color: '#a13b30' },
      ],
    },
  },

  // ─── MSK measures (Wave 1 — see docs/msk-expansion-plan.md) ───────────────

  '30STS': {
    id: '30STS',
    name: '30-Second Sit to Stand',
    category: 'performance',
    domains: ['rehab', 'msk'],
    primaryUnit: 'stands',
    higherIsBetter: true,
    mcidKey: '30sts',
    chart: {
      yMin: 0,
      yMax: 25,
      thresholds: [
        { value: 12, label: 'Knee OA reduced function (<12)', color: '#8a6512' },
        { value: 19, label: 'Healthy older-adult range',      color: '#2a6b4f' },
      ],
    },
  },

  'FTSTS': {
    id: 'FTSTS',
    name: 'Five Times Sit to Stand',
    category: 'performance',
    domains: ['rehab', 'msk'],
    primaryUnit: 'sec',
    higherIsBetter: false,
    mcidKey: 'ftsts',
    chart: {
      yMin: 0,
      yMax: 30,
      thresholds: [
        { value: 12, label: 'Typical (≤12 s)',        color: '#2a6b4f' },
        { value: 15, label: 'Assess falls (>12 s)',   color: '#8a6512' },
        { value: 25, label: 'Fall risk (>15 s)',      color: '#a13b30' },
      ],
    },
  },

  'CMS': {
    id: 'CMS',
    name: 'Constant–Murley Score',
    category: 'performance',
    domains: ['msk'],
    primaryUnit: '/100',
    higherIsBetter: true,
    mcidKey: 'cms',
    chart: {
      yMin: 0,
      yMax: 100,
      // No universal severity bands — age/sex-adjusted norms apply.
      thresholds: [],
    },
  },

  'CAIT': {
    id: 'CAIT',
    name: 'Cumberland Ankle Instability Tool',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/30',
    higherIsBetter: true,
    mcidKey: 'cait',
    chart: {
      yMin: 0,
      yMax: 30,
      thresholds: [
        // CAI cut-offs: ≤24 instability, 25–27 possible (Hiller 2006 / Wright 2014)
        { value: 24, label: 'Instability (≤24)',     color: '#a13b30' },
        { value: 27, label: 'Possible (Hiller ≤27)', color: '#8a6512' },
        { value: 30, label: 'Stable (≥28)',          color: '#2a6b4f' },
      ],
    },
  },

  'ATRS': {
    id: 'ATRS',
    name: 'Achilles Tendon Total Rupture Score',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/100',
    higherIsBetter: true,
    mcidKey: 'atrs',
    chart: {
      yMin: 0,
      yMax: 100,
      // No published severity bands — recovery tracked via score and change.
      thresholds: [],
    },
  },

  'OMAS': {
    id: 'OMAS',
    name: 'Olerud–Molander Ankle Score',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/100',
    higherIsBetter: true,
    mcidKey: 'omas',
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        // Castilho 2021 bands: poor ≤30, fair 31–60, good 61–90, excellent 91–100
        { value: 30,  label: 'Poor (≤30)',         color: '#a13b30' },
        { value: 60,  label: 'Fair (31–60)',       color: '#8a6512' },
        { value: 90,  label: 'Good (61–90)',       color: '#3f8a5f' },
        { value: 100, label: 'Excellent (91–100)', color: '#2a6b4f' },
      ],
    },
  },

  // ─── ACL return-to-sport field tests (clinician-measured) ─────────────────

  'QuadLSI': {
    id: 'QuadLSI',
    name: 'Quadriceps Strength LSI',
    category: 'performance',
    domains: ['msk'],
    primaryUnit: '%',
    higherIsBetter: true,
    mcidKey: null,
    primaryLabel: 'Quad LSI',
    chart: {
      yMin: 0,
      yMax: 120,
      thresholds: [
        // RTS cut-off LSI ≥ 90% (Grindem 2016); 80% late-rehab milestone (van Melick 2016)
        { value: 80,  label: 'Deficit (<80%)',          color: '#a13b30' },
        { value: 90,  label: 'Mild deficit (80–89%)',   color: '#8a6512' },
        { value: 120, label: 'Symmetrical (≥90%)',      color: '#2a6b4f' },
      ],
    },
  },

  'HopBattery': {
    id: 'HopBattery',
    name: 'Single-Leg Hop Battery (LSI)',
    category: 'performance',
    domains: ['msk'],
    primaryUnit: '%',
    higherIsBetter: true,
    mcidKey: null,
    primaryLabel: 'Limiting hop LSI',
    subscales: [
      { key: 'single', label: 'Single hop', unit: '%' },
      { key: 'triple', label: 'Triple hop', unit: '%' },
      { key: 'crossover', label: 'Crossover hop', unit: '%' },
      { key: 'timed', label: '6-m timed hop', unit: '%' },
    ],
    chart: {
      yMin: 0,
      yMax: 120,
      thresholds: [
        // Each hop LSI ≥ 90% for RTS (Reid 2007; Grindem 2016)
        { value: 80,  label: 'Deficit (<80%)',          color: '#a13b30' },
        { value: 90,  label: 'Mild asymmetry (80–89%)', color: '#8a6512' },
        { value: 120, label: 'Symmetrical (≥90%)',      color: '#2a6b4f' },
      ],
    },
  },

  'LESS': {
    id: 'LESS',
    name: 'Landing Error Scoring System',
    category: 'performance',
    domains: ['msk'],
    primaryUnit: '/17',
    higherIsBetter: false,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 17,
      thresholds: [
        // RTS screen LESS < 5 = good landing mechanics (Padua 2009; Grindem 2016)
        { value: 4,  label: 'Good (<5 errors)',     color: '#2a6b4f' },
        { value: 6,  label: 'Moderate (5–6)',       color: '#8a6512' },
        { value: 17, label: 'Poor (>6 errors)',     color: '#a13b30' },
      ],
    },
  },

  'FABQ': {
    id: 'FABQ',
    name: 'Fear-Avoidance Beliefs Questionnaire',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/24',
    higherIsBetter: false,
    // Physical Activity is the primary subscale (universally applicable);
    // Work charts as a subscale. Higher = more fear-avoidance.
    mcidKey: 'fabq-pa',
    primaryLabel: 'Physical activity',
    subscales: [
      { key: 'work', label: 'Work', unit: '/42', mcidKey: 'fabq-w' },
    ],
    chart: {
      yMin: 0,
      yMax: 24,
      thresholds: [
        // FABQ-PA > 15 = significant fear of physical activity (yellow flag)
        { value: 15, label: 'High fear (>15)', color: '#a13b30' },
      ],
    },
  },

  'NPRS': {
    id: 'NPRS',
    name: 'Numeric Pain Rating Scale',
    category: 'questionnaire',
    domains: ['rehab', 'msk'],
    primaryUnit: '/10',
    higherIsBetter: false,
    mcidKey: 'nprs',
    chart: {
      yMin: 0,
      yMax: 10,
      thresholds: [
        { value: 3,  label: 'Mild (≤3)',      color: '#2a6b4f' },
        { value: 6,  label: 'Moderate (4–6)', color: '#8a6512' },
        { value: 10, label: 'Severe (7–10)',  color: '#a13b30' },
      ],
    },
  },

  'PSFS': {
    id: 'PSFS',
    name: 'Patient Specific Functional Scale',
    category: 'questionnaire',
    domains: ['rehab', 'msk'],
    primaryUnit: '/10',
    higherIsBetter: true,
    mcidKey: 'psfs',
    chart: {
      yMin: 0,
      yMax: 10,
      // Patient-specific by design — no published severity thresholds.
      thresholds: [],
    },
  },

  'LEFS': {
    id: 'LEFS',
    name: 'Lower Extremity Functional Scale',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/80',
    higherIsBetter: true,
    mcidKey: 'lefs',
    chart: {
      yMin: 0,
      yMax: 80,
      // No published severity bands — healthy adults score near ceiling.
      thresholds: [
        { value: 76, label: 'Healthy adult range (≥95%)', color: '#2a6b4f' },
      ],
    },
  },

  'BPFS': {
    id: 'BPFS',
    name: 'Back Pain Functional Scale',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/60',
    higherIsBetter: true,
    mcidKey: 'bpfs',
    chart: {
      yMin: 0,
      yMax: 60,
      // No published severity bands for the BPFS.
      thresholds: [],
    },
  },

  'KOOS': {
    id: 'KOOS',
    name: 'Knee Injury and Osteoarthritis Outcome Score',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/100',
    higherIsBetter: true,
    // Pain is the designated primary subscale; the other four chart as subscales.
    // Subscales are never totalled (KOOS User's Guide).
    mcidKey: 'koos-pain',
    primaryLabel: 'Pain',
    subscales: [
      { key: 'symptoms', label: 'Symptoms', unit: '/100', mcidKey: 'koos-symptoms' },
      { key: 'adl', label: 'Function (ADL)', unit: '/100', mcidKey: 'koos-adl' },
      { key: 'sport', label: 'Sport/Recreation', unit: '/100', mcidKey: 'koos-sport' },
      { key: 'qol', label: 'Knee-related QOL', unit: '/100', mcidKey: 'koos-qol' },
    ],
    chart: {
      yMin: 0,
      yMax: 100,
      // No universal severity bands — PASS anchors are condition-specific
      // (see reference card notes); change vs MCID carries the meaning.
      thresholds: [],
    },
  },

  'FAAM': {
    id: 'FAAM',
    name: 'Foot and Ankle Ability Measure',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '%',
    higherIsBetter: true,
    mcidKey: 'faam-adl',
    primaryLabel: 'ADL',
    subscales: [
      { key: 'sport', label: 'Sports', unit: '%', mcidKey: 'faam-sport' },
    ],
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        // CAI functional deficit cutoffs (IAC 2014; Carcia 2008)
        { value: 90,  label: 'ADL deficit cutoff (<90%)', color: '#8a6512' },
        { value: 100, label: 'No deficit',                color: '#2a6b4f' },
      ],
    },
  },

  'HOOS': {
    id: 'HOOS',
    name: 'Hip Disability and Osteoarthritis Outcome Score',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/100',
    higherIsBetter: true,
    mcidKey: 'hoos-pain',
    primaryLabel: 'Pain',
    subscales: [
      { key: 'symptoms', label: 'Symptoms', unit: '/100', mcidKey: 'hoos-symptoms' },
      { key: 'adl', label: 'Function (ADL)', unit: '/100', mcidKey: 'hoos-adl' },
      { key: 'sport', label: 'Sport/Recreation', unit: '/100', mcidKey: 'hoos-sport' },
      { key: 'qol', label: 'Hip-related QOL', unit: '/100', mcidKey: 'hoos-qol' },
    ],
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [],
    },
  },

  'HAGOS': {
    id: 'HAGOS',
    name: 'Copenhagen Hip and Groin Outcome Score',
    category: 'questionnaire',
    domains: ['msk'],
    primaryUnit: '/100',
    higherIsBetter: true,
    // Pain is the designated primary subscale (consistent with KOOS/HOOS — the
    // Roos family has no single consensus primary subscale; Pain keeps the
    // overview uniform). The other five chart as subscales and are never totalled.
    mcidKey: 'hagos-pain',
    primaryLabel: 'Pain',
    subscales: [
      { key: 'symptoms', label: 'Symptoms', unit: '/100', mcidKey: 'hagos-symptoms' },
      { key: 'adl', label: 'Function (ADL)', unit: '/100', mcidKey: 'hagos-adl' },
      { key: 'sport', label: 'Sport/Recreation', unit: '/100', mcidKey: 'hagos-sport' },
      { key: 'pa', label: 'Physical activity', unit: '/100', mcidKey: 'hagos-pa' },
      { key: 'qol', label: 'Hip/groin QOL', unit: '/100', mcidKey: 'hagos-qol' },
    ],
    chart: {
      yMin: 0,
      yMax: 100,
      // No universal severity bands — change vs per-subscale MDC carries the
      // meaning (HAGOS has no anchored MCID; see mcid.js).
      thresholds: [],
    },
  },

  // ─── Deferred ─────────────────────────────────────────────────────────────

  'ISNCSCI': {
    id: 'ISNCSCI',
    name: 'International Standards for Neurological Classification of SCI',
    category: 'performance',
    domains: ['rehab'],
    primaryUnit: null,
    higherIsBetter: null,
    mcidKey: null,
    chart: null,
  },
}

export const MEASURE_IDS = Object.keys(MEASURES)

// Clinical domains — used by the measure picker, summary, and reference card
// to filter content to the clinician's workspace focus. Never used to hide
// recorded patient data.
export const MEASURE_DOMAINS = ['rehab', 'msk']

export const DOMAIN_LABELS = {
  rehab: 'Neuro / Rehab',
  msk: 'MSK',
}

export function measureHasDomain(measure, domain) {
  if (!domain || domain === 'all') return true
  const domains = measure?.domains ?? MEASURE_DOMAINS
  return domains.includes(domain)
}
