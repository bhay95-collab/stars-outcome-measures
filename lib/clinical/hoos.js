// Hip Disability and Osteoarthritis Outcome Score (HOOS) — clinical engine
// 40 items, past-week recall, 5 independently scored subscales:
// Symptoms (5, incl. stiffness), Pain (10), ADL (17), Sport/Rec (4), QOL (4).
// Same scoring engine as KOOS (koosFamily.js). Higher = better (100 = no problems).
// MCID 8–10 pts per subscale generic (by analogy with KOOS, Roos group);
// post-THA MCII: Pain 24, PS 23, QOL 17 (Paulsen 2014) — context in MCID_DATA.
// Free instrument (koos.nu terms).
// Item wording transcribed from HOOS LK 2.0 — verify against the official
// koos.nu PDF before public release (carried in outcome-measures handoff).
// Input: { items: { symptoms: number[5], pain: number[10], adl: number[17], sport: number[4], qol: number[4] } }

import { KF_OPTIONS, calcKoosFamily } from './koosFamily.js'

export const HOOS_SECTIONS = [
  {
    key: 'symptoms',
    label: 'Symptoms & stiffness',
    shortLabel: 'Symptoms',
    intro: 'Think of your hip symptoms during the last week.',
    items: [
      { label: 'Do you feel grinding, hear clicking or any other type of noise from your hip?', options: KF_OPTIONS.freq },
      { label: 'Difficulties spreading legs wide apart', options: KF_OPTIONS.severity },
      { label: 'Difficulties to stride out when walking', options: KF_OPTIONS.severity },
      { label: 'How severe is your hip joint stiffness after first wakening in the morning?', options: KF_OPTIONS.severity },
      { label: 'How severe is your hip stiffness after sitting, lying or resting later in the day?', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'pain',
    label: 'Pain',
    shortLabel: 'Pain',
    intro: 'What amount of hip pain have you experienced during the last week?',
    items: [
      { label: 'How often is your hip painful?', options: KF_OPTIONS.painFreq },
      { label: 'Straightening your hip fully', options: KF_OPTIONS.severity },
      { label: 'Bending your hip fully', options: KF_OPTIONS.severity },
      { label: 'Walking on flat surface', options: KF_OPTIONS.severity },
      { label: 'Going up or down stairs', options: KF_OPTIONS.severity },
      { label: 'At night while in bed', options: KF_OPTIONS.severity },
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
    intro: 'What difficulty have you experienced in the last week due to your hip?',
    items: [
      { label: 'Descending stairs', options: KF_OPTIONS.severity },
      { label: 'Ascending stairs', options: KF_OPTIONS.severity },
      { label: 'Rising from sitting', options: KF_OPTIONS.severity },
      { label: 'Standing', options: KF_OPTIONS.severity },
      { label: 'Bending to the floor / picking up an object', options: KF_OPTIONS.severity },
      { label: 'Walking on flat surface', options: KF_OPTIONS.severity },
      { label: 'Getting in or out of a car', options: KF_OPTIONS.severity },
      { label: 'Going shopping', options: KF_OPTIONS.severity },
      { label: 'Putting on socks or stockings', options: KF_OPTIONS.severity },
      { label: 'Rising from bed', options: KF_OPTIONS.severity },
      { label: 'Taking off socks or stockings', options: KF_OPTIONS.severity },
      { label: 'Lying in bed (turning over, maintaining hip position)', options: KF_OPTIONS.severity },
      { label: 'Getting in or out of the bath', options: KF_OPTIONS.severity },
      { label: 'Sitting', options: KF_OPTIONS.severity },
      { label: 'Getting on or off the toilet', options: KF_OPTIONS.severity },
      { label: 'Heavy domestic duties (moving heavy boxes, scrubbing floors, etc.)', options: KF_OPTIONS.severity },
      { label: 'Light domestic duties (cooking, dusting, etc.)', options: KF_OPTIONS.severity },
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
      { label: 'Twisting/pivoting on your loaded leg', options: KF_OPTIONS.severity },
      { label: 'Walking on uneven surface', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'qol',
    label: 'Quality of life',
    shortLabel: 'QOL',
    intro: 'Questions about your hip-related quality of life.',
    items: [
      { label: 'How often are you aware of your hip problem?', options: KF_OPTIONS.aware },
      { label: 'Have you modified your life style to avoid activities potentially damaging to your hip?', options: KF_OPTIONS.modified },
      { label: 'How much are you troubled with lack of confidence in your hip?', options: KF_OPTIONS.troubled },
      { label: 'In general, how much difficulty do you have with your hip?', options: KF_OPTIONS.severity },
    ],
  },
]

export function calcHOOS({ items }) {
  return calcKoosFamily(HOOS_SECTIONS, items)
}
