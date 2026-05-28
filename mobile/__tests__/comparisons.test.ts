/**
 * @jest-environment node
 *
 * Unit tests for getAssessmentComparison and buildPreviousAssessmentMap.
 */

jest.mock('../src/clinical/adapter', () => ({
  calcChange: jest.fn(),
  getMCIDStatus: jest.fn(),
  MEASURES: {},
  MEASURE_IDS: [],
  SMART_REHAB_PATHWAY_COPY: {},
  buildPatientPathway: jest.fn(),
}));

import { getAssessmentComparison, buildPreviousAssessmentMap } from '../src/clinical/comparisons';
import { calcChange, getMCIDStatus } from '../src/clinical/adapter';
import type { MeasureDefinition } from '../src/clinical/adapter';
import type { Assessment } from '../src/types/domain';

const calcChangeMock = calcChange as jest.Mock;
const getMCIDStatusMock = getMCIDStatus as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAssessment(overrides: Partial<Assessment> & Pick<Assessment, 'id' | 'measure'>): Assessment {
  return {
    user_id: 'user-uuid',
    patient_id: 'patient-uuid',
    inputs: {},
    results: { primaryValue: 10, primaryUnit: 'm/s', interpretation: '', meta: {} },
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeMeasure(overrides: Partial<MeasureDefinition> = {}): MeasureDefinition {
  return {
    id: '10MWT',
    name: '10 Metre Walk Test',
    category: 'performance',
    primaryUnit: 'm/s',
    higherIsBetter: true,
    mcidKey: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getAssessmentComparison
// ---------------------------------------------------------------------------

describe('getAssessmentComparison', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    calcChangeMock.mockReturnValue({ delta: 1, improved: true, rawStr: '1.00', pctStr: '10%' });
    getMCIDStatusMock.mockReturnValue(null);
  });

  it('returns null when current primaryValue is null', () => {
    const current = makeAssessment({ id: 'a1', measure: '10MWT', results: { primaryValue: null, primaryUnit: 'm/s', interpretation: '', meta: {} } });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    expect(getAssessmentComparison(current, previous, makeMeasure())).toBeNull();
  });

  it('returns null when previous primaryValue is null', () => {
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT', results: { primaryValue: null, primaryUnit: 'm/s', interpretation: '', meta: {} } });
    expect(getAssessmentComparison(current, previous, makeMeasure())).toBeNull();
  });

  it('returns null when calcChange returns null', () => {
    calcChangeMock.mockReturnValue(null);
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    expect(getAssessmentComparison(current, previous, makeMeasure())).toBeNull();
  });

  it('returns "unchanged" trend when delta is 0', () => {
    calcChangeMock.mockReturnValue({ delta: 0, improved: false, rawStr: '0.00', pctStr: '0%' });
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    const result = getAssessmentComparison(current, previous, makeMeasure());
    expect(result?.trend).toBe('unchanged');
  });

  it('returns "improved" trend when improved is true', () => {
    calcChangeMock.mockReturnValue({ delta: 2, improved: true, rawStr: '2.00', pctStr: '20%' });
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    const result = getAssessmentComparison(current, previous, makeMeasure());
    expect(result?.trend).toBe('improved');
  });

  it('returns "declined" trend when improved is false and delta is non-zero', () => {
    calcChangeMock.mockReturnValue({ delta: -2, improved: false, rawStr: '2.00', pctStr: '20%' });
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    const result = getAssessmentComparison(current, previous, makeMeasure());
    expect(result?.trend).toBe('declined');
  });

  it('treats null higherIsBetter as true (mirrors web logic)', () => {
    const measure = makeMeasure({ higherIsBetter: null });
    const current = makeAssessment({ id: 'a1', measure: 'TEST' });
    const previous = makeAssessment({ id: 'a2', measure: 'TEST' });
    getAssessmentComparison(current, previous, measure);
    expect(calcChangeMock).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      true,
    );
  });

  it('passes higherIsBetter: false to calcChange when measure specifies it', () => {
    const measure = makeMeasure({ higherIsBetter: false });
    const current = makeAssessment({ id: 'a1', measure: 'TEST' });
    const previous = makeAssessment({ id: 'a2', measure: 'TEST' });
    getAssessmentComparison(current, previous, measure);
    expect(calcChangeMock).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      false,
    );
  });

  it('includes unit in deltaLabel when primaryUnit is set', () => {
    calcChangeMock.mockReturnValue({ delta: 1, improved: true, rawStr: '1.00', pctStr: '10%' });
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    const result = getAssessmentComparison(current, previous, makeMeasure({ primaryUnit: 'm/s' }));
    expect(result?.deltaLabel).toBe('+1.00 m/s');
  });

  it('omits unit from deltaLabel when primaryUnit is null', () => {
    calcChangeMock.mockReturnValue({ delta: 1, improved: true, rawStr: '1.00', pctStr: '10%' });
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    const result = getAssessmentComparison(current, previous, makeMeasure({ primaryUnit: null }));
    expect(result?.deltaLabel).toBe('+1.00');
  });

  it('does not add a leading plus sign for negative delta', () => {
    calcChangeMock.mockReturnValue({ delta: -3, improved: false, rawStr: '3.00', pctStr: '15%' });
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    const result = getAssessmentComparison(current, previous, makeMeasure({ primaryUnit: null }));
    expect(result?.deltaLabel).toBe('3.00');
  });

  it('includes MCID data when mcidKey is set and getMCIDStatus returns a result', () => {
    getMCIDStatusMock.mockReturnValue({ improved: true, meetsThreshold: true, label: 'MCID met' });
    const current = makeAssessment({ id: 'a1', measure: 'TUG' });
    const previous = makeAssessment({ id: 'a2', measure: 'TUG' });
    const result = getAssessmentComparison(current, previous, makeMeasure({ mcidKey: 'TUG' }));
    expect(result?.mcid).toEqual({ meetsThreshold: true, label: 'MCID met' });
  });

  it('sets mcid to null when mcidKey is null', () => {
    const current = makeAssessment({ id: 'a1', measure: '10MWT' });
    const previous = makeAssessment({ id: 'a2', measure: '10MWT' });
    const result = getAssessmentComparison(current, previous, makeMeasure({ mcidKey: null }));
    expect(result?.mcid).toBeNull();
    expect(getMCIDStatusMock).not.toHaveBeenCalled();
  });

  it('sets mcid to null when getMCIDStatus returns null', () => {
    getMCIDStatusMock.mockReturnValue(null);
    const current = makeAssessment({ id: 'a1', measure: 'TUG' });
    const previous = makeAssessment({ id: 'a2', measure: 'TUG' });
    const result = getAssessmentComparison(current, previous, makeMeasure({ mcidKey: 'TUG' }));
    expect(result?.mcid).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildPreviousAssessmentMap
// ---------------------------------------------------------------------------

describe('buildPreviousAssessmentMap', () => {
  it('returns an empty map for empty input', () => {
    const map = buildPreviousAssessmentMap([]);
    expect(map.size).toBe(0);
  });

  it('maps a single assessment to null (no previous exists)', () => {
    const a = makeAssessment({ id: 'a1', measure: '10MWT' });
    const map = buildPreviousAssessmentMap([a]);
    expect(map.get('a1')).toBeNull();
  });

  it('maps the newest assessment to the older one for the same measure', () => {
    const newest = makeAssessment({ id: 'a1', measure: '10MWT', created_at: '2024-02-01T00:00:00.000Z' });
    const older = makeAssessment({ id: 'a2', measure: '10MWT', created_at: '2024-01-01T00:00:00.000Z' });
    const map = buildPreviousAssessmentMap([newest, older]);
    expect(map.get('a1')).toBe(older);
    expect(map.get('a2')).toBeNull();
  });

  it('maps assessments of different measures independently — each maps to null', () => {
    const a = makeAssessment({ id: 'a1', measure: '10MWT' });
    const b = makeAssessment({ id: 'b1', measure: 'TUG' });
    const map = buildPreviousAssessmentMap([a, b]);
    expect(map.get('a1')).toBeNull();
    expect(map.get('b1')).toBeNull();
  });

  it('chains three assessments of the same measure correctly', () => {
    const a1 = makeAssessment({ id: 'a1', measure: '10MWT', created_at: '2024-03-01T00:00:00.000Z' });
    const a2 = makeAssessment({ id: 'a2', measure: '10MWT', created_at: '2024-02-01T00:00:00.000Z' });
    const a3 = makeAssessment({ id: 'a3', measure: '10MWT', created_at: '2024-01-01T00:00:00.000Z' });
    const map = buildPreviousAssessmentMap([a1, a2, a3]);
    expect(map.get('a1')).toBe(a2);
    expect(map.get('a2')).toBe(a3);
    expect(map.get('a3')).toBeNull();
  });

  it('handles mixed measures with multiple assessments per measure', () => {
    const a1 = makeAssessment({ id: 'a1', measure: '10MWT', created_at: '2024-02-01T00:00:00.000Z' });
    const a2 = makeAssessment({ id: 'a2', measure: '10MWT', created_at: '2024-01-01T00:00:00.000Z' });
    const b1 = makeAssessment({ id: 'b1', measure: 'TUG', created_at: '2024-02-01T00:00:00.000Z' });
    const b2 = makeAssessment({ id: 'b2', measure: 'TUG', created_at: '2024-01-01T00:00:00.000Z' });
    const map = buildPreviousAssessmentMap([a1, a2, b1, b2]);
    expect(map.get('a1')).toBe(a2);
    expect(map.get('a2')).toBeNull();
    expect(map.get('b1')).toBe(b2);
    expect(map.get('b2')).toBeNull();
  });
});
