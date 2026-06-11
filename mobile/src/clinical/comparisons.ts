import { calcChange, getMCIDStatus } from './adapter';
import type { Assessment } from '../types/domain';
import type { MeasureDefinition } from './adapter';

export type ComparisonTrend = 'improved' | 'declined' | 'unchanged';

export interface AssessmentComparison {
  trend: ComparisonTrend;
  deltaLabel: string;
  mcid: { meetsThreshold: boolean; label: string } | null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return isFinite(n) ? n : null;
  }
  return null;
}

export function getAssessmentComparison(
  current: Assessment,
  previous: Assessment,
  measure: MeasureDefinition,
  condition?: string | null,
): AssessmentComparison | null {
  const currentValue = toFiniteNumber(current.results?.primaryValue);
  const previousValue = toFiniteNumber(previous.results?.primaryValue);

  if (currentValue === null || previousValue === null) return null;

  // Mirror web logic: treat null higherIsBetter as true (higher = better)
  const hib = measure.higherIsBetter !== false;

  const change = calcChange(currentValue, previousValue, hib);
  if (!change) return null;

  const trend: ComparisonTrend =
    change.delta === 0 ? 'unchanged' : change.improved ? 'improved' : 'declined';

  const unit = measure.primaryUnit ?? '';
  const sign = change.delta >= 0 ? '+' : '';
  const deltaLabel = unit
    ? `${sign}${change.rawStr} ${unit}`
    : `${sign}${change.rawStr}`;

  const rawMCID = measure.mcidKey
    ? getMCIDStatus(measure.mcidKey, currentValue, previousValue, condition)
    : null;

  return {
    trend,
    deltaLabel,
    mcid: rawMCID
      ? { meetsThreshold: rawMCID.meetsThreshold, label: rawMCID.label }
      : null,
  };
}

/**
 * Build a map from assessment id → the chronologically previous assessment
 * of the same measure for the same patient.
 *
 * Input `assessments` must already be sorted newest-first
 * (as returned by getAssessmentsForPatient which uses ORDER BY created_at DESC).
 */
export function buildPreviousAssessmentMap(
  assessments: Assessment[],
): Map<string, Assessment | null> {
  const map = new Map<string, Assessment | null>();
  const byMeasure = new Map<string, Assessment[]>();

  for (const a of assessments) {
    if (!byMeasure.has(a.measure)) byMeasure.set(a.measure, []);
    byMeasure.get(a.measure)!.push(a);
  }

  for (const list of byMeasure.values()) {
    for (let i = 0; i < list.length; i++) {
      map.set(list[i].id, list[i + 1] ?? null);
    }
  }

  return map;
}
