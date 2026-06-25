import React, { useState, useEffect } from 'react';
import { useMountedRef } from '../../../hooks/useMountedRef';
import { router } from 'expo-router';
// @ts-ignore — JS clinical module, no type declarations
import { calcStepTest } from '@clinical/steptest';
import { getPatient } from '../../../supabase/patients';
import { saveAssessment } from '../../../supabase/assessments';
import { useAuth } from '../../../auth/AuthProvider';
import type { Patient } from '../../../types/domain';
import { LegScreen } from './LegScreen';
import { ResultScreen } from './ResultScreen';
import type { LegInput, StepTestResult } from './types';
import { ACTION_TIMEOUT_MS } from '../../../utils/withTimeout';

type SaveState = 'idle' | 'saving' | 'timed-out' | 'saved' | 'error';

const DEFAULT_STEP_HEIGHT = '7.5';

function makeLegDefault(): LegInput {
  return { unable: false, steps: null };
}

function canProceed(input: LegInput): boolean {
  return input.unable || input.steps !== null;
}

export function StepTestForm({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [affectedInput, setAffectedInput] = useState<LegInput>(makeLegDefault);
  const [nonAffectedInput, setNonAffectedInput] = useState<LegInput>(makeLegDefault);
  const [stepHeight, setStepHeight] = useState(DEFAULT_STEP_HEIGHT);
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
    setAffectedInput(makeLegDefault());
    setNonAffectedInput(makeLegDefault());
    setStepHeight(DEFAULT_STEP_HEIGHT);
    setSaveState('idle');
    setSaveError(null);
  }

  function resetTestCapture() {
    setStep(0);
    setAffectedInput(makeLegDefault());
    setNonAffectedInput(makeLegDefault());
    setStepHeight(DEFAULT_STEP_HEIGHT);
  }

  async function handleSave() {
    if (saveState === 'saving' || saveState === 'timed-out') return;
    const aff    = affectedInput.unable ? 0 : (affectedInput.steps ?? 0);
    const nonAff = nonAffectedInput.unable ? 0 : (nonAffectedInput.steps ?? 0);
    const r = calcStepTest({ affectedSteps: aff, nonAffectedSteps: nonAff }) as StepTestResult | null;
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
        measure: 'Step',
        inputs: {
          affectedLeg: { unable: affectedInput.unable, steps: affectedInput.steps },
          nonAffectedLeg: { unable: nonAffectedInput.unable, steps: nonAffectedInput.steps },
          stepHeightCm: Number(stepHeight) || 7.5,
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

  if (step === 0) {
    return (
      <LegScreen
        key={0}
        legLabel="Affected Leg"
        stepLabel="Step 1 of 2"
        input={affectedInput}
        onChange={setAffectedInput}
        onNext={handleNext}
        onBack={handleBack}
        canProceed={canProceed(affectedInput)}
        patient={patient}
        stepHeight={stepHeight}
        onStepHeightChange={setStepHeight}
        savedNotice={saveState === 'saved'}
      />
    );
  }

  if (step === 1) {
    return (
      <LegScreen
        key={1}
        legLabel="Non-Affected Leg"
        stepLabel="Step 2 of 2"
        input={nonAffectedInput}
        onChange={setNonAffectedInput}
        onNext={handleNext}
        onBack={handleBack}
        canProceed={canProceed(nonAffectedInput)}
        patient={patient}
      />
    );
  }

  const affectedSteps    = affectedInput.unable ? 0 : (affectedInput.steps ?? 0);
  const nonAffectedSteps = nonAffectedInput.unable ? 0 : (nonAffectedInput.steps ?? 0);
  const result = calcStepTest({ affectedSteps, nonAffectedSteps }) as StepTestResult | null;

  return (
    <ResultScreen
      result={result}
      patient={patient}
      stepHeight={stepHeight}
      onBack={handleBack}
      onStartOver={handleStartOver}
      saveState={saveState}
      saveError={saveError}
      onSave={handleSave}
    />
  );
}
