import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
// @ts-ignore — JS clinical module, no type declarations
import { calcStepTest } from '@clinical/steptest';
import { getPatient } from '../../../supabase/patients';
import type { Patient } from '../../../types/domain';
import { LegScreen } from './LegScreen';
import { ResultScreen } from './ResultScreen';
import type { LegInput, StepTestResult } from './types';

const DEFAULT_STEP_HEIGHT = '7.5';

function makeLegDefault(): LegInput {
  return { unable: false, steps: null };
}

function canProceed(input: LegInput): boolean {
  return input.unable || input.steps !== null;
}

export function StepTestForm({ patientId }: { patientId: string }) {
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [affectedInput, setAffectedInput] = useState<LegInput>(makeLegDefault);
  const [nonAffectedInput, setNonAffectedInput] = useState<LegInput>(makeLegDefault);
  const [stepHeight, setStepHeight] = useState(DEFAULT_STEP_HEIGHT);

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
    />
  );
}
