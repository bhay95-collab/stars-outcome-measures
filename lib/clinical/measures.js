// Central registry of all outcome measures — single source of truth for metadata
// Each measure: id, name, category, primaryUnit, higherIsBetter, mcidKey, chart config
// chart.thresholds colour: green (#2d6a4f) = good zone, amber (#a05c00) = caution, red (#b5451b) = concern

export const MEASURES = {

  // ─── Performance measures ─────────────────────────────────────────────────

  '10MWT': {
    id: '10MWT',
    name: '10 Metre Walk Test',
    category: 'performance',
    primaryUnit: 'm/s',
    higherIsBetter: true,
    mcidKey: '10mwt-comfort',
    chart: {
      yMin: 0,
      yMax: 1.6,
      thresholds: [
        { value: 0.4,  label: 'Household',         color: '#b5451b' },
        { value: 0.8,  label: 'Limited community',  color: '#a05c00' },
        { value: 1.2,  label: 'Full community',     color: '#2d6a4f' },
      ],
    },
  },

  'TUG': {
    id: 'TUG',
    name: 'Timed Up and Go',
    category: 'performance',
    primaryUnit: 'sec',
    higherIsBetter: false,
    mcidKey: 'tug',
    chart: {
      yMin: 0,
      yMax: 60,
      thresholds: [
        { value: 10,   label: 'Normal (<10 s)',      color: '#2d6a4f' },
        { value: 13.5, label: 'Fall risk (≥13.5 s)', color: '#b5451b' },
        { value: 30,   label: 'Requires assist.',    color: '#8b0000' },
      ],
    },
  },

  'FAC': {
    id: 'FAC',
    name: 'Functional Ambulation Classification',
    category: 'performance',
    primaryUnit: '/5',
    higherIsBetter: true,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 5,
      thresholds: [
        { value: 3, label: 'Independent (level)',   color: '#a05c00' },
        { value: 5, label: 'Community independent', color: '#2d6a4f' },
      ],
    },
  },

  '6MWT': {
    id: '6MWT',
    name: '6 Minute Walk Test',
    category: 'performance',
    primaryUnit: 'm',
    higherIsBetter: true,
    mcidKey: '6mwt',
    chart: {
      yMin: 0,
      yMax: 700,
      thresholds: [
        { value: 200, label: 'Severely impaired',   color: '#b5451b' },
        { value: 400, label: 'Moderately impaired', color: '#a05c00' },
        { value: 550, label: 'Good function',       color: '#2d6a4f' },
      ],
    },
  },

  'BBS': {
    id: 'BBS',
    name: 'Berg Balance Scale',
    category: 'performance',
    primaryUnit: '/56',
    higherIsBetter: true,
    mcidKey: 'bbs',
    chart: {
      yMin: 0,
      yMax: 56,
      thresholds: [
        { value: 36, label: 'High fall risk (<36)', color: '#b5451b' },
        { value: 45, label: 'Mild impairment',      color: '#a05c00' },
        { value: 56, label: 'Normal',               color: '#2d6a4f' },
      ],
    },
  },

  'PASS': {
    id: 'PASS',
    name: 'Postural Assessment Scale for Stroke',
    category: 'performance',
    primaryUnit: '/36',
    higherIsBetter: true,
    mcidKey: 'pass',
    chart: {
      yMin: 0,
      yMax: 36,
      thresholds: [
        { value: 24, label: 'Moderate impairment', color: '#b5451b' },
        { value: 30, label: 'Mild impairment',     color: '#a05c00' },
        { value: 36, label: 'Full score',          color: '#2d6a4f' },
      ],
    },
  },

  'TIS': {
    id: 'TIS',
    name: 'Trunk Impairment Scale',
    category: 'performance',
    primaryUnit: '/23',
    higherIsBetter: true,
    mcidKey: 'tis',
    chart: {
      yMin: 0,
      yMax: 23,
      thresholds: [
        { value: 14, label: 'Moderate impairment', color: '#b5451b' },
        { value: 19, label: 'Mild impairment',     color: '#a05c00' },
        { value: 23, label: 'Full score',          color: '#2d6a4f' },
      ],
    },
  },

  'MAS': {
    id: 'MAS',
    name: 'Motor Assessment Scale',
    category: 'performance',
    primaryUnit: '/48',
    higherIsBetter: true,
    mcidKey: 'mas',
    chart: {
      yMin: 0,
      yMax: 48,
      thresholds: [
        { value: 16, label: 'Severe',   color: '#b5451b' },
        { value: 32, label: 'Moderate', color: '#a05c00' },
        { value: 48, label: 'Full',     color: '#2d6a4f' },
      ],
    },
  },

  'COVS': {
    id: 'COVS',
    name: 'Clinical Outcome Variation Scale',
    category: 'performance',
    primaryUnit: '/91',
    higherIsBetter: true,
    mcidKey: 'covs',
    chart: {
      yMin: 0,
      yMax: 91,
      thresholds: [
        { value: 50, label: 'Mean admission stroke ≈50', color: '#b5451b' },
        { value: 67, label: 'Mean discharge stroke ≈67', color: '#2d6a4f' },
      ],
    },
  },

  'FGA': {
    id: 'FGA',
    name: 'Functional Gait Assessment',
    category: 'performance',
    primaryUnit: '/30',
    higherIsBetter: true,
    mcidKey: 'fga',
    chart: {
      yMin: 0,
      yMax: 30,
      thresholds: [
        { value: 15, label: 'High fall risk (<15)', color: '#b5451b' },
        { value: 22, label: 'Moderate risk',        color: '#a05c00' },
        { value: 30, label: 'Normal',               color: '#2d6a4f' },
      ],
    },
  },

  'HiMAT': {
    id: 'HiMAT',
    name: 'High-Level Mobility Assessment Tool',
    category: 'performance',
    primaryUnit: '/54',
    higherIsBetter: true,
    mcidKey: 'himat',
    chart: {
      yMin: 0,
      yMax: 54,
      thresholds: [
        { value: 18, label: 'Low-level',  color: '#b5451b' },
        { value: 36, label: 'Moderate',   color: '#a05c00' },
        { value: 54, label: 'High-level', color: '#2d6a4f' },
      ],
    },
  },

  'SARA': {
    id: 'SARA',
    name: 'Scale for the Assessment and Rating of Ataxia',
    category: 'performance',
    primaryUnit: '/40',
    higherIsBetter: false,
    mcidKey: 'sara',
    chart: {
      yMin: 0,
      yMax: 40,
      thresholds: [
        { value: 10, label: 'Mild (≤10)',     color: '#2d6a4f' },
        { value: 20, label: 'Moderate (≤20)', color: '#a05c00' },
        { value: 40, label: 'Severe (>20)',   color: '#b5451b' },
      ],
    },
  },

  'Step': {
    id: 'Step',
    name: 'Step Test',
    category: 'performance',
    primaryUnit: 'steps',
    higherIsBetter: true,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 30,
      thresholds: [
        { value: 10, label: 'Community threshold (≥10)', color: '#2d6a4f' },
      ],
    },
  },

  'AMP': {
    id: 'AMP',
    name: 'Amputee Mobility Predictor',
    category: 'performance',
    primaryUnit: '/47',
    higherIsBetter: true,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 47,
      thresholds: [
        { value: 28, label: 'K2 — limited community', color: '#b5451b' },
        { value: 36, label: 'K3 — community',         color: '#a05c00' },
        { value: 42, label: 'K4 — high activity',     color: '#2d6a4f' },
      ],
    },
  },

  'BOOMER': {
    id: 'BOOMER',
    name: 'Balance Outcome Measure for Elder Rehabilitation',
    category: 'performance',
    primaryUnit: '/16',
    higherIsBetter: true,
    mcidKey: 'boomer',
    chart: {
      yMin: 0,
      yMax: 16,
      thresholds: [
        { value: 6,  label: 'Significant impairment (<6)', color: '#b5451b' },
        { value: 12, label: 'Moderate deficit (6–11)',      color: '#a05c00' },
        { value: 16, label: 'Good balance (≥12)',           color: '#2d6a4f' },
      ],
    },
  },

  // ─── Independence / ADL measures ──────────────────────────────────────────

  'Barthel': {
    id: 'Barthel',
    name: 'Barthel Index',
    category: 'independence',
    primaryUnit: '/100',
    higherIsBetter: true,
    mcidKey: 'barthel',
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        { value: 35, label: 'Severe dependence',   color: '#b5451b' },
        { value: 60, label: 'Moderate dependence', color: '#a05c00' },
        { value: 85, label: 'Mild dependence',     color: '#2d6a4f' },
      ],
    },
  },

  'SCIM': {
    id: 'SCIM',
    name: 'Spinal Cord Independence Measure III',
    category: 'independence',
    primaryUnit: '/100',
    higherIsBetter: true,
    mcidKey: 'scim',
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        { value: 25, label: 'High assistance',     color: '#b5451b' },
        { value: 50, label: 'Moderate assistance', color: '#a05c00' },
        { value: 75, label: 'Minimal assistance',  color: '#2d6a4f' },
      ],
    },
  },

  // ─── Questionnaire measures ────────────────────────────────────────────────

  'FSS': {
    id: 'FSS',
    name: 'Fatigue Severity Scale',
    category: 'questionnaire',
    primaryUnit: '/63',
    higherIsBetter: false,
    mcidKey: 'fss',
    chart: {
      yMin: 9,
      yMax: 63,
      thresholds: [
        { value: 36, label: 'Fatigue threshold (≥36)', color: '#b5451b' },
        { value: 45, label: 'Severe fatigue (>45)',    color: '#8b0000' },
      ],
    },
  },

  'RPQ': {
    id: 'RPQ',
    name: 'Rivermead Post Concussion Questionnaire',
    category: 'questionnaire',
    primaryUnit: '/64',
    higherIsBetter: false,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 64,
      thresholds: [
        { value: 12, label: 'Mild',     color: '#2d6a4f' },
        { value: 26, label: 'Moderate', color: '#a05c00' },
        { value: 52, label: 'Severe',   color: '#b5451b' },
      ],
    },
  },

  'PDQ8': {
    id: 'PDQ8',
    name: "Parkinson's Disease Questionnaire — 8",
    category: 'questionnaire',
    primaryUnit: 'SI',
    higherIsBetter: false,
    mcidKey: 'pdq8',
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        { value: 20, label: 'Mild impact (≤20)',          color: '#2d6a4f' },
        { value: 40, label: 'Moderate impact (21–40)',    color: '#a05c00' },
        { value: 60, label: 'Significant impact (41–60)', color: '#b5451b' },
      ],
    },
  },

  'ABC': {
    id: 'ABC',
    name: 'Activities-Specific Balance Confidence Scale',
    category: 'questionnaire',
    primaryUnit: '%',
    higherIsBetter: true,
    mcidKey: 'abc',
    chart: {
      yMin: 0,
      yMax: 100,
      thresholds: [
        { value: 67,  label: 'Low function (<67%)',     color: '#b5451b' },
        { value: 80,  label: 'Moderate (67–80%)',       color: '#a05c00' },
        { value: 100, label: 'High confidence (>80%)',  color: '#2d6a4f' },
      ],
    },
  },

  'BIVI': {
    id: 'BIVI',
    name: 'Brain Injury Vision Inventory',
    category: 'questionnaire',
    primaryUnit: '/60',
    higherIsBetter: false,
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 60,
      thresholds: [
        { value: 10, label: 'Low impact (≤10)',      color: '#2d6a4f' },
        { value: 25, label: 'Moderate impact (≤25)', color: '#a05c00' },
        { value: 60, label: 'High impact (>25)',     color: '#b5451b' },
      ],
    },
  },

  'HADS': {
    id: 'HADS',
    name: 'Hospital Anxiety and Depression Scale',
    category: 'questionnaire',
    primaryUnit: '/21',
    higherIsBetter: false,
    // Two subscales tracked separately — MCID applied per-subscale in clinical engine
    mcidKey: null,
    chart: {
      yMin: 0,
      yMax: 21,
      thresholds: [
        { value: 7,  label: 'Normal (≤7)',         color: '#2d6a4f' },
        { value: 10, label: 'Borderline (8–10)',   color: '#a05c00' },
        { value: 21, label: 'Probable case (≥11)', color: '#b5451b' },
      ],
    },
  },

  // ─── Deferred ─────────────────────────────────────────────────────────────

  'ISNCSCI': {
    id: 'ISNCSCI',
    name: 'International Standards for Neurological Classification of SCI',
    category: 'performance',
    primaryUnit: null,
    higherIsBetter: null,
    mcidKey: null,
    chart: null,
  },
}

export const MEASURE_IDS = Object.keys(MEASURES)
