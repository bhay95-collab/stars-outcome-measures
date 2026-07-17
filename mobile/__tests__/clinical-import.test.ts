/**
 * @jest-environment node
 *
 * Phase 0 smoke test: confirm every active calc function can be imported
 * and returns the expected { primaryValue, primaryUnit, interpretation, meta }
 * shape without DOM access. ISNCSCI is excluded (deferred).
 */

import { calc10mwt } from '@clinical/10mwt';
import { calcTUG } from '@clinical/tug';
import { calcFAC } from '@clinical/fac';
import { calc6MWT } from '@clinical/sixmwt';
import { calcBBS } from '@clinical/bbs';
import { calcPASS } from '@clinical/pass';
import { calcTIS } from '@clinical/tis';
import { calcMAS } from '@clinical/mas';
import { calcCOVS } from '@clinical/covs';
import { calcFGA } from '@clinical/fga';
import { calcHiMAT } from '@clinical/himat';
import { calcSARA } from '@clinical/sara';
import { calcStepTest } from '@clinical/steptest';
import { calcAMP } from '@clinical/amp';
import { calcBOOMER } from '@clinical/boomer';
import { calcBarthel } from '@clinical/barthel';
import { calcSCIM } from '@clinical/scim';
import { calcFSS } from '@clinical/fss';
import { calcRPQ } from '@clinical/rpq';
import { calcPDQ8 } from '@clinical/pdq8';
import { calcABC } from '@clinical/abc';
import { calcBIVI } from '@clinical/bivi';
import { calcHADS } from '@clinical/hads';
import { calcNPRS } from '@clinical/nprs';
import { calcPSFS } from '@clinical/psfs';
import { calcLEFS } from '@clinical/lefs';
import { calcBPFS } from '@clinical/bpfs';
import { calcFAAM } from '@clinical/faam';
import { calcCAIT, CAIT_ITEMS } from '@clinical/cait';
import { calcATRS } from '@clinical/atrs';
import { calcFABQ } from '@clinical/fabq';
import { calcOMAS, OMAS_ITEMS } from '@clinical/omas';
import { calc30STS } from '@clinical/sts30';
import { calcACLSigns } from '@clinical/aclSigns';
import { calcQuadLSI } from '@clinical/quadLSI';
import { calcHopBattery } from '@clinical/hopBattery';
import { calcLESS } from '@clinical/less';
import { calcFTSTS } from '@clinical/ftsts';
import { calcCMS } from '@clinical/cms';
import { calcHHS } from '@clinical/harrisHip';

interface CalcResult {
  primaryValue: number;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

function assertCalcResult(result: unknown, measureKey: string): void {
  expect(result).toBeTruthy();
  const r = result as CalcResult;
  expect(typeof r.primaryValue).toBe('number');
  expect(typeof r.primaryUnit).toBe('string');
  expect(typeof r.interpretation).toBe('string');
  expect(r.meta).toBeTruthy();
}

function arr(count: number, value: number): number[] {
  return Array(count).fill(value);
}

describe('Phase 0 — clinical calc smoke tests (40 active mobile measures)', () => {
  test('10MWT', () => {
    assertCalcResult(calc10mwt({ comfortTime: 10, fastTime: 8, age: 60, gender: 'M' }), '10MWT');
  });

  test('TUG', () => {
    assertCalcResult(calcTUG({ time: 12, fastTime: null, dualTime: null }), 'TUG');
  });

  test('FAC', () => {
    assertCalcResult(calcFAC({ level: 3 }), 'FAC');
  });

  test('6MWT', () => {
    assertCalcResult(
      calc6MWT({ distance: 400, age: 65, gender: 'F', height: 165, weight: 70 }),
      '6MWT'
    );
  });

  // BBS: 14 items, each 0–4
  test('BBS', () => {
    assertCalcResult(calcBBS({ items: arr(14, 3) }), 'BBS');
  });

  // PASS: 12 items, 0–3
  test('PASS', () => {
    assertCalcResult(calcPASS({ items: arr(12, 2) }), 'PASS');
  });

  // TIS: three subscale totals (not an items array)
  test('TIS', () => {
    assertCalcResult(calcTIS({ staticScore: 7, dynamicScore: 10, coordinationScore: 4 }), 'TIS');
  });

  // MAS: 8 items, 0–6
  test('MAS', () => {
    assertCalcResult(calcMAS({ items: arr(8, 3) }), 'MAS');
  });

  // COVS: 13 items, 1–7
  test('COVS', () => {
    assertCalcResult(calcCOVS({ items: arr(13, 4) }), 'COVS');
  });

  // FGA: 10 items
  test('FGA', () => {
    assertCalcResult(calcFGA({ items: arr(10, 2) }), 'FGA');
  });

  // HiMAT: array of 13 typed item objects
  test('HiMAT', () => {
    const inputs = [
      { val: 8 },                          // h0  walk (time)
      { val: 12 },                         // h1  walk backward (time)
      { val: 10 },                         // h2  walk on toes (time)
      { val: 8 },                          // h3  walk over obstacle (time)
      { val: 3 },                          // h4  run (time)
      { val: 4.5 },                        // h5  skip (time)
      { val: 8 },                          // h6  hop forward (time)
      { trials: [100, 100, 100] },         // h7  bound affected (dist)
      { trials: [100, 100, 100] },         // h8  bound less-affected (dist)
      { mode: 'IND' },                     // h9  up stairs dependent (dep)
      { val: 10 },                         // h10 up stairs independent (time)
      { mode: 'IND' },                     // h11 down stairs dependent (dep)
      { val: 9 },                          // h12 down stairs independent (time)
    ];
    assertCalcResult(calcHiMAT(inputs), 'HiMAT');
  });

  // SARA: 8 items
  test('SARA', () => {
    assertCalcResult(calcSARA({ items: arr(8, 2) }), 'SARA');
  });

  test('Step Test', () => {
    assertCalcResult(calcStepTest({ affectedSteps: 12, nonAffectedSteps: 15 }), 'Step');
  });

  test('AMP', () => {
    assertCalcResult(calcAMP({ mode: 'k2', score: 38 }), 'AMP');
  });

  // BOOMER: 4 items, 0–4
  test('BOOMER', () => {
    assertCalcResult(calcBOOMER({ items: arr(4, 2) }), 'BOOMER');
  });

  // Barthel: 10 items, values must be valid options — 5 is valid for all items
  test('Barthel', () => {
    assertCalcResult(calcBarthel({ items: arr(10, 5) }), 'Barthel');
  });

  // SCIM: 19 items
  test('SCIM', () => {
    assertCalcResult(calcSCIM({ items: arr(19, 1) }), 'SCIM');
  });

  // FSS: 9 items, 1–7
  test('FSS', () => {
    assertCalcResult(calcFSS({ items: arr(9, 4) }), 'FSS');
  });

  // RPQ: 16 flat items (rpq3 = first 3, rpq13 = items 3–15), 0–4
  test('RPQ', () => {
    assertCalcResult(calcRPQ({ items: arr(16, 2) }), 'RPQ');
  });

  // PDQ8: 8 items
  test('PDQ8', () => {
    assertCalcResult(calcPDQ8({ items: arr(8, 2) }), 'PDQ8');
  });

  // ABC: 16 items, 0–100
  test('ABC', () => {
    assertCalcResult(calcABC({ items: arr(16, 70) }), 'ABC');
  });

  // BIVI: 15 items, 0–3
  test('BIVI', () => {
    assertCalcResult(calcBIVI({ items: arr(15, 2) }), 'BIVI');
  });

  // HADS: 14 items, 0–3
  test('HADS', () => {
    assertCalcResult(calcHADS({ items: arr(14, 1) }), 'HADS');
  });

  test('NPRS', () => {
    assertCalcResult(calcNPRS({ score: 4, context: 'current' }), 'NPRS');
  });

  test('PSFS', () => {
    assertCalcResult(
      calcPSFS({ activities: [{ name: 'Walking the dog', score: 6 }, { name: 'Stairs', score: 5 }] }),
      'PSFS'
    );
  });

  test('LEFS', () => {
    assertCalcResult(calcLEFS({ items: arr(20, 3) }), 'LEFS');
  });

  test('BPFS', () => {
    assertCalcResult(calcBPFS({ items: arr(12, 4) }), 'BPFS');
  });

  test('FAAM', () => {
    assertCalcResult(
      calcFAAM({ adl: arr(21, 4), sport: ['na', 4, 4, 3, 3, 4, 4, 4] }),
      'FAAM'
    );
  });

  test('CAIT', () => {
    assertCalcResult(
      calcCAIT({ items: CAIT_ITEMS.map(item => item.options[0].value) }),
      'CAIT'
    );
  });

  test('ATRS', () => {
    assertCalcResult(calcATRS({ items: arr(10, 8) }), 'ATRS');
  });

  test('FABQ', () => {
    assertCalcResult(calcFABQ({ items: arr(16, 3) }), 'FABQ');
  });

  test('OMAS', () => {
    assertCalcResult(
      calcOMAS({ items: OMAS_ITEMS.map(item => item.options[0].value) }),
      'OMAS'
    );
  });

  test('30STS', () => {
    assertCalcResult(calc30STS({ stands: 12, age: 70, gender: 'F' }), '30STS');
  });

  test('ACLSigns', () => {
    assertCalcResult(calcACLSigns({ fullExtension: true, effusionTraceToZero: true }), 'ACLSigns');
  });

  test('QuadLSI', () => {
    assertCalcResult(calcQuadLSI({ involved: 90, uninvolved: 100 }), 'QuadLSI');
  });

  test('HopBattery', () => {
    assertCalcResult(
      calcHopBattery({
        singleInv: 92,
        singleUninv: 100,
        tripleInv: 93,
        tripleUninv: 100,
        crossInv: 91,
        crossUninv: 100,
        timedInv: 5.2,
        timedUninv: 4.8,
      }),
      'HopBattery'
    );
  });

  test('LESS', () => {
    assertCalcResult(calcLESS({ errors: 4 }), 'LESS');
  });

  test('FTSTS', () => {
    assertCalcResult(calcFTSTS({ time: 11.8 }), 'FTSTS');
  });

  test('CMS', () => {
    assertCalcResult(
      calcCMS({
        pain: 12,
        adlWork: 4,
        adlRecreation: 3,
        adlSleep: 2,
        adlPositioning: 8,
        romFlexion: 8,
        romAbduction: 8,
        romER: 6,
        romIR: 6,
        strengthKg: 10,
      }),
      'CMS'
    );
  });

  test('HHS', () => {
    assertCalcResult(
      calcHHS({
        pain: 40,
        limp: 8,
        support: 7,
        distance: 8,
        stairs: 2,
        shoesSocks: 2,
        sitting: 5,
        transport: 1,
        deformity: {
          flexionContracture: true,
          adduction: true,
          internalRotation: true,
          legLength: true,
        },
        rom: {
          flexion: 100,
          abduction: 30,
          adduction: 20,
          externalRotation: 25,
          internalRotation: 25,
        },
      }),
      'HHS'
    );
  });
});
