import type { MeasureDefinition } from './adapter';
import { isMobileMeasureWebOnly } from './mobileMeasures';

export type MeasureCategory = MeasureDefinition['category'];
export type MeasureFilter = 'recommended' | 'all' | MeasureCategory;

export interface MeasureGroupDefinition {
  label: string;
  category: MeasureCategory;
}

export interface VisibleMeasureGroup extends MeasureGroupDefinition {
  measures: MeasureDefinition[];
}

export type MeasureFilterCounts = Record<MeasureFilter, number>;

export const MEASURE_SELECTOR_GROUPS: MeasureGroupDefinition[] = [
  { label: 'Performance', category: 'performance' },
  { label: 'Independence', category: 'independence' },
  { label: 'Questionnaire', category: 'questionnaire' },
];

export const MEASURE_SELECTOR_FILTERS: { id: MeasureFilter; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'all', label: 'All' },
  { id: 'performance', label: 'Performance' },
  { id: 'independence', label: 'Independence' },
  { id: 'questionnaire', label: 'Questionnaire' },
];

export function getMeasuresByCategory(
  measures: Record<string, MeasureDefinition>,
  groups: readonly MeasureGroupDefinition[] = MEASURE_SELECTOR_GROUPS,
): Map<MeasureCategory, MeasureDefinition[]> {
  const selectableMeasures = Object.values(measures).filter(m => !isMobileMeasureWebOnly(m.id));
  const groupedMeasures = new Map<MeasureCategory, MeasureDefinition[]>();

  for (const group of groups) {
    groupedMeasures.set(
      group.category,
      selectableMeasures.filter(measure => measure.category === group.category),
    );
  }

  return groupedMeasures;
}

export function getMeasureFilterCounts({
  measuresByCategory,
  recommendedMeasureIds,
}: {
  measuresByCategory: ReadonlyMap<MeasureCategory, readonly MeasureDefinition[]>;
  recommendedMeasureIds: readonly string[];
}): MeasureFilterCounts {
  const recommendedSet = new Set(recommendedMeasureIds);
  const counts: MeasureFilterCounts = {
    recommended: 0,
    all: 0,
    performance: 0,
    independence: 0,
    questionnaire: 0,
  };

  for (const [category, measures] of measuresByCategory) {
    counts[category] = measures.length;
    counts.all += measures.length;
    counts.recommended += measures.filter(measure => recommendedSet.has(measure.id)).length;
  }

  return counts;
}

export function resolveMeasureFilter(
  activeFilter: MeasureFilter,
  recommendedCount: number,
): MeasureFilter {
  if (activeFilter === 'recommended' && recommendedCount === 0) return 'all';
  return activeFilter;
}

export function getVisibleMeasureGroups({
  measuresByCategory,
  filter,
  recommendedMeasureIds,
  groups = MEASURE_SELECTOR_GROUPS,
}: {
  measuresByCategory: ReadonlyMap<MeasureCategory, readonly MeasureDefinition[]>;
  filter: MeasureFilter;
  recommendedMeasureIds: readonly string[];
  groups?: readonly MeasureGroupDefinition[];
}): VisibleMeasureGroup[] {
  const recommendedSet = new Set(recommendedMeasureIds);
  const recommendedOrder = new Map(recommendedMeasureIds.map((id, index) => [id, index] as const));

  return groups
    .map(group => {
      const groupMeasures = measuresByCategory.get(group.category) ?? [];
      let measures: MeasureDefinition[] = [...groupMeasures];

      if (filter === 'recommended') {
        measures = measures
          .filter(measure => recommendedSet.has(measure.id))
          .sort((a, b) => (
            (recommendedOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER)
            - (recommendedOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER)
          ));
      } else if (filter !== 'all' && filter !== group.category) {
        measures = [];
      }

      return { ...group, measures };
    })
    .filter(group => group.measures.length > 0);
}
