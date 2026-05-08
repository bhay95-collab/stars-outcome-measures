import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
// @ts-ignore — JS clinical module, no type declarations
import { calcHiMAT } from '@clinical/himat';
import { getPatient } from '../../../supabase/patients';
import type { Patient } from '../../../types/domain';
import { TimeScreen } from './TimeScreen';
import { DistScreen } from './DistScreen';
import { StairsScreen } from './StairsScreen';
import { ResultScreen } from './ResultScreen';
import type { TimeInput, DistInput, StairsInput, HiMATResult } from './types';

const TIMED_STEPS = [
  { title: 'Walk',               note: 'Time middle 10m of 20m walk. Unable = score 0.',              hasFail: true, failLabel: 'Unable to walk' },
  { title: 'Walk Backward',      note: 'Time middle 10m, performed backwards.',                        hasFail: true, failLabel: 'Unable to walk backward' },
  { title: 'Walk on Toes',       note: 'Time middle 10m. Fail: heel contact in middle 10m.',           hasFail: true, failLabel: 'Fail: heel contact in middle 10m' },
  { title: 'Walk over Obstacle', note: 'Step over house brick. Fail: stepping around the obstacle.',  hasFail: true, failLabel: 'Fail: stepped around obstacle' },
  { title: 'Run',                note: 'Time middle 10m. Fail: no flight phase achieved.',             hasFail: true, failLabel: 'Fail: no flight phase' },
  { title: 'Skip',               note: 'Time middle 10m. Fail: no flight phase achieved.',             hasFail: true, failLabel: 'Fail: no flight phase' },
  { title: 'Hop Forward',        note: 'Time 10m on the more-affected leg. Unable = score 0.',         hasFail: true, failLabel: 'Unable to hop' },
] as const;

const DIST_STEPS = [
  { title: 'Bound — Affected',      note: 'Jump from less-affected leg, land on affected. Average 3 trials (cm).' },
  { title: 'Bound — Less-Affected', note: 'Jump from affected leg, land on less-affected. Average 3 trials (cm).' },
] as const;

const STAIRS_STEPS = [
  {
    title:   'Up Stairs',
    depNote: 'Rail used or non-reciprocal pattern. Time the ascent.',
    indNote: 'No rail, reciprocal pattern. Time the ascent.',
  },
  {
    title:   'Down Stairs',
    depNote: 'Rail used or non-reciprocal pattern. Time the descent.',
    indNote: 'No rail, reciprocal pattern. Time the descent.',
  },
] as const;

const TOTAL_INPUT_STEPS = 11;

function makeTimedDefaults(): TimeInput[] {
  return Array(7).fill(null).map(() => ({ val: null, unable: false }));
}

function makeDistDefaults(): DistInput[] {
  return [
    { trials: [null, null, null] },
    { trials: [null, null, null] },
  ];
}

function makeStairsDefaults(): StairsInput[] {
  return [
    { mode: null, depVal: null, indVal: null },
    { mode: null, depVal: null, indVal: null },
  ];
}

export function HiMATForm({ patientId }: { patientId: string }) {
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timedInputs, setTimedInputs] = useState<TimeInput[]>(makeTimedDefaults);
  const [boundInputs, setBoundInputs] = useState<DistInput[]>(makeDistDefaults);
  const [stairsInputs, setStairsInputs] = useState<StairsInput[]>(makeStairsDefaults);

  useEffect(() => {
    getPatient(patientId).then((p: Patient | null) => setPatient(p)).catch(() => null);
  }, [patientId]);

  function handleBack() {
    if (step === 0) {
      router.back();
    } else {
      setStep(s => s - 1);
    }
  }

  function handleNext() {
    setStep(s => s + 1);
  }

  function handleStartOver() {
    setStep(0);
    setTimedInputs(makeTimedDefaults());
    setBoundInputs(makeDistDefaults());
    setStairsInputs(makeStairsDefaults());
  }

  function stepLabel(s: number): string {
    return `Step ${s + 1} of ${TOTAL_INPUT_STEPS}`;
  }

  function canProceedTimed(idx: number): boolean {
    const inp = timedInputs[idx];
    return inp.unable || (inp.val !== null && inp.val > 0);
  }

  function canProceedDist(idx: number): boolean {
    return boundInputs[idx].trials.every(t => t !== null && t > 0);
  }

  function canProceedStairs(idx: number): boolean {
    const inp = stairsInputs[idx];
    if (inp.mode === 'IND') return inp.indVal !== null && inp.indVal > 0;
    if (inp.mode === 'DEP') return inp.depVal !== null && inp.depVal > 0;
    return false;
  }

  function buildCalcInputs() {
    const asc  = stairsInputs[0];
    const desc = stairsInputs[1];
    return [
      ...timedInputs,
      ...boundInputs,
      asc.mode === 'IND'  ? { mode: 'IND' }                    : { mode: 'DEP', val: asc.depVal },
      asc.mode === 'IND'  ? { val: asc.indVal, unable: false }  : { val: 0,      unable: true },
      desc.mode === 'IND' ? { mode: 'IND' }                    : { mode: 'DEP', val: desc.depVal },
      desc.mode === 'IND' ? { val: desc.indVal, unable: false } : { val: 0,      unable: true },
    ];
  }

  if (step <= 6) {
    const cfg = TIMED_STEPS[step];
    return (
      <TimeScreen
        title={cfg.title}
        note={cfg.note}
        hasFail={cfg.hasFail}
        failLabel={cfg.failLabel}
        input={timedInputs[step]}
        onChange={inp => setTimedInputs(prev => prev.map((t, i) => (i === step ? inp : t)))}
        onNext={handleNext}
        onBack={handleBack}
        stepLabel={stepLabel(step)}
        canProceed={canProceedTimed(step)}
        patient={patient}
      />
    );
  }

  if (step <= 8) {
    const distIdx = step - 7;
    const cfg = DIST_STEPS[distIdx];
    return (
      <DistScreen
        title={cfg.title}
        note={cfg.note}
        input={boundInputs[distIdx]}
        onChange={inp => setBoundInputs(prev => prev.map((b, i) => (i === distIdx ? inp : b)))}
        onNext={handleNext}
        onBack={handleBack}
        stepLabel={stepLabel(step)}
        canProceed={canProceedDist(distIdx)}
        patient={patient}
      />
    );
  }

  if (step <= 10) {
    const stairsIdx = step - 9;
    const cfg = STAIRS_STEPS[stairsIdx];
    return (
      <StairsScreen
        title={cfg.title}
        depNote={cfg.depNote}
        indNote={cfg.indNote}
        input={stairsInputs[stairsIdx]}
        onChange={inp => setStairsInputs(prev => prev.map((s, i) => (i === stairsIdx ? inp : s)))}
        onNext={handleNext}
        onBack={handleBack}
        stepLabel={stepLabel(step)}
        canProceed={canProceedStairs(stairsIdx)}
        patient={patient}
      />
    );
  }

  const result = calcHiMAT(buildCalcInputs()) as HiMATResult | null;
  return (
    <ResultScreen
      result={result}
      patient={patient}
      onBack={handleBack}
      onStartOver={handleStartOver}
    />
  );
}
