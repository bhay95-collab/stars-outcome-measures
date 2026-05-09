export interface StepInput {
  unable: boolean;
  affectedSteps: number | null;
  nonAffectedSteps: number | null;
}

export interface TimedInput {
  unable: boolean;
  seconds: number | null;
}

export interface FRInput {
  unable: boolean;
  cm: number | null;
}

export interface BOOMERResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'green' | 'amber' | 'red' };
}
