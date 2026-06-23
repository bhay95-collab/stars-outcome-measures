# Design — RehabMetrics IQ

Last verified against the codebase: 2026-06-13

This is the single source of truth for visual language, tokens, component patterns, and accessibility. If a value here disagrees with any other document, **the `:root` block in `pages/app.js` (app) and `const styles` in `pages/index.js` (landing) are authoritative** — update this file to match them.

## Design intent

RehabMetrics IQ should feel calm, clinical, precise, trustworthy, and premium-but-restrained. The app is a **modern clinical intelligence dashboard with quiet premium styling** on a clean, clinical near-white field — colour reads as deliberate accents, never decoration.

Avoid: flashy SaaS styling, generic dashboards, browser-default forms, harsh edges, clutter, decorative UI without clinical purpose, and anything that makes the page feel "blue-washed."

## Brand

- Brand name is **RehabMetrics IQ** — one name. Never "RehabMetricsIQ", "Rehab Metrics IQ", or "RM IQ" (except the logo mark).
- Positioning: **Data-driven outcomes. Better patient care.**
- Tone: calm, precise, clinical, editorial, practical. No hype, no "revolutionary", no "AI-powered" unless actually implemented, no overpromising clinical impact.
- Logo: `LogoWordmark` component wherever the product name appears in navigation/header/sidebar; `public/SquareLogo.png` for favicon, emails, small marks. Wordmark blue is `#094B8A` (`#6FBDFF` "IQ" accent on dark backgrounds — fixed, must not follow the teal secondary token). The 3-bar data motif (`ThreeBarMotif`, `#094B8A` / `#3CACFF` / `#A9D6FF`) is a supporting motif only, never a logo replacement.

## Typography

- **App (`pages/app.js`):** `Geist` for all UI, `Geist Mono` for numeric clinical values/scores/compact data (tabular numerals are set on `body`), `Source Serif 4` for the editorial headings — the patient-name hero (`.patient-summary-card__intro h2`) and dashboard zone titles (`.dashboard-zone__head h2`).
- **Landing (`pages/index.js`):** `Inter` (body/UI) + `Source Serif 4` (hero/editorial headings), self-hosted via `next/font/local` from `assets/fonts/` for slow-connection performance.
- **Mobile:** system font stack via `mobile/src/theme` typography.
- No browser-default form typography; numeric clinical data must be easy to scan.

## App colour system (both platforms)

The app palette is the **deep-blue + warm-bone system**. Web tokens live in the `:root` block inside `globalStyles` in `pages/app.js`; mobile mirrors them in `mobile/src/theme/tokens.ts`.

> **Web/mobile field parity (2026-06):** the web working surface (`--color-bg` and the `raised`/`soft`/`muted`/`panel` neutrals) was cooled to a clinical near-white; mobile `tokens.ts` still holds the older warm-bone values. The exact old→new mapping to realign mobile in one pass is recorded in [`mobile/MOBILE.md`](mobile/MOBILE.md) (Platform deviations → "Theme — surface field"). The `--color-*` values in this doc are the web source of truth.

### Brand

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#094b8a` | Buttons, links, active nav |
| `--color-primary-dark` | `#063764` | Hover/pressed, dark panels |
| `--color-primary-soft` | `#f4f9ff` (web) / `#E9F3FF` (mobile) | Soft blue fills, selected states |
| `--color-primary-border` | `#bcd7f0` | Borders on blue-soft fills |
| `--color-sky` | `#3cacff` | **Decorative only** — focus rings, chart highlights, motif. Never text (fails contrast) |
| `--color-secondary` | `#1a857f` | Teal accent |
| `--color-secondary-soft` | `#eaf4f1` | Pale sage fill |
| `--color-sage` | `#7cb6b1` | Decorative bars, soft borders, 4th chart series |
| `--color-coral` | `#44605c` | Slate-green — **chart comparison series only** (legacy name; nothing coral-coloured exists) |
| `--color-violet` | `#7e90bc` | Periwinkle — neuro domain, 3rd chart series |

### Status — always use the full triplet (text / soft fill / border) from one family

| Status | Text | Soft fill | Border | Extra |
|---|---|---|---|---|
| Green — recorded / improvement / met threshold | `#2a6b4f` | `#e3efe5` | `#9dc4a9` | |
| Amber — missing baseline / due / caution | `#7a5d1e` | `#fff7d6` | `#e3cc83` | `--color-amber-strong #c9a13b` for small chromatic dots/icons |
| Red — decline / overdue / concern | `#a13b30` | `#f7e8e4` | `#dca293` | `--color-red-dark #7e2c24` for pressed destructive buttons |

**No orange anywhere in the clinical UI.** Former orange meant either caution (→ amber family) or concern (→ red family).

**Domain summary cards** (`.domain-card`) read calm: soft tonal fill + the tinted clinical number on a **neutral hairline** border — one colour signal, not a saturated coloured outline. The full triplet still applies to alert/badge contexts.

### Text and surfaces

| Token | Value | Token | Value |
|---|---|---|---|
| `--color-ink` | `#1c2b36` | `--color-bg` | `#f4f6f4` (clean clinical near-white page/screen — faint green-cool undertone; not beige, not blue-washed) |
| `--color-muted` | `#334b49` | `--color-surface` | `#ffffff` (cards) |
| `--color-subtle` | `#69787a` | `--color-surface-raised` / `--color-panel` | `#fbfcfb` |
| | | `--color-surface-soft` | `#eef2ef` |
| | | `--color-surface-muted` | `#e8ece9` |
| | | `--color-border` | `#d9dacb` / strong `#a4a896` |
| | | `--color-line` | `#e8e9dc` / strong `#dedfd1` |

Shadows are warm slate (`rgba(28,43,54, …)`), never blue. **Elevation:** card surfaces use `--elevation-rest` (inset top highlight + layered warm-slate ambient — the "machined" depth) and `--elevation-raised` for hover; the legacy `--shadow-card` is retired from cards (still defined for any future use). **Motion:** `--ease-premium` (`cubic-bezier(0.32,0.72,0,1)`) is the shared easing for hover and entrance. Radii: 4/6/10/14px + full. Shared content column: `--content-max: 1360px`, **centred** in the main area (`margin: 0 auto` on `.page-toolbar`, `.workspace-shell`/`.reports-workspace`, `.outcome-measures-workspace`, `.directory-stack`) so wide screens balance whitespace on both sides rather than left-pinning.

### Semantic rules

1. Blue fills are reserved for informational/interactive states (info notes, selected items, save status). Everything structural is warm neutral — if a screen feels blue, a blue surface was used where bone/white belongs.
2. Clinical threshold ramps (chart bands, interpretation colours) use the 4-step ramp in `lib/clinical/measures.js`: `#2A6B4F` (good) → `#8A6512` (caution, text-weight gold) → `#A13B30` (poor) → `#7E2C24` (severe).
3. Chart series order: 1st `#094B8A`, 2nd `#1A857F`, 3rd `#7E90BC`, 4th `#7CB6B1`, 5th `#3CACFF`; comparison/previous data `#44605C`; gridlines `#DEDFD1`; axis labels subtle.
4. ISNCSCI cell shading and AIS badge colours live in `components/FormISNCSCI.js` / `lib/clinical/isncsci.js` (NT `#EFF1F8`/`#8C9CC4`, 0 `#F7E8E4`/`#D98E80`, low `#FFF7D6`/`#DDBE5F`, mid `#E7F1EA`/`#79B08C`, full `#E3EFE5`/`#5E9E78`; AIS A `#A13B30`, B `#8A6512`, C `#5F6B2A`, D `#2A6B4F`, E `#094B8A`).
5. Colour carries meaning, never decoration. If a new semantic colour is required: add a named token, explain why, keep it clinically meaningful.

### Banned (the pre-2026 palettes — do not reintroduce)

The old navy/Tailwind system (`#1d5590`, `#0d9488` as app secondary, `#bbf7d0`/`#fde68a`/`#fecaca` status fills, blue-tinted surfaces like `#e8eef5`/`#f6f9fc`, slate `#64748b` comparison, Tailwind violet `#7c3aed`) and all orange/rust values (`#ee8a70`, `#b5451b`, `#c47b43` in app UI). Email HTML (`lib/followupEmail.js`) and PDFs (`lib/clinical/patientReportPdf.js`) use raw hex mirrors of the current tokens — keep them in sync when tokens change. **Deliberate divergence (2026-06):** the app working surface was cooled from the warm bone (`#f8f8f2` field / `#fbfbf7` raised / `#f6f6f0` soft) to the clinical near-white above; the email and PDF intentionally **retain the warmer bone** as patient-facing branded artifacts, so do not treat that as drift to "fix".

## Landing page system (`pages/index.js`)

The landing page is intentionally a **separate, self-contained token set** — editorial and public-facing, not the app dashboard:

`--navy: #236499`, `--navy-dark: #17496F`, `--ink: #111827`, `--muted: #4b5563`, `--soft: #f1f2f3`, `--line: #d4d8de`, `--mint: #0d9488`, `--coral: #ee896f`, `--violet: #8c83c8`, `--amber: #c47b43`, `--danger: #b42318`, plus warm surfaces.

Landing patterns to preserve: `.site-header`, `.hero`, `.hero__focus-blur`, `.hero__scrim`, `.hero__inner`, `.preview-card`, `.measure-strip`, `.workflow-layout`, `.image-panel`, `.clinical-band`, `.pricing-layout`, `.demo-modal`; clinical imagery with blur/scrim readability; pricing toggle; the 10MWT demo modal; SEO metadata and canonical URL. Do not turn the landing page into a dashboard or generic SaaS template.

## Styling rules

- All CSS lives in the existing page-level style blocks: `const styles` in `pages/index.js`, `const globalStyles` in `pages/app.js`. Self-contained components (e.g. `SubscriptionWall`) keep their own styles.
- **No Tailwind, no CSS modules, no styling libraries, no scattered inline styles.** Inline styles only for genuinely dynamic values (chart coordinates, progress widths, runtime clinical classification colours).
- Use existing tokens before adding any new value. Remove obsolete styles when replacing a section; do not sprinkle overrides at the bottom.
- For large visual changes: define the target first, update JSX and CSS together, avoid half-old/half-new UI.

### Class naming

Use existing systems: `app-*`, `patient-*`, `summary-*`, `domain-*`, `measure-*`, `pricing-*`, `preview-*`, `hero-*`, `image-panel*`. State and variants use data attributes (`data-active`, `data-tone`, `data-mcid`, `data-measure-panel`, `data-measure-layout`, `data-measure-nav`, `data-measure-form`, `data-measure-tabs`). Avoid one-off names, unclear abbreviations, and new classes when an existing pattern works.

### App patterns to preserve

`.app-shell`, `.app-sidebar`, `.app-nav`, `.app-main`, `.page-toolbar`, `.new-assessment-btn`, `.patient-summary-card`, `.summary-card`, `.summary-dashboard`, `.domain-grid`, `.domain-card`, `.patients-workspace`, `.patient-workspace-panel`, `.result-box`, `.modal`, `.modal-content`, and the `[data-measure-*]` attribute system. Sidebar-first app shell on desktop; patient overview as the main clinical landing state; do not revert to a top-header layout, plain document UI, or a generic form stack.

## Forms and inputs

- All inputs must look styled — no browser-default appearance. Use `.field-group`, `.field-label`, `.field-input`, `.input-narrow`, styled selects, and table inputs where clinically useful.
- Measure forms stay compact but readable; use the layout the measure clinically needs (table for 10MWT-style timing, cards/panels for questionnaires) — do not force every measure into one structure.
- Mobile questionnaires share `ScoreChipRow` (number-only chips), `ScaleKey`, `QuestionnaireItem`, and `QuestionnaireProgress` (`mobile/src/components/forms/fields/`) — reuse these for new questionnaires, never copy a form.

## Charts

Charts must answer "what changed, and does it matter?" Use clinically appropriate scales (no arbitrary maxima, no auto-scaling that hides meaning), label units, include threshold/MCID/reference context from the registry — never from component-local values — and visually distinguish current, previous, threshold, and MCID.

## Responsive

Check every visual change at desktop, tablet/narrow desktop, and mobile. Preserve: app sidebar collapse at narrow widths, stacked mobile app shell, clean landing grid collapse, readable cards, tables that don't break layout, scrollable modals.

## Accessibility

- Semantic buttons for actions, links for navigation — never clickable `<div>`s.
- Labels on all inputs; alt text on images; readable contrast; visible focus states; keyboard-accessible modals.
- Status/error states never rely on colour alone.
- Mobile: VoiceOver labels, minimum 44-point touch targets, reduced motion support, dynamic screen sizes.
- React Native styles use explicit variant maps, not computed/template-literal StyleSheet keys.
