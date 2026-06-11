// Knee Injury and Osteoarthritis Outcome Score (KOOS) — clinical engine
// 42 items, past-week recall, 5 independently scored subscales:
// Symptoms (7, incl. stiffness), Pain (9), ADL (17), Sport/Rec (5), QOL (4).
// Scoring/missing rules in koosFamily.js. Higher = better (100 = no problems).
// MCID 8–10 pts per subscale (Roos & Lohmander 2003); post-ACLR MIC:
// Sport/Rec 12.1, QOL 18.3 (Ingelsrud 2018). Free instrument (koos.nu).
// Item wording transcribed from KOOS LK 1.0 — verify against the official
// koos.nu PDF before public release (carried in outcome-measures handoff).
// Input: { items: { symptoms: number[7], pain: number[9], adl: number[17], sport: number[5], qol: number[4] } }
//   item values 0 (best) – 4 (worst); null/'' = unanswered (≤2 per subscale)

import { KF_OPTIONS, calcKoosFamily } from './koosFamily.js'

export const KOOS_SECTIONS = [
  {
    key: 'symptoms',
    label: 'Symptoms & stiffness',
    shortLabel: 'Symptoms',
    intro: 'Think of your knee symptoms during the last week.',
    items: [
      { label: 'Do you have swelling in your knee?', options: KF_OPTIONS.freq },
      { label: 'Do you feel grinding, hear clicking or any other type of noise when your knee moves?', options: KF_OPTIONS.freq },
      { label: 'Does your knee catch or hang up when moving?', options: KF_OPTIONS.freq },
      { label: 'Can you straighten your knee fully?', options: KF_OPTIONS.freqRev },
      { label: 'Can you bend your knee fully?', options: KF_OPTIONS.freqRev },
      { label: 'How severe is your knee joint stiffness after first wakening in the morning?', options: KF_OPTIONS.severity },
      { label: 'How severe is your knee stiffness after sitting, lying or resting later in the day?', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'pain',
    label: 'Pain',
    shortLabel: 'Pain',
    intro: 'What amount of knee pain have you experienced during the last week?',
    items: [
      { label: 'How often do you experience knee pain?', options: KF_OPTIONS.painFreq },
      { label: 'Twisting/pivoting on your knee', options: KF_OPTIONS.severity },
      { label: 'Straightening knee fully', options: KF_OPTIONS.severity },
      { label: 'Bending knee fully', options: KF_OPTIONS.severity },
      { label: 'Walking on flat surface', options: KF_OPTIONS.severity },
      { label: 'Going up or down stairs', options: KF_OPTIONS.severity },
      { label: 'At night while in bed', options: KF_OPTIONS.severity },
      { label: 'Sitting or lying', options: KF_OPTIONS.severity },
      { label: 'Standing upright', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'adl',
    label: 'Function — daily living',
    shortLabel: 'ADL',
    intro: 'What difficulty have you experienced in the last week due to your knee?',
    items: [
      { label: 'Descending stairs', options: KF_OPTIONS.severity },
      { label: 'Ascending stairs', options: KF_OPTIONS.severity },
      { label: 'Rising from sitting', options: KF_OPTIONS.severity },
      { label: 'Standing', options: KF_OPTIONS.severity },
      { label: 'Bending to floor / picking up an object', options: KF_OPTIONS.severity },
      { label: 'Walking on flat surface', options: KF_OPTIONS.severity },
      { label: 'Getting in or out of a car', options: KF_OPTIONS.severity },
      { label: 'Going shopping', options: KF_OPTIONS.severity },
      { label: 'Putting on socks or stockings', options: KF_OPTIONS.severity },
      { label: 'Rising from bed', options: KF_OPTIONS.severity },
      { label: 'Taking off socks or stockings', options: KF_OPTIONS.severity },
      { label: 'Lying in bed (turning over, maintaining knee position)', options: KF_OPTIONS.severity },
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
      { label: 'Jumping', options: KF_OPTIONS.severity },
      { label: 'Twisting/pivoting on your injured knee', options: KF_OPTIONS.severity },
      { label: 'Kneeling', options: KF_OPTIONS.severity },
    ],
  },
  {
    key: 'qol',
    label: 'Quality of life',
    shortLabel: 'QOL',
    intro: 'Questions about your knee-related quality of life.',
    items: [
      { label: 'How often are you aware of your knee problem?', options: KF_OPTIONS.aware },
      { label: 'Have you modified your life style to avoid potentially damaging activities to your knee?', options: KF_OPTIONS.modified },
      { label: 'How much are you troubled with lack of confidence in your knee?', options: KF_OPTIONS.troubled },
      { label: 'In general, how much difficulty do you have with your knee?', options: KF_OPTIONS.severity },
    ],
  },
]

export function calcKOOS({ items }) {
  return calcKoosFamily(KOOS_SECTIONS, items)
}
