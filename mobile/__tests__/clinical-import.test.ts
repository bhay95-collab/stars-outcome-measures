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

describe('Phase 0 — clinical calc smoke tests (23 active measures)', () => {
  test('10MWT', () => {
    assertCalcResult(calc10mwt({ comfortTime: 10, fastTime: 8, age: 60, gender: 'male' }), '10MWT');
  });

  test('TUG', () => {
    assertCalcResult(calcTUG({ time: 12, fastTime: null, dualTime: null }), 'TUG');
  });

  test('FAC', () => {
    assertCalcResult(calcFAC({ level: 3 }), 'FAC');
  });

  test('6MWT', () => {
    assertCalcResult(
      calc6MWT({ distance: 400, age: 65, gender: 'female', height: 165, weight: 70 }),
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
});
