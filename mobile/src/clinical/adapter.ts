import { MEASURES as _MEASURES, MEASURE_IDS } from '@clinical/measures';
import {
  SMART_REHAB_PATHWAY_COPY as _SMART_REHAB_PATHWAY_COPY,
  buildPatientPathway as _buildPatientPathway,
} from '@clinical/pathways';
// @ts-ignore — JS clinical module, no type declarations
import { calcChange as _calcChange, getMCIDStatus as _getMCIDStatus } from '@clinical/mcid';

export interface MeasureDefinition {
  id: string;
  name: string;
  category: 'performance' | 'independence' | 'questionnaire';
  primaryUnit: string | null;
  higherIsBetter: boolean | null;
  mcidKey: string | null;
}

export interface PathwayMeasure {
  id: string;
  name: string;
  category: MeasureDefinition['category'];
  hasBaseline: boolean;
  isDue: boolean;
  lastRecordedAt: string | null;
  lastRecordedLabel: string | null;
  daysSinceLast: number | null;
}

export interface PathwayAction {
  type: string;
  tone: 'neutral' | 'attention' | 'due' | 'good';
  measureId: string | null;
  label: string;
  detail: string;
}

export interface PathwayExplanation {
  short: string;
  detail: string;
  badgeHelp: string;
  caution: string;
}

export interface PatientPathway {
  diagnosis: string;
  diagnosisLabel: string;
  recommendedMeasures: PathwayMeasure[];
  missingMeasures: PathwayMeasure[];
  dueMeasures: PathwayMeasure[];
  recordedMeasures: PathwayMeasure[];
  coveragePercent: number;
  nextActions: PathwayAction[];
  statusLabel: string;
  statusTone: 'neutral' | 'attention' | 'due' | 'good';
  preferredMeasureId: string | null;
  reassessmentDays: number;
  explanation: PathwayExplanation;
}

export interface ChangeResult {
  delta: number;
  improved: boolean;
  rawStr: string;
  pctStr: string;
}

export interface MCIDStatus {
  improved: boolean;
  meetsThreshold: boolean;
  label: string;
}

export const calcChange = _calcChange as (
  current: number,
  previous: number,
  higherIsBetter: boolean,
) => ChangeResult | null;

export const getMCIDStatus = _getMCIDStatus as (
  mcidKey: string,
  current: number,
  previous: number,
) => MCIDStatus | null;

export const MEASURES = _MEASURES as Record<string, MeasureDefinition>;
export const SMART_REHAB_PATHWAY_COPY = _SMART_REHAB_PATHWAY_COPY as PathwayExplanation;
export const buildPatientPathway = _buildPatientPathway as (
  patient: unknown,
  assessments?: unknown[],
  options?: Record<string, unknown>,
) => PatientPathway;
export { MEASURE_IDS };
