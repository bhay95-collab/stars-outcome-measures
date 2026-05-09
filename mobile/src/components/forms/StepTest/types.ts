export interface LegInput {
  unable: boolean;
  steps: number | null; // null = test not yet started
}

export interface StepTestResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: {
    classColor: string;
    nonAffectedSteps: number | null;
    nonAffectedInterp: string | null;
    nonAffectedColor: string | null;
    asymmetryIndex: number | null;
    asymmetry: boolean;
  };
}
