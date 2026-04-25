// Controlled condition list — maps to MCID_DATA and DIAG_RECS keys
export const CONDITION_OPTIONS = [
  'Stroke', 'TBI', 'ABI', 'SCI', 'MS', 'PD',
  'Ataxia', 'SCA', 'Cerebellar', 'GBS', 'Neuropathy',
  'Trauma', 'Amputation', 'Cardiac', 'Pulmonary',
  'Replacement', 'Multi-trauma Orthopaedic',
  'Normally Developing Child', 'Reconditioning', 'Other',
]

// 10MWT normative comfortable gait speed by age/sex — Bohannon & Andrews 2011
export const NORM_M = [
  [20, 29, 1.49], [30, 39, 1.43], [40, 49, 1.38],
  [50, 59, 1.32], [60, 69, 1.26], [70, 79, 1.14], [80, 120, 1.06],
]
export const NORM_F = [
  [20, 29, 1.34], [30, 39, 1.29], [40, 49, 1.24],
  [50, 59, 1.18], [60, 69, 1.12], [70, 79, 1.03], [80, 120, 0.94],
]

// Condition → recommended measure IDs (verbatim from index.html DIAG_RECS)
export const DIAG_RECS = {
  'Stroke':                    ['10MWT', 'TUG', 'FAC', '6MWT', 'BBS', 'PASS', 'TIS', 'MAS', 'COVS', 'FSS', 'ABC', 'HADS'],
  'TBI':                       ['10MWT', 'TUG', 'FAC', '6MWT', 'HiMAT', 'FGA', 'RPQ', 'FSS', 'HADS'],
  'ABI':                       ['10MWT', 'TUG', 'FAC', '6MWT', 'BBS', 'FGA', 'FSS', 'BIVI', 'HADS'],
  'SCI':                       ['10MWT', 'TUG', 'FAC', '6MWT', 'SCIM', 'FSS'],
  'MS':                        ['10MWT', 'TUG', '6MWT', 'FGA', 'FSS', 'PDQ8', 'HADS'],
  'PD':                        ['10MWT', 'TUG', '6MWT', 'BBS', 'FGA', 'PDQ8', 'ABC', 'HADS'],
  'Ataxia':                    ['10MWT', 'TUG', 'SARA', 'FSS', 'HADS'],
  'SCA':                       ['10MWT', 'TUG', 'SARA', 'FSS'],
  'Cerebellar':                ['10MWT', 'TUG', 'SARA', 'BBS'],
  'GBS':                       ['10MWT', 'TUG', 'FAC', '6MWT', 'COVS', 'FSS', 'HADS'],
  'Neuropathy':                ['10MWT', 'TUG', 'FAC', '6MWT', 'FSS'],
  'Trauma':                    ['10MWT', 'TUG', 'Step', 'HiMAT', 'FGA'],
  'Amputation':                ['AMP', '10MWT', 'TUG', '6MWT'],
  'Cardiac':                   ['6MWT', 'FSS', 'HADS'],
  'Pulmonary':                 ['6MWT', 'FSS'],
  'Replacement':               ['10MWT', 'TUG', '6MWT', 'Step', 'BOOMER'],
  'Multi-trauma Orthopaedic':  ['HiMAT', '10MWT', 'TUG', 'Step'],
  'Reconditioning':            ['6MWT', '10MWT', 'TUG', 'COVS', 'BOOMER', 'FSS', 'Barthel'],
}
