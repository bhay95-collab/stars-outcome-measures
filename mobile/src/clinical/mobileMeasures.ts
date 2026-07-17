import { MEASURE_IDS } from './adapter';

export const MOBILE_WEB_ONLY_MEASURE_IDS = ['ISNCSCI'] as const;

export const MOBILE_SUPPORTED_MEASURE_IDS = [
  'TUG',
  '10MWT',
  '6MWT',
  'FAC',
  'BBS',
  'PASS',
  'TIS',
  'MAS',
  'COVS',
  'FGA',
  'HiMAT',
  'SARA',
  'Step',
  'AMP',
  'BOOMER',
  'FSS',
  'HADS',
  'RPQ',
  'PDQ8',
  'ABC',
  'BIVI',
  'Barthel',
  'SCIM',
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
] as const;

export const MOBILE_RELEASE_GATES = {
  CSI: {
    reason: 'CSI item wording is held pending PRIDE Research Foundation courtesy-permission confirmation.',
    requiredEvidence: 'Document permission scope for commercial clinician-facing mobile use before enabling native support.',
  },
  KOOS: {
    reason: 'KOOS is managed through Mapi/ePROVIDE and permission is required for commercial or health-care organization use.',
    requiredEvidence: 'Document Mapi/ePROVIDE license or permission terms and proofread official item wording before enabling native support.',
  },
  HOOS: {
    reason: 'HOOS is managed through Mapi/ePROVIDE and permission is required for commercial or health-care organization use.',
    requiredEvidence: 'Document Mapi/ePROVIDE license or permission terms and proofread official item wording before enabling native support.',
  },
  HAGOS: {
    reason: 'HAGOS is not copyrighted, but ePROVIDE lists author conditions and current source/version checks.',
    requiredEvidence: 'Document author/ePROVIDE conditions, selected HAGOS version, and official item-wording proofread before enabling native support.',
  },
} as const;

export type MobileSupportedMeasureId = typeof MOBILE_SUPPORTED_MEASURE_IDS[number];
export type MobileWebOnlyMeasureId = typeof MOBILE_WEB_ONLY_MEASURE_IDS[number];
export type MobileReleaseGatedMeasureId = keyof typeof MOBILE_RELEASE_GATES;
export type MobileMeasureAvailability = 'available' | 'coming-soon' | 'web-only' | 'unknown';

const supportedMeasureSet = new Set<string>(MOBILE_SUPPORTED_MEASURE_IDS);
const webOnlyMeasureSet = new Set<string>(MOBILE_WEB_ONLY_MEASURE_IDS);
const registryMeasureSet = new Set<string>(MEASURE_IDS);
const releaseGateSet = new Set<string>(Object.keys(MOBILE_RELEASE_GATES));

export const MOBILE_UNBUILT_MEASURE_IDS = MEASURE_IDS.filter(
  id => !supportedMeasureSet.has(id) && !webOnlyMeasureSet.has(id),
);

export function isMobileMeasureSupported(measureId: string | null | undefined): measureId is MobileSupportedMeasureId {
  return !!measureId && supportedMeasureSet.has(measureId);
}

export function isMobileMeasureWebOnly(measureId: string | null | undefined): measureId is MobileWebOnlyMeasureId {
  return !!measureId && webOnlyMeasureSet.has(measureId);
}

export function isMobileMeasureReleaseGated(
  measureId: string | null | undefined,
): measureId is MobileReleaseGatedMeasureId {
  return !!measureId && releaseGateSet.has(measureId);
}

export function getMobileMeasureReleaseGate(measureId: string | null | undefined) {
  if (!isMobileMeasureReleaseGated(measureId)) return null;
  return MOBILE_RELEASE_GATES[measureId];
}

export function getMobileMeasureAvailability(measureId: string | null | undefined): MobileMeasureAvailability {
  if (!measureId || !registryMeasureSet.has(measureId)) return 'unknown';
  if (isMobileMeasureSupported(measureId)) return 'available';
  if (isMobileMeasureWebOnly(measureId)) return 'web-only';
  return 'coming-soon';
}
