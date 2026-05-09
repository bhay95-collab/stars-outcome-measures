import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getPatient } from '../../../supabase/patients';
import type { Patient } from '../../../types/domain';
import type { StepInput, TimedInput, FRInput, BOOMERResult } from './types';
import { StepTestScreen } from './StepTestScreen';
import { TUGScreen } from './TUGScreen';
import { FRScreen } from './FRScreen';
import { StanceScreen } from './StanceScreen';
import { ResultScreen } from './ResultScreen';

// @ts-ignore
import { calcBOOMER } from '@clinical/boomer';
import { saveAssessment } from '../../../supabase/assessments';
import { useAuth } from '../../../auth/AuthProvider';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const DEFAULT_STEP_INPUT: StepInput = { unable: false, affectedSteps: null, nonAffectedSteps: null };
const DEFAULT_TIMED_INPUT: TimedInput = { unable: false, seconds: null };
const DEFAULT_FR_INPUT: FRInput = { unable: false, cm: null };

function scoreStep(input: StepInput): number | null {
  if (input.unable) return 0;
  if (input.affectedSteps === null || input.nonAffectedSteps === null) return null;
  const avg = (input.affectedSteps + input.nonAffectedSteps) / 2;
  if (avg <= 5) return 1;
  if (avg <= 8) return 2;
  if (avg <= 12) return 3;
  return 4;
}

function scoreTUG(input: TimedInput): number | null {
  if (input.unable) return 0;
  if (input.seconds === null) return null;
  if (input.seconds >= 30) return 1;
  if (input.seconds >= 20) return 2;
  if (input.seconds >= 10) return 3;
  return 4;
}

function scoreFR(input: FRInput): number | null {
  if (input.unable) return 0;
  if (input.cm === null) return null;
  if (input.cm === 0) return 0;
  if (input.cm <= 15) return 1;
  if (input.cm <= 20) return 2;
  if (input.cm <= 30) return 3;
  return 4;
}

function scoreStance(input: TimedInput): number | null {
  if (input.unable) return 0;
  if (input.seconds === null) return null;
  if (input.seconds <= 30) return 1;
  if (input.seconds <= 60) return 2;
  if (input.seconds < 90) return 3;
  return 4;
}

function computeResult(
  tugScore: number,
  frScore: number,
  stepScore: number,
  stanceScore: number,
): BOOMERResult {
  return calcBOOMER({ items: [tugScore, frScore, stepScore, stanceScore] }) as BOOMERResult;
}

export function BOOMERForm({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [stepInput, setStepInput] = useState<StepInput>(DEFAULT_STEP_INPUT);
  const [tugInput, setTugInput] = useState<TimedInput>(DEFAULT_TIMED_INPUT);
  const [frInput, setFrInput] = useState<FRInput>(DEFAULT_FR_INPUT);
  const [stanceInput, setStanceInput] = useState<TimedInput>(DEFAULT_TIMED_INPUT);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getPatient(patientId).then((p: Patient | null) => setPatient(p)).catch(() => null);
  }, [patientId]);

  const stepScore = scoreStep(stepInput);
  const tugScore = scoreTUG(tugInput);
  const frScore = scoreFR(frInput);
  const stanceScore = scoreStance(stanceInput);

  const allScored =
    stepScore !== null &&
    tugScore !== null &&
    frScore !== null &&
    stanceScore !== null;

  const result: BOOMERResult | null = allScored
    ? computeResult(tugScore!, frScore!, stepScore!, stanceScore!)
    : null;

  function handleStartOver() {
    setStepInput(DEFAULT_STEP_INPUT);
    setTugInput(DEFAULT_TIMED_INPUT);
    setFrInput(DEFAULT_FR_INPUT);
    setStanceInput(DEFAULT_TIMED_INPUT);
    setSaveState('idle');
    setSaveError(null);
    setStep(0);
  }

  async function handleSave() {
    if (saveState === 'saving' || !result) return;
    if (!user) {
      setSaveError('Your session has expired. Please sign in again.');
      setSaveState('error');
      return;
    }
    setSaveState('saving');
    setSaveError(null);
    try {
      await saveAssessment({
        patient_id: patientId,
        measure: 'BOOMER',
        inputs: {
          step: { unable: stepInput.unable, affectedSteps: stepInput.affectedSteps, nonAffectedSteps: stepInput.nonAffectedSteps },
          tug: { unable: tugInput.unable, seconds: tugInput.seconds },
          fr: { unable: frInput.unable, cm: frInput.cm },
          stance: { unable: stanceInput.unable, seconds: stanceInput.seconds },
          scores: { step: stepScore, tug: tugScore, fr: frScore, stance: stanceScore },
        },
        results: {
          ...result,
          meta: { ...result.meta, encounterDate: new Date().toISOString() },
        },
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Unable to save result. Please try again.');
      setSaveState('error');
    }
  }

  if (step === 0) {
    return (
      <StepTestScreen
        key={0}
        input={stepInput}
        onChange={setStepInput}
        onNext={() => setStep(1)}
        onBack={() => router.back()}
        canProceed={stepInput.unable || stepScore !== null}
        patient={patient}
        score={stepScore}
      />
    );
  }

  if (step === 1) {
    return (
      <TUGScreen
        key={1}
        input={tugInput}
        onChange={setTugInput}
        onNext={() => setStep(2)}
        onBack={() => setStep(0)}
        canProceed={tugInput.unable || tugInput.seconds !== null}
        patient={patient}
        score={tugScore}
      />
    );
  }

  if (step === 2) {
    return (
      <FRScreen
        key={2}
        input={frInput}
        onChange={setFrInput}
        onNext={() => setStep(3)}
        onBack={() => setStep(1)}
        canProceed={frInput.unable || frInput.cm !== null}
        patient={patient}
        score={frScore}
      />
    );
  }

  if (step === 3) {
    return (
      <StanceScreen
        key={3}
        input={stanceInput}
        onChange={setStanceInput}
        onNext={() => setStep(4)}
        onBack={() => setStep(2)}
        canProceed={(stanceInput.unable || stanceInput.seconds !== null) && result !== null}
        patient={patient}
        score={stanceScore}
      />
    );
  }

  return (
    <ResultScreen
      key={4}
      stepInput={stepInput}
      tugInput={tugInput}
      frInput={frInput}
      stanceInput={stanceInput}
      scores={{ step: stepScore, tug: tugScore, fr: frScore, stance: stanceScore }}
      result={result!}
      patient={patient}
      onBack={() => setStep(3)}
      onStartOver={handleStartOver}
      saveState={saveState}
      saveError={saveError}
      onSave={handleSave}
    />
  );
}
