# Design Handoff — Colour System Redesign (Web → Mobile)

This document describes the colour redesign applied to the **web app** (`pages/app.js`,
`components/`, `lib/clinical/`) so the same system can be applied to the **mobile app**
(`/mobile`). Follow it exactly — do not invent new colours.

> **Status: applied to both platforms.** The mobile app was migrated against this
> document (see `mobile/src/theme/tokens.ts`). Implementation notes from that pass:
> `primarySoft` is `#E9F3FF` on mobile (see §3), the wordmark "IQ" accent is fixed
> `#6FBDFF` in `LogoWordmark.tsx` (matching web — it must not follow the teal
> `secondary` token), and `Screen.tsx` now uses the `bg` token as the default
> screen background.

---

## 1. Design intent

The previous palette mixed cool Tailwind greys, a saturated Tailwind violet (`#7c3aed`),
neon-mint green fills (`#bbf7d0`), golden-yellow amber (`#fde68a`), rose-red (`#fecaca`)
and several rust/orange one-offs (`#b5451b`, `#d77a35`, `#a25722`, `#ee8a70`). The result
was jarring status colours and a "blue-washed" feel on every screen.

The new system is anchored to three reference palettes the product owner approved:

- **Highlight**: `#094B8A` deep blue · `#3CACFF` sky · `#F1F1E6` bone · `#FFF7D6` cream
- **Neighbor**: `#094B8A` · `#7CB6B1` sage · `#1A857F` teal · `#334B49` dark slate-green
- **Discreet**: `#094B8A` · `#7E90BC` periwinkle · `#F4F9FF` pale blue · `#FFF7D6` cream

Principles applied:

1. **Blue stays primary** but is consolidated to a single family: `#094B8A` (primary),
   `#063764` (dark), `#3CACFF` (sky accent), `#F4F9FF` (soft fill), `#BCD7F0` (border).
   All other blues (`#236499`, `#17496F`, `#1d5590`, `#7FB3E6`, blue-tinted greys) were removed.
2. **Surfaces went warm**: the page background is now bone `#F1F1E6` with warm off-white
   raised surfaces and warm-grey borders. This is what kills the blue-wash — colour now
   reads as deliberate accents on a calm warm-neutral field, instead of blue-on-blue.
3. **Status colours are muted and warm**, derived from the cream/sage corner of the
   palettes — clearly distinguishable (green / amber / red) but no longer fluorescent.
   There is **no orange anywhere**; former orange/rust values map to either the golden
   amber family or the brick red family depending on their meaning.
4. **Violet became periwinkle** `#7E90BC` (neuro domain, 3rd chart series) — it sits
   between the blues instead of fighting them.
5. **Teal/sage** (`#1A857F` / `#7CB6B1`) are the secondary accent family for positive,
   non-status decoration and chart series.
6. **Text carries a quiet green-slate undertone** (`#334B49` from the Neighbor palette
   for secondary text) instead of pure cool grey.

---

## 2. The new token values (source of truth)

These are now defined in `pages/app.js` `:root` (web). Map them onto
`mobile/src/theme/tokens.ts`.

### Brand

| Token | Value | Use |
|---|---|---|
| primary | `#094B8A` | Buttons, links, active nav, headings accents |
| primaryDark | `#063764` | Hover/pressed, dark panels |
| primarySoft | `#F4F9FF` | Soft blue fills (info panels, selected states) |
| primaryBorder | `#BCD7F0` | Borders on blue-soft fills |
| sky | `#3CACFF` | Accent only — focus rings, chart highlight series, motif. Never body text (fails contrast) |
| secondary | `#1A857F` | Teal accent, conic charts, secondary emphasis |
| secondarySoft | `#EAF4F1` | Pale sage fill |
| sage | `#7CB6B1` | Decorative bars, 4th chart series, soft borders |
| violet | `#7E90BC` | Periwinkle — neuro domain tone, 3rd chart series |
| coral (renamed in spirit: comparison) | `#44605C` | Slate-green — chart comparison series ONLY (replaces old slate `#64748b`; nothing coral-coloured remains) |

### Status (always use the full triplet: text / soft fill / border)

| Status | Text | Soft fill | Border | Extra |
|---|---|---|---|---|
| Green (recorded / improvement / met threshold) | `#2A6B4F` | `#E3EFE5` | `#9DC4A9` | |
| Amber (missing baseline / due / caution) | `#7A5D1E` | `#FFF7D6` | `#E3CC83` | `amberStrong #C9A13B` for small chromatic dots/icons where the border value is too pale |
| Red (decline / overdue / concern) | `#A13B30` | `#F7E8E4` | `#DCA293` | `redDark #7E2C24` for pressed/hover on destructive buttons |

### Text

| Token | Value |
|---|---|
| ink | `#1C2B36` |
| muted | `#334B49` |
| subtle | `#69787A` |

### Surfaces (warm bone — this is the de-blue-washing move)

| Token | Value | Use |
|---|---|---|
| bg | `#F8F8F2` | Page/screen background (lightened from #F1F1E6 after review — near-white warm neutral) |
| surface | `#FFFFFF` | Cards |
| surfaceRaised | `#FBFBF7` | Nested panels |
| surfaceSoft | `#F6F6F0` | Soft wells, hover rows |
| surfaceMuted | `#EFEFE6` | Progress track backgrounds, disabled fills |
| border | `#D9DACB` | Default border |
| borderStrong | `#A4A896` | Emphasised border |
| line | `#E8E9DC` | Hairlines |
| lineStrong | `#DEDFD1` | Chart gridlines, dividers |

### Shadows

Shadow colour base is warm slate `rgb(28,43,54)` (web uses
`rgba(28,43,54,0.04–0.10)`). On mobile, change `shadowColor` from `#17496F`
to `#1C2B36` and keep existing opacities.

---

## 3. Exact mapping for `mobile/src/theme/tokens.ts`

Replace the `colors` object values as follows (keep the keys):

```ts
export const colors = {
  primary:       '#094B8A',
  primaryDark:   '#063764',
  primarySoft:   '#E9F3FF',  // stronger than web's #F4F9FF — mobile selected rows often have no border
  actionBlue:    '#094B8A',
  secondary:     '#1A857F',  // was light blue #7FB3E6 — now teal accent
  secondarySoft: '#EAF4F1',
  success:       '#2A6B4F',
  coral:         '#A13B30',  // key is legacy-named; it is the ERROR colour — now brick red, not orange
  amber:         '#7A5D1E',
  violet:        '#7E90BC',
  ink:           '#1C2B36',
  muted:         '#334B49',
  subtle:        '#69787A',
  surface:       '#FFFFFF',
  surfaceSoft:   '#F6F6F0',  // was blue-tinted #F6F9FC
  panel:         '#FBFBF7',  // was blue-tinted #F8FBFE
  border:        '#D9DACB',  // was blue #D9E6F2
  successSoft:   '#E3EFE5',
  successBorder: '#9DC4A9',
  amberSoft:     '#FFF7D6',
  amberBorder:   '#E3CC83',
  dangerSoft:    '#F7E8E4',
  dangerBorder:  '#DCA293',
} as const;
```

Notes:
- If a screen background token exists (or screens hardcode a background), use
  `#F8F8F2` for screen backgrounds, white for cards.
- `shadows.sm/md.shadowColor`: `#17496F` → `#1C2B36`.
- Consider adding `sky: '#3CACFF'`, `sage: '#7CB6B1'`, `amberStrong: '#C9A13B'`,
  `redDark: '#7E2C24'`, `primaryBorder: '#BCD7F0'`, `surfaceMuted: '#EFEFE6'` if any
  screen needs them (web added these as new tokens).

---

## 4. Hardcoded colours in mobile that must be swept

`grep -rnE "#[0-9a-fA-F]{3,8}" mobile/src --include=*.tsx --include=*.ts` (excluding
`theme/tokens.ts`) currently finds these. Replace per the mapping:

| Old value | Where | Replace with |
|---|---|---|
| `#a05c00` (×11) | form screens (HiMAT, BOOMER, StepTest, PASS, MAS, FGA, COVS, BBS…) — caution/amber text | `colors.amber` (`#7A5D1E`) |
| `#b5451b` (×2) | rust/orange threshold text | `#A13B30` (concern) — use `colors.coral`/error token |
| `#17496F` (×3) | NavyHeader etc. | `colors.primaryDark` (`#063764`) |
| `#236499` (×2) | brand blue | `colors.primary` (`#094B8A`) |
| `#9BC7F2`, `#DCEEFF` | ThreeBarMotif light bars | `#A9D6FF`, `#D6EDFF` (motif: dark `#094B8A`, mid `#3CACFF`) |
| `#EAF3FB` | pale blue fill | `colors.primarySoft` (`#F4F9FF`) |
| `#ee8a70` | old coral error | `#A13B30` |
| `#8b82c6` | old violet | `#7E90BC` |
| `#8a96a3` | subtle text | `colors.subtle` (`#69787A`) |
| `#f2faf5` / `#c5e6d2` / `#EBF6EB` | old success fills | `#E3EFE5` / `#9DC4A9` |
| `#fef9ef` / `#f0d9a8` | old amber fills | `#FFF7D6` / `#E3CC83` |
| `#fef7f5` / `#edcabb` | old danger fills | `#F7E8E4` / `#DCA293` |
| `#F6F9FC`, `#F8FBFE`, `#D9E6F2` | blue-tinted surfaces/borders | `#F5F5EB`, `#FAFAF3`, `#D9DACB` |

Also sweep `rgba(...)` values: any rgba built from old blues
(`rgba(35,100,153,…)` = #236499, `rgba(23,73,111,…)` = #17496F,
`rgba(127,179,230,…)` = #7FB3E6) → rebuild from the new family
(`rgba(9,75,138,…)`, `rgba(6,55,100,…)`, `rgba(96,176,250,…)`).
Shadow/overlay rgbas based on `rgba(17,24,39,…)` or `rgba(21,34,56,…)` → `rgba(28,43,54,…)`.

---

## 5. Semantic rules (apply, don't just find-and-replace)

1. **Status always uses the triplet** (text + soft fill + border) from one family. Never
   pair, e.g., amber text on a green fill.
2. **No orange.** Former orange meant one of two things — decide per call-site:
   - caution/mid-range → amber family
   - poor/concern → red family (`#A13B30`)
3. **Clinical threshold ramps** (e.g. chart reference bands, measure interpretation
   colours) use this 4-step ramp, matching web `lib/clinical/measures.js`:
   `#2A6B4F` (good) → `#8A6512` (caution, deep gold — text-weight contexts) →
   `#A13B30` (poor) → `#7E2C24` (severe).
   Note `#8A6512` is the *text/line-weight* amber for small/typographic use; `#7A5D1E`
   is the amber for text on cream fills. Both are in the same family.
4. **Chart series order**: 1st `#094B8A`, 2nd `#1A857F`, 3rd `#7E90BC`, 4th `#7CB6B1`,
   5th `#3CACFF`. Comparison/previous-period data: `#44605C` slate-green.
   Gridlines `#DEDFD1`, axis labels `subtle`.
5. **Sky `#3CACFF` is decorative only** — never use it for text or as the only carrier
   of meaning (insufficient contrast on light surfaces).
6. **Blue fills are reserved** for informational/interactive states (info notes, selected
   items, save status). Everything structural is warm neutral. If a screen feels blue,
   you've used a blue surface where a bone/white one belongs.
7. **ISNCSCI cell shading** (if/when on mobile) uses the web mapping in
   `components/FormISNCSCI.js`: NT `#EFF1F8`/`#8C9CC4`, empty-motor `#EFF6FD`/`#B7D3EE`,
   0 `#F7E8E4`/`#D98E80`, low `#FFF7D6`/`#DDBE5F`, mid `#E7F1EA`/`#79B08C`,
   full `#E3EFE5`/`#5E9E78`. AIS badge colours:
   A `#A13B30`, B `#8A6512`, C `#5F6B2A`, D `#2A6B4F`, E `#094B8A`.
8. **Logo/motif**: wordmark blue is `#094B8A` (`#6FBDFF` on dark backgrounds); three-bar
   motif is `#094B8A` / `#3CACFF` / `#A9D6FF`.

---

## 6. What was changed on web (for reference)

- `pages/app.js` — `:root` token block fully replaced; all hardcoded hexes
  (trial badge, info panel, follow-up attention panels, signal list tones, neuro tone,
  domain-card red tone, skeletons, chart gridlines, mini-progress, letter/insight/pathway
  card borders) now use tokens; blue rgba families rebased.
- `components/SummaryTab.js` — trend chart series colours.
- `components/SubscriptionWall.js` — whole blue + grey system rebased (it has its own
  self-contained styles).
- `components/FormISNCSCI.js` + `lib/clinical/isncsci.js` — cell-state and AIS colours
  (values only, no logic).
- `components/WheelchairPrescriptionTool.js` — notes, readiness/risk dots, borders.
- `components/ProfileModal.js`, `components/FormSCIM.js`, `components/AuthGateway.js`,
  `components/ThreeBarMotif.js`, `components/LogoWordmark.js`.
- `lib/clinical/measures.js` — threshold reference colours (ramp above).
- `lib/clinical/patientReportPdf.js` — PDF brand/status colours (pdf-lib `rgb()` floats).
- `lib/followupEmail.js` — email HTML colours (raw hex; CSS vars don't work in email).

## 7. Verification checklist for mobile

- [ ] No remaining hex from the "old value" column (grep the list in §4).
- [ ] Screens sit on bone `#F1F1E6`, cards white — nothing blue-tinted structurally.
- [ ] Status chips/banners use the new triplets; green/amber/red clearly distinguishable.
- [ ] No orange renders anywhere (search rendered screens for rust/orange).
- [ ] Charts use the series order in §5.4.
- [ ] Run the mobile test suites (`jest.clinical.config.js` + `__tests__`) — colour
  changes must not touch clinical logic.
