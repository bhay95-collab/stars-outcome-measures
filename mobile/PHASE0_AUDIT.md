# Phase 0 Measure Audit

Source of truth for `fieldSchema.ts` and `computeResult.ts`. All 23 active measures confirmed by direct code inspection of `lib/clinical/*.js`. ISNCSCI deferred.

**All 23 smoke tests pass** — see `__tests__/clinical-import.test.ts` + `jest.clinical.config.js`.

---

## Key: Input shape notations

- `number[]` — flat array required (not an object/map)
- Values must satisfy the range given or the calc returns `null`
- `items` is always a flat array for all item-based measures

---

## Performance Measures (15 active, ISNCSCI deferred)

---

### 10MWT — 10 Metre Walk Test

| Field | Detail |
|-------|--------|
| Registry key | `10MWT` |
| Category | performance |
| Calc function | `calc10mwt` in `lib/clinical/10mwt.js` |
| mcidKey | `10mwt-comfort` |

**Calc input shape:**
```js
{ comfortTime: number, fastTime: number, age: number, gender: 'male'|'female' }
```

**Calc output shape:**
```js
{ primaryValue: number,   // comfortable speed m/s
  primaryUnit: 'm/s',
  interpretation: string,
  meta: { comfortSpeed, fastSpeed, comfortClass, fastClass, comfortNorm, fastNorm } }
```

Field schema type: two `number` fields (`comfortTime`, `fastTime`) + `number` (age) + `select` (gender)
Capture tools: stopwatch (both time fields)
Item arrays: none

---

### TUG — Timed Up and Go

| Field | Detail |
|-------|--------|
| Registry key | `TUG` |
| Category | performance |
| Calc function | `calcTUG` in `lib/clinical/tug.js` |
| mcidKey | `tug` |

**Calc input shape:**
```js
{ time: number, fastTime: number|null, dualTime: number|null }
```

**Calc output shape:**
```js
{ primaryValue: number,  // comfortable TUG seconds
  primaryUnit: 'sec',
  interpretation: string,
  meta: { fastTime, dualTime, dualTaskCost } }
```

Field schema type: three `number` fields; `time` required, `fastTime`/`dualTime` optional
Capture tools: stopwatch (all three)
Item arrays: none

---

### FAC — Functional Ambulation Classification

| Field | Detail |
|-------|--------|
| Registry key | `FAC` |
| Category | performance |
| Calc function | `calcFAC` in `lib/clinical/fac.js` |
| mcidKey | none |

**Calc input shape:**
```js
{ level: number }  // integer 0–5
```

**Calc output shape:**
```js
{ primaryValue: number,  // FAC level 0–5
  primaryUnit: '/5',
  interpretation: string,
  meta: { color } }
```

Field schema type: `radio` (6 options: 0–5 with labels)
Capture tools: none
Item arrays: none

---

### 6MWT — 6 Minute Walk Test

| Field | Detail |
|-------|--------|
| Registry key | `6MWT` |
| Category | performance |
| Calc function | `calc6MWT` in `lib/clinical/sixmwt.js` |
| mcidKey | `6mwt` |

**Calc input shape:**
```js
{ distance: number, age: number, gender: 'male'|'female', height: number, weight: number }
```

**Calc output shape:**
```js
{ primaryValue: number,  // metres walked
  primaryUnit: 'm',
  interpretation: string,
  meta: { predicted, percentPredicted } }
```

Field schema type: `number` fields for distance/age/height/weight; `select` for gender
Capture tools: none (distance entered manually)
Item arrays: none

---

### BBS — Berg Balance Scale

| Field | Detail |
|-------|--------|
| Registry key | `BBS` |
| Category | performance |
| Calc function | `calcBBS` in `lib/clinical/bbs.js` |
| mcidKey | `bbs` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 14 scores, each 0–4
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /56
  primaryUnit: '/56',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (14 items × scale 0–4)
Item arrays: `BBS_ITEMS` — array of 14 label strings

---

### PASS — Postural Assessment Scale for Stroke

| Field | Detail |
|-------|--------|
| Registry key | `PASS` |
| Category | performance |
| Calc function | `calcPASS` in `lib/clinical/pass.js` |
| mcidKey | `pass` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 12 scores, each 0–3
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /36
  primaryUnit: '/36',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (12 items × scale 0–3)
Item arrays: `PASS_ITEMS` — array of 12 objects `{ label, options: [0,1,2,3] }`

---

### TIS — Trunk Impairment Scale

| Field | Detail |
|-------|--------|
| Registry key | `TIS` |
| Category | performance |
| Calc function | `calcTIS` in `lib/clinical/tis.js` |
| mcidKey | none |

**Calc input shape:**
```js
{ staticScore: number, dynamicScore: number, coordinationScore: number }
// staticScore 0–7, dynamicScore 0–10, coordinationScore 0–6
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /23
  primaryUnit: '/23',
  interpretation: string,
  meta: { staticScore, dynamicScore, coordinationScore, classColor } }
```

Field schema type: three `number` fields — NOT `itemsUniform`
Capture tools: none
Item arrays: none
**Discrepancy:** Plan initially described TIS as `itemsUniform`. Corrected: TIS takes three subscale totals, not item arrays.

---

### MAS — Motor Assessment Scale

| Field | Detail |
|-------|--------|
| Registry key | `MAS` |
| Category | performance |
| Calc function | `calcMAS` in `lib/clinical/mas.js` |
| mcidKey | `mas` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 8 scores, each 0–6
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /48
  primaryUnit: '/48',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (8 items × scale 0–6)
Item arrays: `MAS_ITEMS` — array of 8 objects `{ label, note }`

---

### COVS — Community Outcome Scale

| Field | Detail |
|-------|--------|
| Registry key | `COVS` |
| Category | performance |
| Calc function | `calcCOVS` in `lib/clinical/covs.js` |
| mcidKey | none |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 13 scores, each 1–7 (minimum is 1, not 0)
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /91
  primaryUnit: '/91',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (13 items × scale 1–7)
Item arrays: `COVS_ITEMS` — array of 13 label strings

---

### FGA — Functional Gait Assessment

| Field | Detail |
|-------|--------|
| Registry key | `FGA` |
| Category | performance |
| Calc function | `calcFGA` in `lib/clinical/fga.js` |
| mcidKey | `fga` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 10 scores, each 0–3
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /30
  primaryUnit: '/30',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (10 items × scale 0–3)
Item arrays: `FGA_ITEMS` — array of 10 objects `{ label, criteria }`

---

### HiMAT — High-Level Mobility Assessment Tool

| Field | Detail |
|-------|--------|
| Registry key | `HiMAT` |
| Category | performance |
| Calc function | `calcHiMAT` in `lib/clinical/himat.js` |
| mcidKey | `himat` |

**Calc input shape:**
```js
// Array of exactly 13 typed item objects, order matches HIMAT_ITEMS h0–h12
[
  { val: number } | { unable: true },        // h0–h6, h10, h12 — type 'time'
  { trials: [number, number, number] },      // h7–h8 — type 'dist' (cm, 3 trials)
  { mode: 'IND' } | { mode: 'DEP', val: n }, // h9, h11 — type 'dep'
]
```
- `time` items: `val` in seconds > 0, or `unable: true` → score 0
- `dist` items: exactly 3 positive trial values in cm; calc averages them
- `dep` items: `mode: 'IND'` → score 5; `mode: 'DEP'` + `val` (seconds) → time-scored

**Calc output shape:**
```js
{ primaryValue: number,  // total /54
  primaryUnit: '/54',
  interpretation: string,
  meta: { classColor, itemScores: number[] } }
```

Field schema type: `himatItems` (13 mixed-type items — deferred to Phase 4)
Item arrays: `HIMAT_ITEMS` — array of 13 objects `{ id, label, type, t, note }`
Capture tools: stopwatch (all `type: 'time'` items)

---

### SARA — Scale for the Assessment and Rating of Ataxia

| Field | Detail |
|-------|--------|
| Registry key | `SARA` |
| Category | performance |
| Calc function | `calcSARA` in `lib/clinical/sara.js` |
| mcidKey | `sara` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 8 scores
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /40
  primaryUnit: '/40',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (8 items × mixed scales per item)
Item arrays: `SARA_ITEMS` — array of 8 objects `{ label, options }`

---

### Step Test

| Field | Detail |
|-------|--------|
| Registry key | `Step` |
| Category | performance |
| Calc function | `calcStepTest` in `lib/clinical/steptest.js` |
| mcidKey | none |

**Calc input shape:**
```js
{ affectedSteps: number, nonAffectedSteps: number }  // integer counts in 15 seconds
```

**Calc output shape:**
```js
{ primaryValue: number,  // affected leg step count
  primaryUnit: 'steps',
  interpretation: string,
  meta: { nonAffectedSteps, stepRatio } }
```

Field schema type: two `number` fields
Capture tools: stepCounter (both fields)
Item arrays: none

---

### AMP — Amputee Mobility Predictor

| Field | Detail |
|-------|--------|
| Registry key | `AMP` |
| Category | performance |
| Calc function | `calcAMP` in `lib/clinical/amp.js` |
| mcidKey | none |

**Calc input shape:**
```js
{ mode: 'k0'|'k1'|'k2'|'k3'|'k4', score: number }
```

**Calc output shape:**
```js
{ primaryValue: number,  // total AMP score
  primaryUnit: 'pts',
  interpretation: string,
  meta: { mode, kLevel } }
```

Field schema type: `select` (mode/K-level) + `number` (score)
Capture tools: none
Item arrays: none

---

### BOOMER — Balance Outcome Measure for Elder Rehabilitation

| Field | Detail |
|-------|--------|
| Registry key | `BOOMER` |
| Category | performance |
| Calc function | `calcBOOMER` in `lib/clinical/boomer.js` |
| mcidKey | `boomer` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 4 scores, each 0–4
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /16
  primaryUnit: '/16',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (4 items × scale 0–4)
Item arrays: `BOOMER_ITEMS` — array of 4 objects `{ label, criteria, note }`

---

## Independence Measures (2)

---

### Barthel — Barthel Index

| Field | Detail |
|-------|--------|
| Registry key | `Barthel` |
| Category | independence |
| Calc function | `calcBarthel` in `lib/clinical/barthel.js` |
| mcidKey | `barthel` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 10 scores; each must be a valid option value
```
- Each item has specific allowed point values (e.g. 0/5/10 or 0/5/10/15)
- Returns `null` if any score is not in that item's `options` array

**Calc output shape:**
```js
{ primaryValue: number,  // total /100
  primaryUnit: '/100',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsDefined` (10 items, each with specific point-value options)
Item arrays: `BARTHEL_ITEMS` — array of 10 objects `{ label, options: number[] }`

---

### SCIM — Spinal Cord Independence Measure III

| Field | Detail |
|-------|--------|
| Registry key | `SCIM` |
| Category | independence |
| Calc function | `calcSCIM` in `lib/clinical/scim.js` |
| mcidKey | `scim` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 19 scores
```
- Three subscales: Self-care (SC /20), Respiration & Sphincters (RS /36), Mobility (MOB /40)
- Each item has specific option values in `SCIM_ITEMS[i].opts`

**Calc output shape:**
```js
{ primaryValue: number,  // total /100
  primaryUnit: '/100',
  interpretation: string,
  meta: { sc, rs, mob, classColor } }
```

Field schema type: `itemsDefined` (19 items, each with specific option values)
Item arrays: `SCIM_ITEMS` — array of 19 objects `{ sub, label, max, opts: [{v, t}] }`

---

## Questionnaire Measures (6)

---

### FSS — Fatigue Severity Scale

| Field | Detail |
|-------|--------|
| Registry key | `FSS` |
| Category | questionnaire |
| Calc function | `calcFSS` in `lib/clinical/fss.js` |
| mcidKey | `fss` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 9 scores, each 1–7 (minimum is 1, not 0)
```

**Calc output shape:**
```js
{ primaryValue: number,  // mean score to 1 decimal
  primaryUnit: '/7',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (9 items × scale 1–7)
Item arrays: `FSS_ITEMS` — array of 9 label strings

---

### RPQ — Rivermead Post-Concussion Questionnaire

| Field | Detail |
|-------|--------|
| Registry key | `RPQ` |
| Category | questionnaire |
| Calc function | `calcRPQ` in `lib/clinical/rpq.js` |
| mcidKey | none |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 16 scores, each 0–4
// items[0–2] = RPQ-3 subscale; items[3–15] = RPQ-13 subscale
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /64
  primaryUnit: '/64',
  interpretation: string,
  meta: { rpq3, rpq13, classColor } }
```

Field schema type: `itemsUniform` (16 items × scale 0–4, grouped visually into RPQ-3 + RPQ-13)
Item arrays: `RPQ_ITEMS` — `{ rpq3: string[3], rpq13: string[13] }` (grouped for display only; calc takes flat array)

---

### PDQ8 — Parkinson's Disease Questionnaire 8

| Field | Detail |
|-------|--------|
| Registry key | `PDQ8` |
| Category | questionnaire |
| Calc function | `calcPDQ8` in `lib/clinical/pdq8.js` |
| mcidKey | `pdq8` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 8 scores, each 0–4
```

**Calc output shape:**
```js
{ primaryValue: number,  // summary index (SI) as 0–100 percentage
  primaryUnit: 'SI',
  interpretation: string,
  meta: { classColor, rawSum } }
```

Field schema type: `itemsUniform` (8 items × scale 0–4)
Item arrays: `PDQ8_ITEMS` — 8 label strings; `PDQ8_OPTIONS` — 5 option objects `{ value, label }`

---

### ABC — Activities-specific Balance Confidence Scale

| Field | Detail |
|-------|--------|
| Registry key | `ABC` |
| Category | questionnaire |
| Calc function | `calcABC` in `lib/clinical/abc.js` |
| mcidKey | `abc` |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 16 scores, each 0–100
```

**Calc output shape:**
```js
{ primaryValue: number,  // mean percentage to 1 decimal
  primaryUnit: '%',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `abcItems` (16 items × 0–100% numeric input)
Item arrays: `ABC_ITEMS` — array of 16 objects `{ label }`

---

### BIVI — Brain Injury Vision Inventory

| Field | Detail |
|-------|--------|
| Registry key | `BIVI` |
| Category | questionnaire |
| Calc function | `calcBIVI` in `lib/clinical/bivi.js` |
| mcidKey | none |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 15 scores, each 0–3
```

**Calc output shape:**
```js
{ primaryValue: number,  // total /45
  primaryUnit: '/45',
  interpretation: string,
  meta: { classColor } }
```

Field schema type: `itemsUniform` (15 items × scale 0–3)
Item arrays: `BIVI_ITEMS` — array of 15 label strings

---

### HADS — Hospital Anxiety and Depression Scale

| Field | Detail |
|-------|--------|
| Registry key | `HADS` |
| Category | questionnaire |
| Calc function | `calcHADS` in `lib/clinical/hads.js` |
| mcidKey | `null` in registry (see discrepancy) |

**Calc input shape:**
```js
{ items: number[] }  // flat array of exactly 14 scores, each 0–3
// Odd-indexed (0,2,4,6,8,10,12) → Anxiety subscale
// Even-indexed (1,3,5,7,9,11,13) → Depression subscale
```

**Calc output shape:**
```js
{ primaryValue: number,  // Anxiety subscale score /21
  primaryUnit: '/21',
  interpretation: string,
  meta: { anxietyScore, depressionScore, anxietyClass, depressionClass } }
```

Field schema type: `itemsUniform` (14 items × scale 0–3, interleaved anxiety/depression)
Item arrays: `HADS_ITEMS` — array of 14 objects `{ text, subscale: 'A'|'D' }`

---

## Summary Table

| Registry Key | Category | Items | Input type | mcidKey | Capture |
|---|---|---|---|---|---|
| `10MWT` | performance | — | number fields + selects | `10mwt-comfort` | stopwatch |
| `TUG` | performance | — | time, fastTime?, dualTime? | `tug` | stopwatch |
| `FAC` | performance | — | level 0–5 (radio) | none | — |
| `6MWT` | performance | — | distance, age, gender, height, weight | `6mwt` | — |
| `BBS` | performance | 14 × 0–4 | `itemsUniform` | `bbs` | — |
| `PASS` | performance | 12 × 0–3 | `itemsUniform` | `pass` | — |
| `TIS` | performance | — | staticScore, dynamicScore, coordinationScore | none | — |
| `MAS` | performance | 8 × 0–6 | `itemsUniform` | `mas` | — |
| `COVS` | performance | 13 × 1–7 | `itemsUniform` | none | — |
| `FGA` | performance | 10 × 0–3 | `itemsUniform` | `fga` | — |
| `HiMAT` | performance | 13 mixed | `himatItems` (Phase 4) | `himat` | stopwatch |
| `SARA` | performance | 8 × mixed | `itemsUniform` | `sara` | — |
| `Step` | performance | — | affectedSteps, nonAffectedSteps | none | stepCounter |
| `AMP` | performance | — | mode (select) + score (number) | none | — |
| `BOOMER` | performance | 4 × 0–4 | `itemsUniform` | `boomer` | — |
| `Barthel` | independence | 10 × specific options | `itemsDefined` | `barthel` | — |
| `SCIM` | independence | 19 × specific options | `itemsDefined` | `scim` | — |
| `FSS` | questionnaire | 9 × 1–7 | `itemsUniform` | `fss` | — |
| `RPQ` | questionnaire | 16 × 0–4 (flat) | `itemsUniform` | none | — |
| `PDQ8` | questionnaire | 8 × 0–4 | `itemsUniform` | `pdq8` | — |
| `ABC` | questionnaire | 16 × 0–100 | `abcItems` | `abc` | — |
| `BIVI` | questionnaire | 15 × 0–3 | `itemsUniform` | none | — |
| `HADS` | questionnaire | 14 × 0–3 | `itemsUniform` | null (badge hidden) | — |

---

## Discrepancies Found

1. **TIS** — plan described as `itemsUniform`. Confirmed: TIS takes three subscale number totals (`staticScore`, `dynamicScore`, `coordinationScore`), not an items array. Field schema must use three `number` fields.

2. **HADS mcidKey** — registry has `mcidKey: null`, but `MCID_VALS` in `mcid.js` contains `hads-a` and `hads-d` entries. Resolution: treat as no MCID — hide `McidBadge`. The `MCID_VALS` entries are unreachable without a registry mcidKey.

3. **COVS min value** — items scored 1–7, not 0–7. `calcCOVS` rejects scores < 1. Field schema must enforce minimum of 1.

4. **FSS min value** — items scored 1–7, not 0–7. Same constraint as COVS.

5. **BIVI item count** — 15 items, not 10.

6. **MAS item count** — 8 items, not 5.

7. **COVS item count** — 13 items, not 10.

8. **BOOMER item count** — 4 items, not 8.

9. **RPQ item structure** — `RPQ_ITEMS` export is `{ rpq3: string[], rpq13: string[] }` for display grouping, but `calcRPQ` takes a flat 16-item array. Field schema must pass flat array to calc and apply RPQ-3/RPQ-13 grouping for display only.

10. **FSS mcidKey** — audit initially stated `none`. Confirmed incorrect. `measures.js` line 321: `mcidKey: 'fss'`. `MCID_VALS` line 20: `'fss': { thresh: 17.0, unit: 'pts', hib: false }`. Both registry and MCID_VALS are consistent. FSS **does** have MCID support — `McidBadge` must be shown. Audit corrected.

---

*Audit produced: 2026-05-07. Gate: pending user sign-off before Phase 1 begins.*
