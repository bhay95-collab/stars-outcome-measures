import {
  MOBILE_RELEASE_GATES,
  MOBILE_SUPPORTED_MEASURE_IDS,
  MOBILE_UNBUILT_MEASURE_IDS,
  MOBILE_WEB_ONLY_MEASURE_IDS,
  getMobileMeasureReleaseGate,
  getMobileMeasureAvailability,
  isMobileMeasureReleaseGated,
  isMobileMeasureSupported,
  isMobileMeasureWebOnly,
} from '../src/clinical/mobileMeasures';
import { MEASURES, MEASURE_IDS } from '../src/clinical/adapter';
import { getMeasureInstructions } from '../src/clinical/measureInstructions';
import {
  getMeasureFilterCounts,
  getMeasuresByCategory,
  getVisibleMeasureGroups,
  resolveMeasureFilter,
} from '../src/clinical/measureSelector';

const EXPECTED_UNBUILT_AFTER_BATCH = [
  'CSI',
  'KOOS',
  'HOOS',
  'HAGOS',
];

const NEW_MSK_BATCH = ['NPRS', 'PSFS', 'LEFS', 'BPFS', 'FAAM'];
const APP_SAFE_BATCH = ['CAIT', 'ATRS', 'FABQ', 'OMAS', '30STS'];
const ACL_RTS_BATCH = ['ACLSigns', 'QuadLSI', 'HopBattery', 'LESS', 'FTSTS'];
const CLINICIAN_COMPOSITE_BATCH = ['CMS', 'HHS'];
const PERMISSION_GATED_BATCH = ['CSI', 'KOOS', 'HOOS', 'HAGOS'];

describe('mobile measure support map', () => {
  it('declares the 40 native mobile forms supported after the clinician composite batch', () => {
    expect(MOBILE_SUPPORTED_MEASURE_IDS).toHaveLength(40);
    expect(MOBILE_SUPPORTED_MEASURE_IDS).toEqual(expect.arrayContaining([
      'NPRS',
      'PSFS',
      'LEFS',
      'BPFS',
      'FAAM',
      'CAIT',
      'ATRS',
      'FABQ',
      'OMAS',
      '30STS',
      'ACLSigns',
      'QuadLSI',
      'HopBattery',
      'LESS',
      'FTSTS',
      'CMS',
      'HHS',
    ]));
  });

  it('keeps every supported and web-only measure tied to the shared registry', () => {
    for (const id of [...MOBILE_SUPPORTED_MEASURE_IDS, ...MOBILE_WEB_ONLY_MEASURE_IDS]) {
      expect(MEASURE_IDS).toContain(id);
    }
  });

  it('keeps ISNCSCI web-only and out of native mobile support', () => {
    expect(MOBILE_WEB_ONLY_MEASURE_IDS).toEqual(['ISNCSCI']);
    expect(isMobileMeasureWebOnly('ISNCSCI')).toBe(true);
    expect(isMobileMeasureSupported('ISNCSCI')).toBe(false);
    expect(getMobileMeasureAvailability('ISNCSCI')).toBe('web-only');
  });

  it('computes the remaining unbuilt registry measures for selector disabled states', () => {
    expect(MOBILE_UNBUILT_MEASURE_IDS).toEqual(EXPECTED_UNBUILT_AFTER_BATCH);
    expect(getMobileMeasureAvailability('KOOS')).toBe('coming-soon');
    expect(getMobileMeasureAvailability('CSI')).toBe('coming-soon');
    expect(getMobileMeasureAvailability('CMS')).toBe('available');
    expect(getMobileMeasureAvailability('not-a-measure')).toBe('unknown');
  });

  it('keeps permission-sensitive measures release-gated until evidence is documented', () => {
    expect(Object.keys(MOBILE_RELEASE_GATES)).toEqual(PERMISSION_GATED_BATCH);

    for (const id of PERMISSION_GATED_BATCH) {
      expect(isMobileMeasureReleaseGated(id)).toBe(true);
      expect(getMobileMeasureReleaseGate(id)?.reason).toEqual(expect.any(String));
      expect(getMobileMeasureReleaseGate(id)?.requiredEvidence).toEqual(expect.any(String));
      expect(isMobileMeasureSupported(id)).toBe(false);
      expect(getMobileMeasureAvailability(id)).toBe('coming-soon');
    }

    expect(getMobileMeasureReleaseGate('CMS')).toBeNull();
    expect(isMobileMeasureReleaseGated('ISNCSCI')).toBe(false);
  });

  it('has an instruction guide for every natively supported mobile measure', () => {
    for (const id of MOBILE_SUPPORTED_MEASURE_IDS) {
      expect(getMeasureInstructions(id)).toBeTruthy();
    }
  });

  it('ships source-linked references for every mobile parity batch form', () => {
    for (const id of [
      ...NEW_MSK_BATCH,
      ...APP_SAFE_BATCH,
      ...ACL_RTS_BATCH,
      ...CLINICIAN_COMPOSITE_BATCH,
    ]) {
      const instructions = getMeasureInstructions(id);
      const references = instructions?.sections.find(section => section.title === 'References');
      expect(references?.links?.length).toBeGreaterThan(0);
      expect(references?.links?.every(link => !!link.text && !!link.url)).toBe(true);
    }
  });

  it('filters the mobile selector by recommended measures or category', () => {
    const measuresByCategory = getMeasuresByCategory(MEASURES);
    const recommendedMeasureIds = ['NPRS', '6MWT', 'LEFS'];
    const recommendedGroups = getVisibleMeasureGroups({
      measuresByCategory,
      filter: 'recommended',
      recommendedMeasureIds,
    });
    const questionnaireGroups = getVisibleMeasureGroups({
      measuresByCategory,
      filter: 'questionnaire',
      recommendedMeasureIds: [],
    });

    expect(recommendedGroups.map(group => group.category)).toEqual(['performance', 'questionnaire']);
    expect(recommendedGroups.flatMap(group => group.measures.map(measure => measure.id))).toEqual([
      '6MWT',
      'NPRS',
      'LEFS',
    ]);
    expect(questionnaireGroups).toHaveLength(1);
    expect(questionnaireGroups[0].category).toBe('questionnaire');
    expect(questionnaireGroups[0].measures.map(measure => measure.id)).toContain('FAAM');
    expect(questionnaireGroups[0].measures.map(measure => measure.id)).not.toContain('TUG');
  });

  it('counts mobile selector filters and falls back when no recommendations exist', () => {
    const measuresByCategory = getMeasuresByCategory(MEASURES);
    const filterCounts = getMeasureFilterCounts({
      measuresByCategory,
      recommendedMeasureIds: ['NPRS', '6MWT', 'LEFS'],
    });

    expect(filterCounts.recommended).toBe(3);
    expect(filterCounts.all).toBe(MEASURE_IDS.length - MOBILE_WEB_ONLY_MEASURE_IDS.length);
    expect(filterCounts.questionnaire).toBeGreaterThan(filterCounts.independence);
    expect(resolveMeasureFilter('recommended', 0)).toBe('all');
    expect(resolveMeasureFilter('recommended', 3)).toBe('recommended');
  });
});
