import React, { useState, useEffect } from 'react';
import { useMountedRef } from '../../../hooks/useMountedRef';
import { router } from 'expo-router';
// @ts-ignore — JS clinical module, no type declarations
import { calcHiMAT } from '@clinical/himat';
import { getPatient } from '../../../supabase/patients';
import { saveAssessment } from '../../../supabase/assessments';
import { useAuth } from '../../../auth/AuthProvider';
import type { Patient } from '../../../types/domain';
import { TimeScreen } from './TimeScreen';
import { DistScreen } from './DistScreen';
import { StairsScreen } from './StairsScreen';
import { ResultScreen } from './ResultScreen';
import type { TimeInput, DistInput, StairsInput, HiMATResult } from './types';
import { StepTransition } from '../../ui/StepTransition';
import { ACTION_TIMEOUT_MS } from '../../../utils/withTimeout';

type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

const TIMED_STEPS = [
  { title: 'Walk',               hasFail: true, failLabel: 'Unable to walk' },
  { title: 'Walk Backward',      hasFail: true, failLabel: 'Unable to walk backward' },
  { title: 'Walk on Toes',       hasFail: true, failLabel: 'Fail: heel contact in middle 10m' },
  { title: 'Walk over Obstacle', hasFail: true, failLabel: 'Fail: stepped around obstacle' },
  { title: 'Run',                hasFail: true, failLabel: 'Fail: no flight phase' },
  { title: 'Skip',               hasFail: true, failLabel: 'Fail: no flight phase' },
  { title: 'Hop Forward',        hasFail: true, failLabel: 'Unable to hop' },
] as const;

const DIST_STEPS = [
  { title: 'Bound — Affected',      note: 'Jump from less-affected leg, land on affected. Average 3 trials (cm).' },
  { title: 'Bound — Less-Affected', note: 'Jump from affected leg, land on less-affected. Average 3 trials (cm).' },
] as const;

const STAIRS_STEPS = [
  { title: 'Up Stairs' },
  { title: 'Down Stairs' },
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
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [timedInputs, setTimedInputs] = useState<TimeInput[]>(makeTimedDefaults);
  const [boundInputs, setBoundInputs] = useState<DistInput[]>(makeDistDefaults);
  const [stairsInputs, setStairsInputs] = useState<StairsInput[]>(makeStairsDefaults);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const mountedRef = useMountedRef();

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
    setSaveState('idle');
    setSaveError(null);
  }

  function resetTestCapture() {
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

  async function handleSave() {
    if (saveState === 'saving' || saveState === 'timed-out') return;
    const calcInputs = buildCalcInputs();
    const r = calcHiMAT(calcInputs) as HiMATResult | null;
    if (!r) {
      setSaveError('Unable to calculate result. Please check all inputs.');
      setSaveState('error');
      return;
    }
    if (!user) {
      setSaveError('Your session has expired. Please sign in again.');
      setSaveState('error');
      return;
    }
    setSaveState('saving');
    setSaveError(null);

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      if (mountedRef.current) {
        setSaveState('timed-out');
        setSaveError('Save timed out. Your result may not have been saved. Check your connection before trying again.');
      }
    }, ACTION_TIMEOUT_MS);
    try {
      await saveAssessment({
        patient_id: patientId,
        measure: 'HiMAT',
        inputs: {
          timedInputs: timedInputs.map(t => ({ val: t.val, unable: t.unable })),
          boundInputs: boundInputs.map(b => ({ trials: [...b.trials] })),
          stairsInputs: stairsInputs.map(s => ({ mode: s.mode, depVal: s.depVal, indVal: s.indVal })),
        },
        results: {
          ...r,
          meta: { ...r.meta, encounterDate: new Date().toISOString() },
        },
      });
      clearTimeout(timeoutId);
      if (!timedOut && mountedRef.current) {
        resetTestCapture();
        setSaveState('saved');
        setTimeout(() => { if (mountedRef.current) setSaveState('idle'); }, 3000);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (!timedOut && mountedRef.current) {
        setSaveError(e instanceof Error ? e.message : 'Unable to save result. Please try again.');
        setSaveState('error');
      }
    }
  }

  if (step <= 6) {
    const cfg = TIMED_STEPS[step];
    return (
      <StepTransition key={step}>
        <TimeScreen
          title={cfg.title}
          hasFail={cfg.hasFail}
          failLabel={cfg.failLabel}
          input={timedInputs[step]}
          onChange={inp => setTimedInputs(prev => prev.map((t, i) => (i === step ? inp : t)))}
          onNext={handleNext}
          onBack={handleBack}
          stepLabel={stepLabel(step)}
          canProceed={canProceedTimed(step)}
          patient={patient}
          savedNotice={step === 0 && saveState === 'saved'}
        />
      </StepTransition>
    );
  }

  if (step <= 8) {
    const distIdx = step - 7;
    const cfg = DIST_STEPS[distIdx];
    return (
      <StepTransition key={step}>
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
      </StepTransition>
    );
  }

  if (step <= 10) {
    const stairsIdx = step - 9;
    const cfg = STAIRS_STEPS[stairsIdx];
    return (
      <StepTransition key={step}>
        <StairsScreen
          title={cfg.title}
          input={stairsInputs[stairsIdx]}
          onChange={inp => setStairsInputs(prev => prev.map((s, i) => (i === stairsIdx ? inp : s)))}
          onNext={handleNext}
          onBack={handleBack}
          stepLabel={stepLabel(step)}
          canProceed={canProceedStairs(stairsIdx)}
          patient={patient}
        />
      </StepTransition>
    );
  }

  const result = calcHiMAT(buildCalcInputs()) as HiMATResult | null;
  return (
    <StepTransition key={step}>
      <ResultScreen
        result={result}
        patient={patient}
        onBack={handleBack}
        onStartOver={handleStartOver}
        saveState={saveState}
        saveError={saveError}
        onSave={handleSave}
      />
    </StepTransition>
  );
}
