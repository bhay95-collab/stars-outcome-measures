export interface MeasureInstructionItem {
  label: string;
  detail?: string;
}

export interface MeasureInstructionSection {
  title: string;
  body?: string;
  bullets?: string[];
  items?: MeasureInstructionItem[];
}

export interface MeasureInstructionContent {
  id: string;
  title: string;
  subtitle: string;
  sections: MeasureInstructionSection[];
}

const sharedSafety = [
  'Use the same setup, aids, footwear, orthoses, and cueing approach when comparing repeated assessments.',
  'Guard closely and stop the assessment if safety, pain, fatigue, medical status, or patient consent changes.',
  'Record any deviations from the standard protocol in the clinical note.',
];

export const MEASURE_INSTRUCTIONS: Record<string, MeasureInstructionContent> = {
  '10MWT': {
    id: '10MWT',
    title: '10 Metre Walk Test',
    subtitle: 'Walking speed over a measured 10 metre section.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Mark a straight 10 metre timed section; use acceleration/deceleration space if your local protocol requires it.',
          'Use the same assistive device, orthosis, footwear, and level of assistance each time.',
          'Clear the walkway and position yourself to guard without pacing the patient.',
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Record comfortable pace and/or fast pace as separate trials.',
          'Start timing when the leading foot crosses the start of the timed section and stop when it crosses the end.',
          'Optional: count steps during the timed section to calculate step length and cadence.',
        ],
      },
      { title: 'Scoring', bullets: ['Speed = 10 metres divided by time in seconds.', 'Community ambulation bands are shown after entry.'] },
    ],
  },
  TUG: {
    id: 'TUG',
    title: 'Timed Up and Go',
    subtitle: 'Functional mobility, transfers, turning, and short-distance walking.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Use a standard chair and mark a 3 metre walkway from the front of the chair.',
          'The patient starts seated with their back against the chair.',
          'Use the usual walking aid if required and document it.',
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'On "go", the patient stands, walks to the 3 metre mark, turns, walks back, and sits down.',
          'Time from the instruction to start until the patient is seated again.',
          'Use TUG Fast or TUG Dual only when those variants are clinically intended and repeatable.',
        ],
      },
      { title: 'Scoring', bullets: ['Record time in seconds. Lower time indicates better performance.'] },
    ],
  },
  FAC: {
    id: 'FAC',
    title: 'Functional Ambulation Classification',
    subtitle: 'Six-level classification of walking independence.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Observe the patient walking in the most representative safe context.',
          'Classify the level of human assistance or supervision required, not the walking speed.',
          'Use the highest level the patient can perform safely and consistently.',
        ],
      },
      {
        title: 'Levels',
        items: [
          { label: '0', detail: 'Non-functional ambulator.' },
          { label: '1', detail: 'Dependent ambulator requiring level 2 assist.' },
          { label: '2', detail: 'Dependent ambulator requiring level 1 assist.' },
          { label: '3', detail: 'Ambulates with supervision.' },
          { label: '4', detail: 'Independent on level surfaces only.' },
          { label: '5', detail: 'Independent ambulator on level and non-level surfaces.' },
        ],
      },
    ],
  },
  '6MWT': {
    id: '6MWT',
    title: '6 Minute Walk Test',
    subtitle: 'Functional walking endurance over six minutes.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Use a measured indoor walkway and keep the course length consistent between tests.',
          'Record lap length, walking aid, orthoses, oxygen use, and any rests.',
          'Monitor clinical status according to local policy.',
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'The goal is to walk as far as possible in 6 minutes without running.',
          'The patient may slow, stop, or rest; keep the timer running unless your local protocol states otherwise.',
          'Use consistent standardised encouragement.',
        ],
      },
      { title: 'Scoring', bullets: ['Record total distance in metres. Higher distance indicates better endurance.'] },
    ],
  },
  BBS: {
    id: 'BBS',
    title: 'Berg Balance Scale',
    subtitle: '14 functional balance tasks scored 0 to 4.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Set up the standard chair, step/stool, ruler/reach task, and floor object before starting.',
          'Demonstrate or explain each task consistently.',
          'Use close guarding. Do not provide physical assistance unless required for safety; score accordingly.',
        ],
      },
      {
        title: 'Tasks',
        items: [
          { label: '1. Sitting to standing' },
          { label: '2. Standing unsupported' },
          { label: '3. Sitting unsupported' },
          { label: '4. Standing to sitting' },
          { label: '5. Transfers' },
          { label: '6. Standing with eyes closed' },
          { label: '7. Standing with feet together' },
          { label: '8. Reaching forward' },
          { label: '9. Retrieving object from floor' },
          { label: '10. Turning to look behind' },
          { label: '11. Turning 360 degrees' },
          { label: '12. Alternate foot on stool' },
          { label: '13. Tandem standing' },
          { label: '14. Standing on one foot' },
        ],
      },
      { title: 'Scoring', bullets: ['Each item is scored 0 to 4. Total range is 0 to 56.'] },
    ],
  },
  PASS: {
    id: 'PASS',
    title: 'Postural Assessment Scale for Stroke',
    subtitle: 'Maintaining and changing posture after stroke.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Assess postural control across maintaining-posture and changing-posture tasks.',
          'Use consistent bed/plinth, chair, and standing setup.',
          'Score observed performance, assistance, and independence for each item.',
        ],
      },
      {
        title: 'Domains',
        items: [
          { label: 'Maintaining posture', detail: 'Sitting and standing tasks, including support, unsupported standing, and single-leg stance.' },
          { label: 'Changing posture', detail: 'Rolling, supine to sit, sit to supine, sit to stand, stand to sit, and reaching/picking up tasks.' },
        ],
      },
      { title: 'Scoring', bullets: ['12 items scored 0 to 3. Total range is 0 to 36.'] },
    ],
  },
  TIS: {
    id: 'TIS',
    title: 'Trunk Impairment Scale',
    subtitle: 'Static sitting, dynamic sitting, and trunk coordination.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Seat the patient at the edge of a bed or plinth with thighs supported, feet flat, and arms resting as per local protocol.',
          'Guard from a position that allows safety without adding trunk support.',
        ],
      },
      {
        title: 'Subscales',
        items: [
          { label: 'Static sitting balance', detail: 'Maximum 7 points.' },
          { label: 'Dynamic sitting balance', detail: 'Maximum 10 points.' },
          { label: 'Coordination', detail: 'Maximum 6 points.' },
        ],
      },
      { title: 'Scoring', bullets: ['Enter each subscale total. Overall score range is 0 to 23.'] },
    ],
  },
  MAS: {
    id: 'MAS',
    title: 'Motor Assessment Scale',
    subtitle: 'Stroke motor function across eight activity domains.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'This is the Motor Assessment Scale, not the Modified Ashworth Scale.',
          'Score the best safe performance for each activity domain using the same assistance and cueing rules each time.',
        ],
      },
      {
        title: 'Domains',
        items: [
          { label: 'Supine to side lying', detail: 'Turning to the affected side.' },
          { label: 'Supine to sitting over side of bed', detail: 'Through side lying.' },
          { label: 'Balanced sitting', detail: 'No support, feet flat, arms across chest.' },
          { label: 'Sitting to standing', detail: 'From standard chair, arms across chest.' },
          { label: 'Walking', detail: '10 metres.' },
          { label: 'Upper arm function' },
          { label: 'Hand movements' },
          { label: 'Advanced hand activities' },
        ],
      },
      { title: 'Scoring', bullets: ['8 items scored 0 to 6. Total range is 0 to 48.'] },
    ],
  },
  COVS: {
    id: 'COVS',
    title: 'Clinical Outcome Variables Scale',
    subtitle: 'Functional mobility, ambulation, wheelchair mobility, and arm function.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Score the patient performing each task with their usual aids and assistance.',
          'Use the same environment and equipment for repeat testing where possible.',
        ],
      },
      {
        title: 'Items',
        items: [
          { label: 'Bed mobility', detail: 'Rolling to affected and unaffected sides, supine to sitting.' },
          { label: 'Sitting and transfers', detail: 'Sitting balance, horizontal transfer, vertical transfer.' },
          { label: 'Ambulation', detail: 'Walking ability, aids, endurance, and velocity.' },
          { label: 'Wheelchair mobility' },
          { label: 'Arm function', detail: 'Affected and unaffected arm function.' },
        ],
      },
      { title: 'Scoring', bullets: ['13 items scored 1 to 7. Total range is 13 to 91.'] },
    ],
  },
  FGA: {
    id: 'FGA',
    title: 'Functional Gait Assessment',
    subtitle: 'Dynamic gait tasks scored 0 to 3.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Use a clear walkway and required obstacles/steps according to your local protocol.',
          'Guard closely and score gait performance without adding assistance unless required for safety.',
        ],
      },
      {
        title: 'Tasks',
        items: [
          { label: 'Gait level surface' },
          { label: 'Change in gait speed' },
          { label: 'Horizontal head turns' },
          { label: 'Vertical head turns' },
          { label: 'Gait and pivot turn' },
          { label: 'Step over obstacle' },
          { label: 'Narrow base of support' },
          { label: 'Ambulating backwards' },
          { label: 'Gait with eyes closed' },
          { label: 'Inclined surfaces' },
        ],
      },
      { title: 'Scoring', bullets: ['10 items scored 0 to 3. Total range is 0 to 30.'] },
    ],
  },
  HiMAT: {
    id: 'HiMAT',
    title: 'High-Level Mobility Assessment Tool',
    subtitle: 'High-level walking, running, hopping, bounding, and stair mobility.',
    sections: [
      {
        title: 'Timed mobility items',
        body: 'Use the middle 10 metres of a 20 metre path where possible. Record time in seconds or mark unable/fail when the task criteria are not met.',
        items: [
          { label: 'Walk', detail: 'Middle 10 m of 20 m. Unable = 0.' },
          { label: 'Walk Backward', detail: 'As Walk, performed backwards.' },
          { label: 'Walk on Toes', detail: 'Heel contact in the middle 10 m = fail.' },
          { label: 'Walk Over Obstacle', detail: 'Step over the obstacle; stepping around = fail.' },
          { label: 'Run', detail: 'Middle 10 m. No flight phase = fail.' },
          { label: 'Skip', detail: 'Middle 10 m. No flight phase = fail.' },
          { label: 'Hop Forward', detail: '10 m on the more-affected leg. Unable = 0.' },
        ],
      },
      {
        title: 'Bound items',
        bullets: [
          'Complete three trials and enter each distance in centimetres.',
          'Affected bound: jump from the less-affected leg and land on the affected leg.',
          'Less-affected bound: jump from the affected leg and land on the less-affected leg.',
        ],
      },
      {
        title: 'Stair items',
        bullets: [
          'For Up Stairs and Down Stairs, choose Independent when completed reciprocally without rail.',
          'Choose Dependent when rail use or non-reciprocal stepping is required, then record the time.',
          'Independent stair performance scores differently from dependent timed stair performance.',
        ],
      },
      { title: 'Scoring', bullets: ['The mobile form progresses through 11 input steps and calculates a total score out of 54.'] },
    ],
  },
  SARA: {
    id: 'SARA',
    title: 'Scale for the Assessment and Rating of Ataxia',
    subtitle: 'Eight domains of ataxia severity.',
    sections: [
      {
        title: 'Domains',
        items: [
          { label: 'Gait' },
          { label: 'Stance' },
          { label: 'Sitting' },
          { label: 'Speech disturbance' },
          { label: 'Finger chase' },
          { label: 'Nose-finger test' },
          { label: 'Fast alternating hand movements' },
          { label: 'Heel-shin slide' },
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Score each domain using the available scale values shown in the form.',
          'Score limb items consistently for the tested side/limb according to your local protocol.',
        ],
      },
      { title: 'Scoring', bullets: ['Total range is 0 to 40. Lower score indicates less ataxia.'] },
    ],
  },
  Step: {
    id: 'Step',
    title: 'Step Test',
    subtitle: 'Dynamic standing balance and stepping speed.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Use a 7.5 cm step or block.',
          'The patient stands unsupported and places one foot on and off the step as many times as possible in 15 seconds.',
          'Test affected and non-affected legs separately where clinically relevant.',
        ],
      },
      { title: 'Scoring', bullets: ['Record the number of completed steps in 15 seconds. The app can calculate asymmetry when both sides are entered.'] },
    ],
  },
  AMP: {
    id: 'AMP',
    title: 'Amputee Mobility Predictor',
    subtitle: 'Mobility potential with or without prosthesis.',
    sections: [
      {
        title: 'Versions',
        items: [
          { label: 'AMPPRO', detail: 'Use when the person is assessed with their prosthesis. Maximum score 47.' },
          { label: 'AMPnoPRO', detail: 'Use when assessed without a prosthesis. Maximum score 43.' },
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Complete the AMP using your full local scoring form, then enter the total score into RehabMetrics IQ.',
          'Keep prosthesis, aids, environment, and assistance level consistent for repeated testing.',
        ],
      },
      { title: 'Scoring', bullets: ['The app maps the total score to K-level mobility categories.'] },
    ],
  },
  BOOMER: {
    id: 'BOOMER',
    title: 'Balance Outcome Measure for Elder Rehabilitation',
    subtitle: 'Composite balance measure using four tasks.',
    sections: [
      {
        title: 'Tasks',
        items: [
          { label: 'Timed Up and Go', detail: 'Comfortable TUG time.' },
          { label: 'Functional Reach Test', detail: 'Maximum forward reach from standing in centimetres.' },
          { label: 'Step Test', detail: '7.5 cm step, 15 seconds.' },
          { label: 'Static standing', detail: 'Feet together, eyes closed, timed without support.' },
        ],
      },
      { title: 'Scoring', bullets: ['Each component contributes to a total score out of 16.'] },
    ],
  },
  FSS: {
    id: 'FSS',
    title: 'Fatigue Severity Scale',
    subtitle: 'Nine-item fatigue impact questionnaire.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate each statement from 1 to 7.',
          'Ensure the patient understands that higher scores indicate stronger agreement/more impact.',
          'All nine items are required for the total score.',
        ],
      },
      { title: 'Scoring', bullets: ['Total range is 9 to 63. A total of 36 or above is commonly used as a clinically significant fatigue threshold.'] },
    ],
  },
  HADS: {
    id: 'HADS',
    title: 'Hospital Anxiety and Depression Scale',
    subtitle: 'Anxiety and depression screening subscales.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to respond based on how they have felt recently, using the response options shown in the form.',
          'Complete all 14 items without clinician interpretation of responses.',
          'Seven items contribute to Anxiety and seven to Depression.',
        ],
      },
      { title: 'Scoring', bullets: ['Each subscale ranges from 0 to 21. Higher score indicates greater symptom burden.'] },
    ],
  },
  RPQ: {
    id: 'RPQ',
    title: 'Rivermead Post-Concussion Questionnaire',
    subtitle: 'Post-concussion symptom burden.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to compare current symptoms with their pre-injury state.',
          'Use the 0 to 4 severity options displayed in the form.',
          'Complete RPQ-3 and RPQ-13 symptom groups.',
        ],
      },
      { title: 'Scoring', bullets: ['Total range is 0 to 64. The app also tracks RPQ-3, RPQ-13, and symptom count.'] },
    ],
  },
  PDQ8: {
    id: 'PDQ8',
    title: "Parkinson's Disease Questionnaire - 8",
    subtitle: 'Brief Parkinson disease quality-of-life impact measure.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate how often each issue affected them using the response options shown.',
          'Complete all 8 items.',
          'Use the same recall period each time according to your local protocol.',
        ],
      },
      { title: 'Scoring', bullets: ['The app calculates the Summary Index as a percentage: item sum divided by 32, multiplied by 100.'] },
    ],
  },
  ABC: {
    id: 'ABC',
    title: 'Activities-Specific Balance Confidence Scale',
    subtitle: 'Balance confidence across daily activities.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate their confidence for each activity from 0% to 100%.',
          '0% means no confidence; 100% means complete confidence.',
          'If the patient does not currently do an activity, ask them to estimate confidence if they had to do it.',
        ],
      },
      { title: 'Scoring', bullets: ['The app reports the mean percentage across 16 activities. Higher score indicates greater balance confidence.'] },
    ],
  },
  BIVI: {
    id: 'BIVI',
    title: 'Brain Injury Vision Inventory',
    subtitle: 'Vision-related impact after brain injury.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate each vision-impact statement using the displayed response options.',
          'Complete all 15 items.',
          'Use responses to inform referral, compensatory strategies, and broader rehabilitation planning.',
        ],
      },
      { title: 'Scoring', bullets: ['Total range is 0 to 45. Higher score indicates greater vision-related impact.'] },
    ],
  },
  Barthel: {
    id: 'Barthel',
    title: 'Barthel Index',
    subtitle: 'Independence in basic activities of daily living.',
    sections: [
      {
        title: 'Items',
        items: [
          { label: 'Feeding' },
          { label: 'Bathing' },
          { label: 'Grooming' },
          { label: 'Dressing' },
          { label: 'Bowels' },
          { label: 'Bladder' },
          { label: 'Toilet use' },
          { label: 'Transfers' },
          { label: 'Mobility on level surface' },
          { label: 'Stairs' },
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Score actual performance over the relevant period, not potential ability under ideal conditions.',
          'Choose the option that best reflects assistance required for each activity.',
        ],
      },
      { title: 'Scoring', bullets: ['Total range is 0 to 100. Higher score indicates greater independence.'] },
    ],
  },
  SCIM: {
    id: 'SCIM',
    title: 'Spinal Cord Independence Measure III',
    subtitle: 'SCI-specific independence across self-care, respiration/sphincters, and mobility.',
    sections: [
      {
        title: 'Subscales',
        items: [
          { label: 'Self-care', detail: 'Feeding, bathing, dressing, and grooming. Maximum 20.' },
          { label: 'Respiration and sphincters', detail: 'Respiration, bladder, bowel, and toilet use. Maximum 36.' },
          { label: 'Mobility', detail: 'Bed mobility, transfers, indoor/outdoor mobility, stairs, and wheelchair-car transfer. Maximum 40.' },
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Score independence and assistance requirements for each item using the options shown.',
          'Use a consistent interpretation of assistive equipment, supervision, and physical assistance between reassessments.',
        ],
      },
      { title: 'Scoring', bullets: ['Total range is 0 to 100. Higher score indicates greater independence.'] },
    ],
  },
};

export function getMeasureInstructions(measureId?: string | string[] | null): MeasureInstructionContent | null {
  const id = Array.isArray(measureId) ? measureId[0] : measureId;
  if (!id) return null;
  return MEASURE_INSTRUCTIONS[id] ?? null;
}

export { sharedSafety };
