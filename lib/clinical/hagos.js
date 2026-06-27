// Copenhagen Hip and Groin Outcome Score (HAGOS) — clinical engine
// 37 items, past-week recall, 6 independently scored subscales:
// Symptoms (7), Pain (10), ADL (5), Sport/Rec (8), Participation in
// physical activities (2), QOL (5). Thorborg et al. 2011, Br J Sports Med.
// Same scoring engine as KOOS/HOOS (koosFamily.js): each item 0 (best) – 4
// (worst); subscale = 100 − (mean of answered items × 100 / 4) → 0–100,
// higher = better (100 = no problems). Subscales are NEVER aggregated to a
// total (Roos instrument-family rule). Up to 2 unanswered items per subscale
// tolerated; the 2-item PA subscale therefore needs ≥1 answered item.
//
// No anchored MCID exists; change is interpreted against the published
// per-subscale MDC (Groen 2017, HAGOS-NL) — see mcid.js / thresholdType 'mdc'.
// Free instrument (koos.nu / Roos family terms — credit the source).
// Item wording transcribed from the published HAGOS — verify verbatim against
// the official koos.nu / Thorborg 2011 PDF before public release (carried in
// the outcome-measures handoff, as for KOOS/HOOS).
// Input: { items: { symptoms: number[7], pain: number[10], adl: number[5],
//          sport: number[8], pa: number[2], qol: number[5] } }

import { KF_OPTIONS, calcKoosFamily } from './koosFamily.js'

export const HAGOS_SECTIONS = [
  {
    key: 'symptoms',
    label: 'Symptoms',
    shortLabel: 'Symptoms',
    intro: 'Think of your hip and/or groin symptoms during the last week.',
    items: [
      { label: 'Do you feel discomfort in your hip and/or groin?', options: KF_OPTIONS.freq },
      { label: 'Do you hear clicking or any other type of noise from your hip and/or groin?', options: KF_OPTIONS.freqAllTime },
      { label: 'Do you have difficulties spreading your legs wide apart?', options: KF_OPTIONS.severity },
      { label: 'Do you have difficulties to stride out when you walk?', options: KF_OPTIONS.severity },
      { label: 'Do you experience sudden twinges/stabbing sensations in your hip and/or groin?', options: KF_OPTIONS.freqAllTime },
      { label: 'How severe is your hip and/or groin stiffness after first wakening in the morning?', options: KF_OPTIONS.severity },
      { label: 'How severe is your hip and/or groin stiffness after sitting, lying or resting later in the day?', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'pain',
    label: 'Pain',
    shortLabel: 'Pain',
    intro: 'What amount of hip and/or groin pain have you experienced during the last week?',
    items: [
      { label: 'How often is your hip and/or groin painful?', options: KF_OPTIONS.painFreq },
      { label: 'How often do you have pain in other areas that you think may be related to your hip and/or groin problem?', options: KF_OPTIONS.painFreq },
      { label: 'Straightening your hip fully', options: KF_OPTIONS.severity },
      { label: 'Bending your hip fully', options: KF_OPTIONS.severity },
      { label: 'Walking up or down stairs', options: KF_OPTIONS.severity },
      { label: 'At night while in bed (pain that disturbs your sleep)', options: KF_OPTIONS.severity },
      { label: 'Sitting or lying', options: KF_OPTIONS.severity },
      { label: 'Standing upright', options: KF_OPTIONS.severity },
      { label: 'Walking on a hard surface (asphalt, concrete, etc.)', options: KF_OPTIONS.severity },
      { label: 'Walking on an uneven surface', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'adl',
    label: 'Function — daily living',
    shortLabel: 'ADL',
    intro: 'What difficulty have you experienced in the last week due to your hip and/or groin?',
    items: [
      { label: 'Walking up stairs', options: KF_OPTIONS.severity },
      { label: 'Bending down, e.g. to pick something up from the floor', options: KF_OPTIONS.severity },
      { label: 'Getting in or out of a car', options: KF_OPTIONS.severity },
      { label: 'Lying in bed (turning over or maintaining the same hip position for a long time)', options: KF_OPTIONS.severity },
      { label: 'Heavy domestic duties (moving heavy boxes, scrubbing floors, etc.)', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'sport',
    label: 'Function — sport & recreation',
    shortLabel: 'Sport/Rec',
    intro: 'What difficulty have you experienced in the last week with higher level activities?',
    items: [
      { label: 'Squatting', options: KF_OPTIONS.severity },
      { label: 'Running', options: KF_OPTIONS.severity },
      { label: 'Twisting/pivoting on your injured hip', options: KF_OPTIONS.severity },
      { label: 'Walking on an uneven surface', options: KF_OPTIONS.severity },
      { label: 'Running as fast as you can', options: KF_OPTIONS.severity },
      { label: 'Bringing the leg forcefully forward and/or out to the side, such as in kicking, skating, etc.', options: KF_OPTIONS.severity },
      { label: 'Sudden explosive movements that involve quick footwork, such as accelerations, decelerations, change of directions, etc.', options: KF_OPTIONS.severity },
      { label: 'Situations where the leg is stretched into an outer position (such as when the leg is placed as far away from the body as possible)', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'pa',
    label: 'Participation in physical activities',
    shortLabel: 'Phys. activity',
    intro: 'Think about your ability to take part in your preferred physical activities.',
    items: [
      { label: 'Are you able to participate in your preferred physical activities for as long as you would like?', options: KF_OPTIONS.freqRev },
      { label: 'Are you able to participate in your preferred physical activities at your normal performance level?', options: KF_OPTIONS.freqRev },
    ],
  },
  {
    key: 'qol',
    label: 'Quality of life',
    shortLabel: 'QOL',
    intro: 'Questions about your hip and/or groin-related quality of life.',
    items: [
      { label: 'How often are you aware of your hip and/or groin problem?', options: KF_OPTIONS.aware },
      { label: 'Have you modified your life style to avoid potentially damaging activities to your hip and/or groin?', options: KF_OPTIONS.modified },
      { label: 'In general, how much difficulty do you have with your hip and/or groin?', options: KF_OPTIONS.severity },
      { label: 'Does your hip and/or groin problem affect your mood in a negative way?', options: KF_OPTIONS.freqAllTime },
      { label: 'Do you feel restricted due to your hip and/or groin problem?', options: KF_OPTIONS.freqAllTime },
    ],
  },
]

export function calcHAGOS({ items }) {
  return calcKoosFamily(HAGOS_SECTIONS, items)
}
