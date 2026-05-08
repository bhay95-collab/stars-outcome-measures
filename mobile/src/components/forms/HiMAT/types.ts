export type TimeInput   = { val: number | null; unable: boolean };
export type DistInput   = { trials: [number | null, number | null, number | null] };
export type StairsInput = { mode: 'IND' | 'DEP' | null; depVal: number | null; indVal: number | null };

export interface HiMATResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: { classColor: 'red' | 'amber' | 'green'; itemScores: number[] };
}
