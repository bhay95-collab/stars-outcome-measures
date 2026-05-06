# RehabMetrics IQ — Claude Code Instructions

## Project Identity

RehabMetrics IQ is a clinical SaaS product for physiotherapists and rehabilitation teams.

Core positioning:

**Data-driven outcomes. Better patient care.**

The product helps clinicians capture, score, interpret, track, and report rehabilitation outcome measures with less manual work and clearer clinical insight.

This is not a generic startup dashboard.

It should feel:
- calm
- clinical
- precise
- trustworthy
- modern
- structured
- premium but restrained

Avoid:
- flashy SaaS styling
- exaggerated marketing language
- generic dashboards
- harsh edges
- browser-default forms
- cluttered layouts
- decorative UI without clinical purpose

---

## User Context

Ben is not a developer.

Claude Code writes and edits the code.

When explaining work:
- Be specific
- Use plain English
- Say exactly which file changed
- Say exactly what section changed
- Say why the change was needed
- Avoid technical theory unless asked
- Provide copy/paste instructions when useful

---

## Development Workflow

For any multi-step change, start with:

```text
/plan
```

The plan must include:

1. Goal
2. Files to edit
3. Constraints
4. Current UI patterns to preserve
5. Data, auth, payment, or clinical logic affected
6. What will NOT be touched
7. Verification steps

Do not write code during the plan.

Wait for approval before major edits.

After changes:
- Run `/code-review`
- For visual changes, use Playwright to open the page and check it renders correctly
- For auth, payment, subscription, Supabase, or sensitive data changes, run `/security-review`
- If code becomes bloated, run `/simplify`
- If adding meaningful clinical functionality, consider `/tdd`
- If unsure about a current library/API, use `context7`

---

## Project Stack

Main stack:
- Next.js pages router
- React with hooks
- Supabase auth/database
- Stripe payments/subscriptions
- lucide-react icons
- Plain CSS inside page-level style blocks
- No Tailwind
- No CSS modules

Main files:
- `pages/index.js` — public landing page
- `pages/app.js` — authenticated clinical app/dashboard
- `components/` — reusable UI components
- `lib/supabase.js` — Supabase client
- `lib/stripe.js` — Stripe helpers
- `lib/clinical/` — clinical scoring, interpretation, registry, reports

---

## File Scope Rules

### Landing page work

Edit:

`pages/index.js`

The landing page currently includes:
- public hero
- background clinical imagery
- blur/scrim overlay
- product preview card
- measure strip
- workflow section
- clinical image band
- pricing section
- FAQ
- interactive 10MWT demo modal
- SEO metadata and canonical URL

Preserve:
- public marketing purpose
- redirect authenticated users to `/app`
- signup/login routes
- pricing toggle
- demo modal
- SEO metadata
- responsive layout

### App/dashboard work

Edit:

`pages/app.js`

The authenticated app currently includes:
- subscription gate
- app shell
- persistent sidebar navigation
- patient workspace
- patient overview
- new assessment workflow
- patient summary dashboard
- profile modal
- new patient modal
- assessment dirty-state warning
- PDF export
- Supabase-backed patient and assessment state

Preserve:
- auth/session handling
- subscription/trial access logic
- patient selection flow
- assessment sorting by newest first
- unsaved assessment warning
- report export
- responsive sidebar behaviour

### Component work

Edit files in:

`components/`

Use components for display and workflow UI.

Do not put clinical calculation logic inside components.

### Clinical logic work

Edit files in:

`lib/clinical/`

Use this area for:
- outcome measure scoring
- MCID logic
- threshold logic
- interpretation text
- chart configuration
- patient report generation

---

## Brand Rules

Brand name:

**RehabMetrics IQ**

Use as one name.

Do not write:
- RehabMetricsIQ
- Rehab Metrics IQ
- RehabMetrics + IQ badge
- RM IQ unless referring to the logo mark only

Primary positioning:

**Data-driven outcomes. Better patient care.**

Tone:
- calm
- precise
- clinical
- trustworthy
- editorial
- practical

Avoid:
- hype
- "revolutionary"
- "game-changing"
- "AI-powered" unless actually implemented
- vague claims
- overpromising clinical impact

---

## Logo Rules

Logo assets:
- Square logo: `public/SquareLogo.png`
- Wordmark component: `LogoWordmark`

Use `LogoWordmark` where the product name is shown in navigation/header/sidebar.

Use `SquareLogo.png` for:
- favicon
- email templates
- small brand mark
- app/profile contexts when needed

The 3-bar data motif may be used as a supporting visual/data motif only.

It must not replace the primary logo.

---

## Current Visual Direction

The current UI has moved away from the older strict "clinical document only" interface.

The current direction is:

**Modern clinical intelligence dashboard with quiet premium styling.**

It should combine:
- clinical clarity
- soft dashboard surfaces
- strong information hierarchy
- restrained gradients
- translucent panels where already established
- rounded cards
- soft shadows
- clear data presentation
- high readability
- minimal visual noise

It should not revert to the old rigid document-only system.

---

## Landing Page Visual System

The landing page should feel editorial, clinical, and public-facing.

Preserve these patterns:
- large calm hero
- clinical rehabilitation imagery
- left-side hero readability through blur/scrim
- `Source Serif 4` for major landing-page hero typography
- `Inter` for interface and body text
- soft cards
- product preview card
- measure pills
- calm clinical photography
- restrained navy/mint/coral accents
- generous spacing
- responsive grid layout

Landing page CSS lives in:

`pages/index.js`

Inside:

`const styles = \`...\``

Landing tokens currently include:

```css
--navy: #173d68;
--navy-dark: #102947;
--ink: #172238;
--muted: #566271;
--soft: #eef3f8;
--line: #d7e0e8;
--mint: #77c7bd;
--coral: #ee896f;
--violet: #8c83c8;
--amber: #c47b43;
--danger: #b42318;
--shadow: 0 18px 36px rgba(23, 38, 59, 0.18);
```

When changing landing visuals:
- use existing tokens first
- do not introduce random colours
- do not remove clinical imagery unless replacing with equivalent clinical imagery
- keep the page calm and credible
- keep CTA buttons clear
- keep demo modal functional
- preserve mobile behaviour

---

## App Visual System

The authenticated app uses a modern app-shell layout.

Preserve these core patterns:
- `.app-shell`
- `.app-sidebar`
- `.app-main`
- `.page-toolbar`
- `.patient-summary-card`
- `.summary-card`
- `.patient-directory-card`
- `.patient-workspace-panel`
- `.domain-card`
- `.result-box`
- `[data-measure-panel]`
- `[data-measure-layout]`
- `[data-measure-nav]`
- `[data-measure-form]`
- `[data-measure-tabs]`

The app should feel like a clinical dashboard, not a plain HTML form.

Dashboard visual traits:
- pale blue/white background
- soft radial/linear background accents
- glass-like white panels where already used
- subtle borders
- soft shadows
- 8–16px radii
- clear left navigation
- strong page title
- card-based clinical summaries
- colour used for meaning, not decoration
- charts with clinical context
- no harsh rectangular blocks

App global styles live in:

`pages/app.js`

Inside:

`const globalStyles = \`...\``

The current app visual direction uses these effective tokens:

```css
--color-primary: #173d68;
--color-primary-dark: #102947;
--color-primary-soft: #e8f1fb;
--color-secondary: #78c8bd;
--color-secondary-soft: #e4f6f3;
--color-coral: #ee8a70;
--color-violet: #8b82c6;
--color-ink: #152238;
--color-muted: #5b6674;
--color-subtle: #8a96a3;
--color-surface: #FFFFFF;
--color-surface-soft: #eff4f9;
--color-panel: #f7fafc;
--color-border: #d8e1ea;
--shadow-sm: 0 6px 18px rgba(21,34,56,0.08);
--shadow-md: 0 18px 42px rgba(21,34,56,0.12);
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 16px;
```

Use these tokens before adding any new value.

If a new semantic colour is required:
- add a named token
- explain why
- keep it clinically meaningful

Examples:
- improvement / safe / met threshold
- amber caution
- red concern / decline
- neutral inactive state

---

## Class Naming Rules

Do not use the old rule that only a tiny set of class names is allowed.

That rule is obsolete.

Use existing class systems and naming patterns.

Allowed patterns:
- `app-*`
- `patient-*`
- `summary-*`
- `domain-*`
- `measure-*`
- `pricing-*`
- `preview-*`
- `hero-*`
- `image-panel*`
- `data-*` attributes for state, tone, and behaviour

Prefer:
- reusable class names
- semantic names
- names tied to actual UI structure

Avoid:
- random one-off names
- unclear abbreviations
- `np-*`
- `mwt-*` unless scoped to a genuine measure-specific component and necessary
- generic names like `.box1`, `.blue-card`, `.thing`
- creating new classes when an existing pattern already works

State should usually use data attributes:

```jsx
data-active
data-tone
data-mcid
data-measure-panel
data-measure-layout
```

Use class names for layout and reusable visual structure.

Use data attributes for state and variants.

---

## Styling Rules

Use existing style blocks:
- landing page: `const styles` in `pages/index.js`
- app: `const globalStyles` in `pages/app.js`

Do not add:
- Tailwind
- CSS modules
- new styling libraries
- scattered inline styles
- duplicate style systems

Inline styles are allowed only when value is genuinely dynamic, such as:
- chart coordinates
- calculated progress width
- data-driven marker position
- runtime colour from clinical classification

When doing visual work:
- preserve the current system
- do not patch randomly
- update the relevant style section cleanly
- remove obsolete styles if they are no longer used
- check mobile breakpoints

For large visual rebuilds:
- define the visual target before coding
- update JSX and CSS together
- avoid half-old / half-new UI

---

## Typography

Use:
- `Inter` for app UI, body text, controls, data labels
- `Source Serif 4` for landing page hero/editorial headings where already used
- monospace only for clinical numeric values, scores, abbreviations, or compact data displays

Avoid:
- mixing too many fonts
- browser-default form typography
- tiny unreadable text
- decorative typography

Numeric clinical data should be easy to scan.

Use tabular/monospace styles where useful.

---

## Layout Rules

### Landing page

Keep:
- clear hero
- public marketing flow
- clinical credibility
- strong CTA
- realistic product preview
- responsive single-column behaviour on smaller screens

Do not turn the landing page into:
- a dashboard
- a dense documentation page
- a generic SaaS template

### App dashboard

Keep:
- sidebar-first app shell on desktop
- content-first dashboard cards
- patient overview as the main clinical landing state
- assessment workflow as a focused work area
- patient list/workspace separation
- summary cards and trends readable at a glance

Do not revert to:
- old top-header plus small sidebar layout
- plain document UI only
- table-only dashboard
- generic form stack

---

## Forms and Inputs

All inputs must look styled.

No browser-default input appearance.

Use existing patterns:
- `.field-group`
- `.field-label`
- `.field-input`
- `.input-narrow`
- table inputs where clinically useful
- styled select controls

For measure forms:
- keep inputs compact but readable
- use table format where it improves clinical scanning
- use cards/panels where it improves workflow clarity
- do not force every measure into the same layout if the measure needs a different clinical structure

10MWT can use table-style input where useful, but do not force all future measures into the 10MWT structure.

---

## Clinical Architecture

RehabMetrics IQ is a clinical interpretation tool.

Clinical architecture must remain separated.

### Clinical logic

Use:

`/lib/clinical/`

For:
- calculations
- thresholds
- MCID logic
- interpretation logic
- reference values
- measure-specific helper functions

Rules:
- pure JavaScript only
- no React
- no DOM
- no styling
- no component state
- no Supabase calls inside clinical calculation files

Each measure should have its own clinical logic where appropriate.

Example:

`lib/clinical/10mwt.js`

### Measure registry

Use:

`lib/clinical/measures.js`

The registry should be the source of truth for:
- measure name
- abbreviation
- category
- units
- directionality
- chart configuration
- thresholds
- MCID keys
- availability/status

Components must not hardcode registry-owned values.

### UI components

Use:

`components/`

For:
- rendering forms
- rendering cards
- rendering summaries
- rendering charts
- user interactions

Components consume clinical functions.

Components do not own clinical rules.

### Page layer

Use:

`pages/`

For:
- routing
- state orchestration
- auth checks
- data fetching
- view selection
- layout composition

Pages should not become clinical calculation files.

---

## Clinical Data Contract

Clinical calculation functions should return a predictable object.

Preferred shape:

```js
{
  primaryValue: number,
  primaryUnit: string,
  interpretation: string,
  meta: object
}
```

Rules:
- `primaryValue` feeds charts, comparison, and MCID logic
- `primaryUnit` displays the score unit
- `interpretation` must be clinically accurate
- `meta` holds measure-specific outputs

Do not rewrite clinical interpretation casually.

Do not invent unsupported clinical claims.

Do not simplify clinical rules to make UI easier.

---

## Clinical Integrity Rules

Clinical rules are more important than visual convenience.

Do not:
- generalise one measure's logic across all measures
- invent thresholds
- invent MCID values
- remove clinically relevant context
- auto-scale charts without clinical reasoning
- hide uncertainty
- present calculated insight as diagnosis
- imply the app replaces clinical judgement

Do:
- implement one measure at a time
- validate calculation outputs
- keep reference values traceable in code comments where needed
- show meaningful change clearly
- distinguish score, interpretation, and clinical implication
- preserve previous-vs-current comparison
- make MCID status obvious but not exaggerated

ISNCSCI is complex.

Only modify ISNCSCI carefully and separately.

Do not batch ISNCSCI changes with unrelated UI work.

---

## Charts

Charts must be clinically meaningful.

Rules:
- use clinically appropriate scales
- include threshold/reference context where relevant
- avoid arbitrary max values
- do not auto-scale if that hides clinical meaning
- clearly label units
- show direction of change where relevant
- visually distinguish current, previous, threshold, and MCID where applicable
- chart config should come from clinical registry/config, not random component values

Charts should help the clinician answer:

"What changed, and does it matter?"

---

## Patient Data Rules

Use Supabase as source of truth.

Do not rely on localStorage for clinical data.

Patient data:
- `patients` table is source of truth
- use `date_of_birth` rather than stored age where available
- calculate age at runtime
- diagnosis/condition fields must match the actual Supabase schema
- do not assume column names
- check existing queries before changing schema or UI fields

Assessment data:
- `assessments` table stores measure results
- keep `inputs` as JSONB where used
- keep `results` as JSONB where used
- always sort by `created_at DESC`
- latest assessment = first item
- previous assessment = second item

Before changing patient or assessment fields:
- map Supabase schema to UI fields
- confirm exact column names
- list every affected file
- avoid silent field renames

---

## Supabase Rules

Never hardcode secrets.

Never expose service role keys in frontend code.

For auth/session work:
- preserve current session flow
- preserve OAuth callback handling
- preserve sign-out behaviour
- preserve redirect to `/login` when required
- preserve redirect to `/app` for authenticated landing-page users

For profile work:
- preserve `profiles` lookup
- preserve avatar/profile behaviour
- check column names before editing

For subscription work:
- preserve trial and active subscription access logic
- preserve Stripe redirect handling
- preserve subscription wall behaviour

Run `/security-review` before auth, payment, subscription, RLS, or sensitive data changes.

---

## Stripe Rules

Stripe changes are sensitive.

Before changing Stripe:
- identify exact file
- identify client vs server code
- confirm webhook route if involved
- confirm environment variable names
- do not hardcode keys
- preserve existing subscription logic

Run `/security-review`.

---

## Landing Page Functional Rules

Preserve:
- SEO title and description
- canonical URL
- favicon
- signup link
- login link
- pricing toggle
- free trial language
- FAQ
- demo modal
- authenticated user redirect to `/app`

Do not:
- remove clinical product positioning
- make claims beyond current product
- add unsupported features
- make the page visually louder
- remove accessibility labels/alt text without replacement

---

## App Functional Rules

Preserve:
- subscription wall
- patient creation
- patient selection
- assessment creation
- assessment save
- summary view
- patients view
- unsaved assessment warning
- PDF report export
- profile modal
- sign out

Do not:
- break view switching
- break selected patient state
- save assessments locally only
- remove assessment history
- remove MCID/trend context
- make assessment workflow harder to use
- change data shape without checking every consumer

---

## Outcome Measure Workflow

Build one measure at a time.

For each measure:
1. Define clinical inputs
2. Define calculation logic
3. Define interpretation outputs
4. Define MCID/threshold logic where available
5. Define chart config
6. Build UI
7. Save to Supabase
8. Display in summary
9. Test previous/current comparison
10. Verify report export if relevant

Do not batch multiple new measures unless explicitly requested.

---

## UI Change Format

For bug fixes, use:

```md
BUG FIX

File: [file path]

Problem:
[plain English]

BEFORE:
[code]

AFTER:
[code]

Why:
[plain English]
```

For visual changes, use:

```md
VISUAL TARGET

Current pattern to preserve:
[describe current RehabMetrics IQ pattern]

Change:
[describe intended change]

Must avoid:
[risks]
```

Then provide exact file edits.

For JSX changes, list exact replacements where practical:

```md
CHANGE:

[old JSX]
→
[new JSX]
```

For style changes:
- identify the exact style section
- prefer replacing the relevant complete section
- do not randomly sprinkle overrides at the bottom unless intentionally overriding legacy styles

---

## Current UI Patterns To Preserve

### Landing

Preserve:
- `.site-header`
- `.hero`
- `.hero__focus-blur`
- `.hero__scrim`
- `.hero__inner`
- `.preview-card`
- `.measure-strip`
- `.workflow-layout`
- `.image-panel`
- `.clinical-band`
- `.pricing-layout`
- `.demo-modal`

### App

Preserve:
- `.app-shell`
- `.app-sidebar`
- `.app-nav`
- `.app-main`
- `.page-toolbar`
- `.new-assessment-btn`
- `.patient-summary-card`
- `.summary-card`
- `.summary-dashboard`
- `.domain-grid`
- `.domain-card`
- `.patients-workspace`
- `.patient-workspace-panel`
- `.result-box`
- `.modal`
- `.modal-content`
- `[data-measure-panel]`
- `[data-measure-layout]`
- `[data-measure-nav]`
- `[data-measure-form]`
- `[data-measure-tabs]`

Do not remove these patterns unless doing an approved full redesign.

---

## Responsive Rules

Every visual change must be checked at:
- desktop
- tablet/narrow desktop
- mobile

Preserve current behaviour:
- app sidebar collapses at narrower widths
- mobile app shell becomes stacked
- landing grids collapse cleanly
- cards remain readable
- tables do not break layout
- modals remain scrollable

---

## Accessibility Rules

Keep:
- semantic buttons for actions
- links for navigation
- labels for inputs
- alt text for images
- readable contrast
- visible focus states
- keyboard-accessible modals where possible

Do not use clickable `<div>` when a button or link is correct.

---

## Verification Steps

After changes, verify:

```bash
npm run dev
```

Then use Playwright for visual changes.

Check landing page:
- page loads
- hero renders correctly
- product preview renders correctly
- pricing toggle works
- demo modal opens/closes
- mobile layout does not break
- no browser-default buttons/inputs visible

Check app:
- login/session flow still works
- subscription wall still works when access is invalid
- app shell renders
- sidebar navigation works
- patient list renders
- create patient works
- select patient works
- new assessment opens
- assessment save works
- summary updates after save
- previous/current comparison still works
- PDF export button still works
- sign out works
- mobile layout remains usable

For data changes, also verify:
- Supabase column names match exactly
- no console errors
- no failed Supabase queries
- no broken RLS assumptions
- no localStorage clinical data dependency

For clinical changes, also verify:
- calculation output
- interpretation output
- MCID logic
- threshold logic
- chart scale
- report output if relevant

---

## Failure Conditions

Reject or revise the work if:
- app looks like plain HTML
- inputs look browser-default
- clinical dashboard reverts to old document-only UI
- landing page becomes generic SaaS
- auth or subscription flow breaks
- patient data stops saving
- assessments stop sorting newest first
- clinical calculations are hardcoded into UI components
- chart scales are arbitrary
- colours are added without purpose
- styles are scattered across multiple systems
- mobile layout is broken
- code introduces secrets
- code removes existing functionality without approval

---

## Default Claude Code Behaviour

Before editing:
- inspect current file
- understand existing pattern
- preserve working logic
- avoid broad rewrites unless requested

During editing:
- make the smallest safe change that preserves the current visual system
- keep clinical and UI logic separated
- keep code readable
- remove obsolete code if replacing a section

After editing:
- state exactly what changed
- state what was preserved
- run appropriate checks
- recommend `/code-review`
