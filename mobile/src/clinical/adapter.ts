import { MEASURES as _MEASURES, MEASURE_IDS } from '@clinical/measures';

export interface MeasureDefinition {
  id: string;
  name: string;
  category: 'performance' | 'independence' | 'questionnaire';
  primaryUnit: string | null;
  higherIsBetter: boolean | null;
  mcidKey: string | null;
}

export const MEASURES = _MEASURES as Record<string, MeasureDefinition>;
export { MEASURE_IDS };
