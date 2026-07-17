# Mobile Outcome Measure Release Gates

Last updated: 2026-07-17

Mobile native support is now permission cautious. Do not add a gated measure to
`MOBILE_SUPPORTED_MEASURE_IDS` or the mobile assess dispatch until the evidence
below is documented in this repo.

## Currently gated

| Measure | Mobile state | Gate | Evidence required |
|---|---|---|---|
| `CSI` | Coming soon | Item wording permission pending | PRIDE Research Foundation or copyright-holder confirmation covering commercial clinician-facing mobile use. Keep patient-facing follow-up disabled unless that scope is explicit. |
| `KOOS` | Coming soon | Mapi/ePROVIDE permission and fee path | Permission/license evidence for commercial or health-care organization use, official electronic-use conditions, and official item-wording proofread. |
| `HOOS` | Coming soon | Mapi/ePROVIDE permission and fee path | Permission/license evidence for commercial or health-care organization use, official electronic-use conditions, and official item-wording proofread. |
| `HAGOS` | Coming soon | Author/ePROVIDE conditions and version proofread | Author or ePROVIDE conditions confirmation, chosen original or revised version, and official item-wording proofread. |

## Reference evidence to carry forward

- `CSI`: [Mayer et al. 2012](https://pubmed.ncbi.nlm.nih.gov/21951710/), [Neblett et al. 2013 cutoff paper](https://pubmed.ncbi.nlm.nih.gov/23490634/), [Neblett 2018 user manual](https://onlinelibrary.wiley.com/doi/10.1111/jabr.12123).
- `KOOS`: [Roos et al. 1998](https://pubmed.ncbi.nlm.nih.gov/9863983/), [Roos and Lohmander 2003](https://pubmed.ncbi.nlm.nih.gov/14613558/), [Mapi KOOS/HOOS/FAOS distribution note](https://www.mapi-trust.org/news-events/news/koos-hoos-and-faos).
- `HOOS`: [Nilsdotter et al. 2003](https://pubmed.ncbi.nlm.nih.gov/12777182/), [Paulsen et al. 2014](https://pubmed.ncbi.nlm.nih.gov/24286564/), [Mapi KOOS/HOOS/FAOS distribution note](https://www.mapi-trust.org/news-events/news/koos-hoos-and-faos).
- `HAGOS`: [Thorborg et al. 2011](https://pubmed.ncbi.nlm.nih.gov/21478502/), [HAGOS ePROVIDE listing](https://eprovide.mapi-trust.org/instruments/copenhagen-hip-and-groin-outcome-score).

## Release checklist

1. Save the permission/license evidence or written approval summary in this repo.
2. Confirm the exact official instrument version and item wording source.
3. Add the native form and `MEASURE_INSTRUCTIONS` entry with source-linked references.
4. Move the measure from gated coming-soon to `MOBILE_SUPPORTED_MEASURE_IDS`.
5. Update `mobile/__tests__/mobileMeasures.test.ts`, `mobile/__tests__/clinical-import.test.ts`, `mobile/MOBILE.md`, and `PRODUCT.md`.
