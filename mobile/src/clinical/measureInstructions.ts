export interface MeasureInstructionItem {
  label: string;
  detail?: string;
}

export interface MeasureInstructionLink {
  text: string;
  url?: string;
}

export interface MeasureInstructionSection {
  title: string;
  body?: string;
  bullets?: string[];
  items?: MeasureInstructionItem[];
  links?: MeasureInstructionLink[];
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
      {
        title: 'References',
        links: [
          {
            text: 'Perry J, et al. Classification of walking handicap in the stroke population. Stroke. 1995;26(6):982–9.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/7780938',
          },
          {
            text: 'Fritz S, Lusardi M. White paper: "walking speed: the sixth vital sign." J Geriatr Phys Ther. 2009;32(2):46–9.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/20104166',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Podsiadlo D, Richardson S. The timed "Up & Go": a test of basic functional mobility for frail elderly persons. J Am Geriatr Soc. 1991;39(2):142–8.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/1991946',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Holden MK, et al. Clinical gait assessment in the neurologically impaired: reliability and meaningfulness. Phys Ther. 1984;64(1):35–40.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/6691052',
          },
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
      {
        title: 'References',
        links: [
          {
            text: 'ATS Committee on Proficiency Standards for Clinical Pulmonary Function Laboratories. ATS statement: guidelines for the six-minute walk test. Am J Respir Crit Care Med. 2002;166(1):111–7.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/12091180',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Berg KO, et al. Clinical and laboratory measures of postural balance in an elderly population. Arch Phys Med Rehabil. 1992;73(11):1073–80.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/1444775',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Benaim C, et al. Validation of a standardized assessment of postural control in stroke patients: the Postural Assessment Scale for Stroke Patients (PASS). Stroke. 1999;30(9):1862–8.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/10471434',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Verheyden G, et al. The Trunk Impairment Scale: a new tool to measure motor impairment of the trunk after stroke. Clin Rehabil. 2004;18(3):326–34.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/15180128',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Carr JH, et al. Investigation of a new motor assessment scale for stroke patients. Phys Ther. 1985;65(2):175–80.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/3969505',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Seaby L, Torrance G. A physiotherapy outcome measure for stroke rehabilitation. Physiother Can. 1989;41(3):119–25.',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Wrisley DM, et al. Reliability, internal consistency, and validity of data obtained with the functional gait assessment. Phys Ther. 2004;84(10):906–18.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/15449976',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Williams G, et al. High-Level Mobility Assessment Tool (HiMAT): interrater reliability, retest reliability, and internal consistency. Phys Ther. 2006;86(3):395–400.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/16504976',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Schmitz-Hübsch T, et al. Scale for the assessment and rating of ataxia: development of a new clinical scale. Neurology. 2006;66(11):1717–20.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/16769946',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Hill KD, et al. A new test of dynamic standing balance for stroke patients: reliability, validity and comparison with healthy elderly. Physiother Can. 1996;48(4):257–62.',
            url: 'https://doi.org/10.3138/ptc.48.4.257',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Gailey RS, et al. The amputee mobility predictor: an instrument to assess determinants of the lower-limb amputee\'s ability to ambulate. Arch Phys Med Rehabil. 2002;83(5):613–27.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/12001005',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Podsiadlo D, Richardson S. The timed "Up & Go." J Am Geriatr Soc. 1991;39(2):142–8. [TUG component]',
            url: 'https://pubmed.ncbi.nlm.nih.gov/1991946',
          },
          {
            text: 'Duncan PW, et al. Functional reach: a new clinical measure of balance. J Gerontol. 1990;45(6):M192–7. [Functional Reach component]',
            url: 'https://pubmed.ncbi.nlm.nih.gov/2229941',
          },
          {
            text: 'Hill KD, et al. A new test of dynamic standing balance for stroke patients. Physiother Can. 1996;48(4):257–62. [Step Test component]',
            url: 'https://doi.org/10.3138/ptc.48.4.257',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Krupp LB, et al. The fatigue severity scale: application to patients with multiple sclerosis and systemic lupus erythematosus. Arch Neurol. 1989;46(10):1121–3.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/2803071',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Zigmond AS, Snaith RP. The hospital anxiety and depression scale. Acta Psychiatr Scand. 1983;67(6):361–70.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/6880820',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'King NS, et al. The Rivermead Post Concussion Symptoms Questionnaire: a measure of symptoms commonly experienced after head injury and its reliability. J Neurol. 1995;242(9):587–92.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/7562970',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: "Jenkinson C, et al. The Parkinson's Disease Questionnaire (PDQ-39): development and validation of a Parkinson's disease summary index score. Age Ageing. 1997;26(5):353–7.",
            url: 'https://pubmed.ncbi.nlm.nih.gov/9271288',
          },
          {
            text: 'Jenkinson C, Fitzpatrick R. Cross-cultural evaluation of the short form 8-item Parkinson\'s Disease Questionnaire (PDQ-8). Parkinsonism Relat Disord. 2007;13(1):22–8.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/16839792',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Powell LE, Myers AM. The Activities-specific Balance Confidence (ABC) Scale. J Gerontol A Biol Sci Med Sci. 1995;50A(1):M28–34.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/7814786',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Brain Injury Vision Inventory (BIVI): a 15-item patient-reported outcome measure of vision difficulties following acquired brain injury.',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Mahoney FI, Barthel DW. Functional evaluation: the Barthel Index. Md State Med J. 1965;14:61–5.',
          },
          {
            text: 'Collin C, et al. The Barthel ADL Index: a reliability study. Int Disabil Stud. 1988;10(2):61–3.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/3403500',
          },
        ],
      },
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
      {
        title: 'References',
        links: [
          {
            text: 'Catz A, et al. SCIM — spinal cord independence measure: a new disability scale for patients with spinal cord lesions. Spinal Cord. 1997;35(12):850–6.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/9429267',
          },
        ],
      },
    ],
  },
  NPRS: {
    id: 'NPRS',
    title: 'Numeric Pain Rating Scale',
    subtitle: 'Single-item 0 to 10 pain intensity rating.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Choose the pain context before scoring: current pain, average over 24 hours, worst over 24 hours, or best over 24 hours.',
          'Ask the patient to rate pain intensity from 0 (no pain) to 10 (worst pain imaginable).',
          'Use the same context at reassessment whenever possible so change scores are comparable.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Score range is 0 to 10. Lower score indicates less pain.',
          'Conventional bands: 0 no pain, 1-3 mild, 4-6 moderate, 7-10 severe.',
          'General clinically meaningful improvement is approximately 2 points or about 30 percent reduction; condition-specific MCID/MDC may differ.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Farrar JT, et al. Clinical importance of changes in chronic pain intensity measured on an 11-point numerical pain rating scale. Pain. 2001;94(2):149-158.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/11690728/',
          },
          {
            text: 'Childs JD, Piva SR, Fritz JM. Responsiveness of the numeric pain rating scale in patients with low back pain. Spine. 2005;30(11):1331-1334.',
            url: 'https://doi.org/10.1097/01.brs.0000164099.92112.29',
          },
        ],
      },
    ],
  },
  PSFS: {
    id: 'PSFS',
    title: 'Patient Specific Functional Scale',
    subtitle: 'Patient-nominated activities rated from unable to pre-injury level.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to identify important activities they are unable to do or are having difficulty with because of the current condition.',
          'Record a clear activity label for each nominated activity; three activities is typical, with up to five supported.',
          'At reassessment, re-rate the same activities wherever possible. Changing activities mid-episode makes scores less comparable.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Each activity is rated 0 to 10, where 0 is unable to perform and 10 is able to perform at pre-injury level.',
          'Score is the average of the nominated activity ratings.',
          'No severity bands are applied; clinical meaning comes from change against baseline and the patient-selected activity context.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Stratford P, Gill C, Westaway M, Binkley J. Assessing disability and change on individual patients: a report of a patient specific measure. Physiotherapy Canada. 1995;47(4):258-263.',
            url: 'https://doi.org/10.3138/ptc.47.4.258',
          },
          {
            text: 'Patient-Specific Functional Scale (PSFS). ePROVIDE / Mapi Research Trust instrument profile.',
            url: 'https://eprovide.mapi-trust.org/instruments/patient-specific-functional-scale',
          },
          {
            text: 'Cleland JA, et al. Reliability and construct validity of the NDI and PSFS in cervical radiculopathy. Spine. 2006;31(5):598-602.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/16508559/',
          },
        ],
      },
    ],
  },
  LEFS: {
    id: 'LEFS',
    title: 'Lower Extremity Functional Scale',
    subtitle: '20-item lower limb functional difficulty questionnaire.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate their current difficulty with each listed lower-limb activity.',
          'Use the same response anchors for every item: 0 extreme difficulty or unable, through 4 no difficulty.',
          'Complete all 20 items before saving; this mobile form does not apply a missing-item rule.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Total range is 0 to 80. Higher score indicates better lower-extremity function.',
          'MCID and MDC90 are commonly treated as 9 points in the original validation study.',
          'Interpret change alongside diagnosis, baseline score, and the patient goals being tracked.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Binkley JM, et al. The Lower Extremity Functional Scale (LEFS): scale development, measurement properties, and clinical application. Phys Ther. 1999;79(4):371-383.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/10201543/',
          },
          {
            text: 'Mehta SP, et al. Measurement properties of the Lower Extremity Functional Scale: a systematic review. J Orthop Sports Phys Ther. 2016;46(3):200-216.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/26813750/',
          },
        ],
      },
    ],
  },
  BPFS: {
    id: 'BPFS',
    title: 'Back Pain Functional Scale',
    subtitle: '12-item functional status scale for low back pain.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate difficulty with each activity because of their back.',
          'Use the same 0 to 5 scale for every item: 0 unable to perform, 5 no difficulty.',
          'Complete all 12 items before saving.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Total range is 0 to 60. Higher score indicates better back-related function.',
          'A change of approximately 6.5 points exceeds measurement error in the current engine; a formal MCID is not established.',
          'Use with pain intensity and patient-specific goals rather than as a stand-alone diagnosis tool.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Stratford PW, Binkley JM, Riddle DL. Development and initial validation of the Back Pain Functional Scale. Spine. 2000;25(16):2095-2102.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/10954642/',
          },
          {
            text: 'Stratford PW, Binkley JM. A comparison study of the Back Pain Functional Scale and Roland Morris Questionnaire. J Rheumatol. 2000;27(8):1928-1936.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/10955335/',
          },
        ],
      },
    ],
  },
  FAAM: {
    id: 'FAAM',
    title: 'Foot and Ankle Ability Measure',
    subtitle: 'ADL and optional Sport subscales scored as percentages.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Complete the 21-item ADL subscale for foot and ankle presentations.',
          'Complete the 8-item Sport subscale only when sporting activity is relevant to this patient.',
          'Use N/A only when an activity is limited by something other than the foot or ankle.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Each subscale is scored separately as a percentage; 100 percent indicates no reported difficulty.',
          'ADL requires at least 19 of 21 responses. Sport requires at least 7 of 8 responses if started.',
          'Functional deficit cutoffs used for chronic ankle instability: ADL below 90 percent and Sport below 80 percent.',
          'MCID: ADL 8 points and Sport 9 points. MDC95: ADL 5.7 points and Sport 12.3 points.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Martin RL, et al. Evidence of validity for the Foot and Ankle Ability Measure (FAAM). Foot Ankle Int. 2005;26(11):968-983.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/16309613/',
          },
          {
            text: 'Carcia CR, et al. Validity of the Foot and Ankle Ability Measure in athletes with chronic ankle instability. J Athl Train. 2008;43(2):179-183.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/18345343/',
          },
          {
            text: 'Gribble PA, et al. Selection criteria for patients with chronic ankle instability in controlled research: International Ankle Consortium position statement. J Athl Train. 2014;49(1):121-127.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3917288/',
          },
        ],
      },
    ],
  },
  CAIT: {
    id: 'CAIT',
    title: 'Cumberland Ankle Instability Tool',
    subtitle: '9-item patient-reported screen for perceived functional ankle instability.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Score one ankle per assessment, usually the affected or unstable ankle.',
          'Ask the patient to choose the response that best describes their pain, instability, giving-way control, and recovery after a typical rolling incident.',
          'If both ankles need assessment, record separate assessments so change remains interpretable.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Item-specific response weights are summed to a total out of 30.',
          'Higher score indicates better perceived ankle stability.',
          'All 9 items are required before saving.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'Original functional ankle instability cut-off is 27 or lower.',
          'A later recalibration recommends 25 or lower for chronic ankle instability discrimination.',
          'A change of about 3 points exceeds measurement error in the current engine.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Hiller CE, et al. The Cumberland Ankle Instability Tool: a report of validity and reliability testing. Arch Phys Med Rehabil. 2006;87(9):1235-1241.',
            url: 'https://www.sciencedirect.com/science/article/pii/S0003999306005193',
          },
          {
            text: 'Wright CJ, et al. Recalibration and validation of the CAIT cutoff score for individuals with chronic ankle instability. Arch Phys Med Rehabil. 2014;95(10):1853-1859.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/24814563/',
          },
        ],
      },
    ],
  },
  ATRS: {
    id: 'ATRS',
    title: 'Achilles Tendon Total Rupture Score',
    subtitle: '10-item patient-reported score for symptoms and activity after Achilles rupture.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate limitation due to the injured Achilles tendon for each item.',
          'Use the same injured side and episode context at reassessment.',
          'Each item is rated from 0 very limited to 10 no limitation.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          '10 item scores are summed to a total out of 100.',
          'Higher score indicates better Achilles function.',
          'All 10 items are required before saving.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'No formal severity bands are applied in the mobile form.',
          'Interpret the score in context of stage, side, and change over time.',
          'Published MDC estimates vary across translations, so the current engine treats a 10-point change as pragmatic measurement-error context.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Nilsson-Helander K, et al. The Achilles Tendon Total Rupture Score (ATRS): development and validation. Am J Sports Med. 2007;35(3):421-426.',
            url: 'https://journals.sagepub.com/doi/10.1177/0363546506294856',
          },
          {
            text: 'Carmont MR, et al. The ATRS: responsiveness, internal consistency and convergent validity. J Foot Ankle Res. 2012;5:24.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3305449/',
          },
        ],
      },
    ],
  },
  FABQ: {
    id: 'FABQ',
    title: 'Fear-Avoidance Beliefs Questionnaire',
    subtitle: '16-item screen of physical-activity and work-related fear-avoidance beliefs.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate agreement with each statement from 0 completely disagree to 6 completely agree.',
          'Administer all 16 items, including context items that do not contribute to subscale totals.',
          'Use primarily for low back pain or broader MSK presentations where fear-avoidance beliefs may affect recovery.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Physical Activity subscale uses items 2-5, range 0 to 24.',
          'Work subscale uses items 6, 7, 9, 10, 11, 12, and 15, range 0 to 42.',
          'Higher scores indicate more fear-avoidance beliefs.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'Physical Activity score greater than 15 indicates high physical-activity fear-avoidance in the current engine.',
          'Work score greater than 34 indicates high work-related fear-avoidance and risk of prolonged work restriction in relevant work-related low back pain cohorts.',
          'Use as a yellow-flag screen, not as a stand-alone diagnosis.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Waddell G, et al. A Fear-Avoidance Beliefs Questionnaire and the role of fear-avoidance beliefs in chronic low back pain and disability. Pain. 1993;52(2):157-168.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/8455963/',
          },
          {
            text: 'Fritz JM, George SZ. Identifying psychosocial variables in acute work-related low back pain. Phys Ther. 2002;82(10):973-983.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/12350212/',
          },
          {
            text: 'National Institutes of Health. Fear-Avoidance Beliefs Questionnaire (FABQ) instrument listing.',
            url: 'https://www.nih.gov/node/21126',
          },
        ],
      },
    ],
  },
  OMAS: {
    id: 'OMAS',
    title: 'Olerud-Molander Ankle Score',
    subtitle: '9-item weighted patient-reported score after ankle fracture.',
    sections: [
      {
        title: 'Administration',
        bullets: [
          'Ask the patient to rate ankle fracture recovery across pain, stiffness, swelling, function, support use, and work or activity level.',
          'Use the same side and episode context when comparing repeated assessments.',
          'All 9 items are required before saving.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Item weights sum to a total out of 100.',
          'Higher score indicates better recovery after ankle fracture.',
          'The original instrument has no missing-item rule in this mobile form.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'Bands: poor 0-30, fair 31-60, good 61-90, excellent 91-100.',
          'Anchored MCID is approximately 12.5 points, with published estimates varying by follow-up interval and method.',
          'Changes under about 5 points are within measurement error in the current reference context.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Olerud C, Molander H. A scoring scale for symptom evaluation after ankle fracture. Arch Orthop Trauma Surg. 1984;103(3):190-194.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/6437370/',
          },
          {
            text: 'McKeown R, et al. An evaluation of the measurement properties of the OMAS in adults with an ankle fracture. Physiotherapy. 2021;112:1-8.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/34000602/',
          },
          {
            text: 'Penning D, et al. The MCID of the OMAS in patients with unstable ankle fracture. Arch Orthop Trauma Surg. 2023;143(6):3103-3110.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10192184/',
          },
        ],
      },
    ],
  },
  '30STS': {
    id: '30STS',
    title: '30-Second Sit to Stand',
    subtitle: 'Count of full chair stands completed in 30 seconds.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Use a standard chair and keep chair height, footwear, aids, and guarding approach consistent between assessments.',
          'The patient starts seated with feet on the floor and arms crossed over the chest.',
          'Explain that the goal is to complete as many full stands as possible in 30 seconds while remaining safe.',
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Start timing on the instruction to begin.',
          'Count each full stand from seated to fully upright and back to seated control according to your local protocol.',
          'Stop if safety, pain, dizziness, medical status, or consent changes.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Record the total number of full stands completed in 30 seconds.',
          'Higher count indicates better lower-limb functional strength.',
          'Age and sex norms apply for adults 60 to 94 when birth year and sex are recorded.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'The current engine flags below 12 stands as reduced functional strength when no age norm is available.',
          'Individual measurement-error context is approximately 2.5 stands in the current engine.',
          'Interpret alongside pain response, confidence, balance, diagnosis, and repeat-test consistency.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Jones CJ, Rikli RE, Beam WC. A 30-s chair-stand test as a measure of lower body strength in community-residing older adults. Res Q Exerc Sport. 1999;70(2):113-119.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/10380242/',
          },
          {
            text: 'American Physical Therapy Association. 30-Second Chair Stand Test.',
            url: 'https://www.apta.org/patient-care/evidence-based-practice-resources/test-measures/30-second-chair-stand-test',
          },
        ],
      },
    ],
  },
  FTSTS: {
    id: 'FTSTS',
    title: 'Five Times Sit to Stand',
    subtitle: 'Time to complete five full chair stands.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Use a standard chair and keep chair height, footwear, aids, and guarding approach consistent between assessments.',
          'The patient starts seated with feet on the floor and arms crossed over the chest unless a documented local protocol differs.',
          ...sharedSafety,
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'On the start cue, time five full stands performed as quickly and safely as possible.',
          'Stop timing when the patient reaches full standing on the fifth repetition.',
          'If the patient must use their arms or cannot complete five repetitions, document the deviation in the clinical note.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Record time in seconds to one decimal place where possible.',
          'Lower time indicates better transitional movement performance.',
          'The mobile engine accepts values greater than 0 and up to 300 seconds.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'Times over 12 seconds indicate that further falls assessment may be appropriate.',
          'Times over 15 seconds are associated with elevated recurrent-fall risk in community-dwelling older adults.',
          'Interpret alongside diagnosis, pain, confidence, balance, and repeat-test consistency.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Bohannon RW. Reference values for the five-repetition sit-to-stand test. Percept Mot Skills. 2006;103(1):215-222.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/17037663/',
          },
          {
            text: 'Buatois S, et al. Five times sit to stand test is a predictor of recurrent falls. J Am Geriatr Soc. 2008;56(8):1575-1577.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/18808608/',
          },
          {
            text: 'American Physical Therapy Association. 5 Times Sit to Stand Test.',
            url: 'https://www.apta.org/patient-care/evidence-based-practice-resources/test-measures/5-times-sit-to-stand-test-ftsst-',
          },
        ],
      },
    ],
  },
  ACLSigns: {
    id: 'ACLSigns',
    title: 'ACL Clinical Signs',
    subtitle: 'Full active knee extension and effusion trace-zero judgements.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Assess the involved knee against the relevant contralateral or expected clinical baseline.',
          'Use your local knee-extension assessment and modified stroke-test setup consistently.',
          ...sharedSafety,
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Record whether full active knee extension is equal to the other side or expected baseline.',
          'Record whether effusion is trace-to-zero on the modified stroke test.',
          'Each item is an explicit clinician judgement for today rather than a patient-reported answer.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Each sign met scores 1 point.',
          'Total range is 0 to 2, with higher score indicating more gate signs met.',
          'The saved result feeds the ACL pathway and RTS context as a normal assessment row.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'Both signs met supports progression through early ACL phase-gate criteria.',
          'Outstanding signs should be interpreted with pain, strength, function, confidence, sport demands, and surgical or medical restrictions.',
          'This entry does not clear an athlete for sport.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Sturgill LP, et al. Interrater reliability of a clinical scale to assess knee joint effusion. J Orthop Sports Phys Ther. 2009;39(12):845-849.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/20032559/',
          },
          {
            text: 'van Melick N, et al. Evidence-based clinical practice update: guidelines for ACL rehabilitation. Br J Sports Med. 2016;50(24):1506-1515.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27539507/',
          },
        ],
      },
    ],
  },
  QuadLSI: {
    id: 'QuadLSI',
    title: 'Quadriceps Strength LSI',
    subtitle: 'Involved-to-uninvolved quadriceps strength symmetry.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Use the same test mode, dynamometer, position, warm-up, and cueing approach when comparing repeated assessments.',
          'Record peak quadriceps strength for the involved and uninvolved limbs in the same unit.',
          ...sharedSafety,
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Test both limbs using the same contraction type, joint angle, and trial selection rule.',
          'Enter the peak involved-limb value and peak uninvolved-limb value.',
          'Use the clinical note for device, speed, position, and pain-limited deviations.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'LSI = involved strength divided by uninvolved strength, multiplied by 100.',
          'Higher percentage indicates better limb symmetry.',
          'Values are valid only when both limbs were tested in the same unit and context.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'A quadriceps LSI of at least 90 percent is used as an RTS strength cut-off in the current engine.',
          'An 80 to 89 percent result is treated as a late-rehab milestone band, not a clearance.',
          'LSI can mask bilateral weakness, so interpret with absolute strength, hop testing, movement quality, symptoms, and sport demands.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Grindem H, et al. Simple decision rules can reduce reinjury risk by 84 percent after ACL reconstruction. Br J Sports Med. 2016;50(13):804-808.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27162233/',
          },
          {
            text: 'Kyritsis P, et al. Not meeting six discharge criteria before RTS is associated with four times greater graft rupture risk. Br J Sports Med. 2016;50(15):946-951.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27215935/',
          },
        ],
      },
    ],
  },
  HopBattery: {
    id: 'HopBattery',
    title: 'Single-Leg Hop Battery',
    subtitle: 'Four hop-test limb symmetry battery after ACL injury or reconstruction.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Use a safe, consistent surface with adequate space, footwear, warm-up, and guarding.',
          'Distance hops must use the same unit for involved and uninvolved limbs.',
          'The 6-metre timed hop is recorded in seconds for both limbs.',
          ...sharedSafety,
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Record single hop for distance, triple hop for distance, triple crossover hop for distance, and 6-metre timed hop.',
          'Use the same trial-selection rule at reassessment, such as best trial or mean of trials, according to local protocol.',
          'Do not proceed with unsafe jumping, marked pain, giving way, or changed medical restrictions.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Distance hop LSI = involved distance divided by uninvolved distance, multiplied by 100.',
          'Timed hop LSI = uninvolved time divided by involved time, multiplied by 100, so higher remains better.',
          'The primary score is the limiting, or lowest, hop LSI across the four tests.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'Each hop LSI should reach at least 90 percent for the battery to meet the RTS hop cut-off.',
          'The limiting hop identifies the weakest symmetry component.',
          'Hop LSI can overestimate readiness when both limbs are deconditioned; interpret with strength, LESS, symptoms, time since surgery, confidence, and sport demands.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Reid A, et al. Hop testing provides a reliable and valid outcome measure during rehabilitation after ACL reconstruction. Phys Ther. 2007;87(3):337-349.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/17311886/',
          },
          {
            text: 'Grindem H, et al. Simple decision rules can reduce reinjury risk by 84 percent after ACL reconstruction. Br J Sports Med. 2016;50(13):804-808.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27162233/',
          },
        ],
      },
    ],
  },
  LESS: {
    id: 'LESS',
    title: 'Landing Error Scoring System',
    subtitle: 'Clinician-rated jump-landing error count.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Use the standard drop-vertical-jump task and video or real-time rating process required by your local LESS protocol.',
          'Keep box height, camera or viewing position, footwear, surface, and instructions consistent between assessments.',
          ...sharedSafety,
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Score landing errors across the LESS items from the drop-vertical-jump task.',
          'Enter the total error count only after the clinician rating is complete.',
          'Do not use this screen as a substitute for learning the operational item definitions.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'The total score ranges from 0 to 19 errors.',
          'Higher score indicates poorer landing mechanics.',
          'The mobile form requires a whole-number total from 0 to 19.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'LESS under 5 is treated as good landing mechanics in the current RTS context.',
          'LESS is a supportive movement-quality criterion, not a stand-alone clearance decision.',
          'Interpret with strength symmetry, hop battery performance, symptoms, confidence, time, and sport demands.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Padua DA, et al. The Landing Error Scoring System is a valid and reliable clinical assessment tool. Am J Sports Med. 2009;37(10):1996-2002.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/19726623/',
          },
          {
            text: 'Padua DA, et al. The LESS as a screening tool for an ACL injury-prevention program in elite-youth soccer athletes. J Athl Train. 2015;50(6):589-595.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/25811846/',
          },
        ],
      },
    ],
  },
  CMS: {
    id: 'CMS',
    title: 'Constant-Murley Score',
    subtitle: 'Clinician-administered shoulder pain, ADL, ROM, and strength composite.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Assess one shoulder per record and keep the tested side, positioning, instructions, and measuring device consistent between sessions.',
          'Prepare a goniometer or local ROM method and a calibrated strength measure for resisted abduction.',
          ...sharedSafety,
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Record pain, work, recreation, sleep, and pain-free hand positioning from the standard Constant-Murley components.',
          'Measure active forward flexion, abduction, external rotation, and internal rotation using the published point bands.',
          'Record abduction strength in kilograms with the local protocol kept consistent for repeated measures.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Total range is 0 to 100: pain /15, ADL /20, ROM /40, and strength /25.',
          'Strength scores 1 point per approximately 0.45 kg of abduction force and is capped at 25 points.',
          'Higher scores indicate better shoulder function.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'There are no universal severity bands in the mobile result; interpret against condition, age, sex, and repeated setup.',
          'A change around 10.4 points has been reported as an MCID after rotator cuff surgery.',
          'Document deviations such as pain-limited effort, altered positioning, or different strength equipment.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Constant CR, Murley AHG. A clinical method of functional assessment of the shoulder. Clin Orthop Relat Res. 1987;(214):160-164.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/3791738/',
          },
          {
            text: 'Kukkonen J, et al. Investigating minimal clinically important difference for Constant score in patients undergoing rotator cuff surgery. J Shoulder Elbow Surg. 2013;22(12):1650-1655.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/23850308/',
          },
        ],
      },
    ],
  },
  HHS: {
    id: 'HHS',
    title: 'Harris Hip Score',
    subtitle: 'Clinician-administered hip pain, function, deformity, and ROM composite.',
    sections: [
      {
        title: 'Setup',
        bullets: [
          'Assess one hip per record and keep assistive device, footwear, gait observation context, and ROM method consistent.',
          'Prepare to record pain/function grades, four deformity criteria, and five hip ROM values in degrees.',
          ...sharedSafety,
        ],
      },
      {
        title: 'Administration',
        bullets: [
          'Choose the published option that best matches pain, limp, walking support, walking distance, stairs, shoes/socks, sitting, and public transportation.',
          'Mark each absence-of-deformity criterion only when it is met on examination.',
          'Measure flexion, abduction, adduction, external rotation, and internal rotation in degrees.',
        ],
      },
      {
        title: 'Scoring',
        bullets: [
          'Total range is 0 to 100: pain /44, function /47, absence of deformity /4, and ROM /5.',
          'All four deformity criteria must be met to score the 4 deformity points; otherwise deformity contributes 0.',
          'ROM is scored from the total arc across the five recorded hip movements.',
        ],
      },
      {
        title: 'Interpretation',
        bullets: [
          'Published bands are poor under 70, fair 70 to 79, good 80 to 89, and excellent 90 to 100.',
          'A clinically important improvement around 16 points has been reported after total hip arthroplasty.',
          'HHS includes clinician examination findings and should not be used as a patient-reported follow-up questionnaire.',
        ],
      },
      {
        title: 'References',
        links: [
          {
            text: 'Harris WH. Traumatic arthritis of the hip after dislocation and acetabular fractures. J Bone Joint Surg Am. 1969;51(4):737-755.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/5783851/',
          },
          {
            text: 'Singh JA, et al. Clinically important improvement thresholds for Harris Hip Score after primary total hip arthroplasty. BMC Musculoskelet Disord. 2016;17:256.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4901425/',
          },
        ],
      },
    ],
  },
};

export function getMeasureInstructions(measureId?: string | string[] | null): MeasureInstructionContent | null {
  const id = Array.isArray(measureId) ? measureId[0] : measureId;
  if (!id) return null;
  return MEASURE_INSTRUCTIONS[id] ?? null;
}

export { sharedSafety };
