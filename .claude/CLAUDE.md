# RehabMetrics IQ - Project Context

## What This Project Is
RehabMetrics IQ is a clinical SaaS landing page and product direction for physiotherapists and rehabilitation teams.

Positioning:
**Data-driven outcomes. Better patient care.**

The product helps clinicians capture, score, interpret, and report rehabilitation outcome measures with less manual work and clearer clinical insight.

---

## My Situation
- I am not a developer
- Claude Code writes and edits the code for this project
- Explain changes clearly in plain English
- When giving instructions, be specific about what changed and why
- Prefer direct, practical guidance over technical theory

---

## Development Workflow
- Use `/plan` before any multi-step change
- Wait for approval before making major edits
- After changes, run `/code-review`
- After visual changes, use Playwright to check the page renders correctly
- If a change touches auth, payments, or sensitive data, run `/security-review`
- If the code becomes bloated, use `/simplify`

---

## Project Structure
Main stack:
- Next.js (pages router)
- React with hooks
- Single-page landing page in `pages/index.js`
- Plain CSS inside the existing `<style>` tag
- Supabase in `lib/supabase.js`
- Stripe in `lib/stripe.js`
- `lucide-react` for icons

---

## File Rules
- Edit `pages/index.js` directly for landing page work
- Application logic may create:
  - `/lib/clinical/`
  - `/components/`
- Do not install packages without confirming first
- Never hardcode secrets; use environment variables
- Use proper error handling
- No `console.log` in production code
- Do not mutate arrays or objects

---

## How To Communicate Changes
When making changes:
- Tell me exactly which file was edited
- Tell me exactly what section was updated
- Summarise the reason for the change in simple language
- Keep explanations clear enough for a non-technical user

---

## Brand Identity

### Brand
- Name: **RehabMetrics IQ**
- Tone: calm, precise, trustworthy
- Style: editorial, clinical, minimal
- Avoid startup-flashy language or styling

### Core Positioning
- Primary message: **Data-driven outcomes. Better patient care.**
- Product theme: standardised measures, automated scoring, clear clinical insight

---

## Locked Design Tokens
Do not deviate from these tokens.

```css
:root {
  --color-primary: #236499;
  --color-primary-dark: #17496F;
  --color-primary-soft: #EAF3FB;
  --color-secondary: #7FB3E6;
  --color-ink: #1F2933;
  --color-muted: #5F6B7A;
  --color-subtle: #8A96A3;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F7FAFC;
  --color-border: #D8E2EC;

  --shadow-sm: 0 1px 2px rgba(31,41,51,0.06);
  --shadow-md: 0 6px 16px rgba(31,41,51,0.08);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}

## Clinical Architecture (Non-Negotiable)

RehabMetrics IQ is a clinical interpretation tool. The architecture must remain strictly separated.

### 1. Clinical Logic (`/lib/clinical/`)
- All calculations, thresholds, MCID logic, and interpretation text live here
- Pure JavaScript only (no React, no DOM)
- Interpretation text must remain verbatim from source material
- Each measure has its own file (e.g. `10mwt.js`, `tug.js`)

### 2. Measure Registry (`/lib/clinical/measures.js`)
- Single source of truth for:
  - measure name
  - category (`performance` | `questionnaire`)
  - unit
  - `higherIsBetter`
  - chart config (`yMin`, `yMax`, `thresholds`)
  - `mcidKey`
- Components must never hardcode these values

### 3. UI Components (`/components/`)
- Responsible for display only
- Must not contain calculation logic
- Must consume data from clinical functions

### 4. Page Layer (`pages/`)
- Handles state, layout, and orchestration
- Must not contain clinical logic

---

## Data Contracts (Strict)

All clinical calculation functions must return:

{
  primaryValue: number,
  primaryUnit: string,
  interpretation: string,
  meta: object
}

Rules:
- `primaryValue` is used for charts and MCID
- `interpretation` must NOT be rewritten or simplified
- `meta` contains measure-specific outputs

---

## Clinical Integrity Rules

- Do NOT simplify or generalise measure logic
- Do NOT create generic summaries across measures
- Each measure defines its own:
  - inputs
  - outputs
  - interpretation
- Condition must influence:
  - MCID thresholds
  - interpretation logic

---

## Development Rules (Clinical App)

- Implement ONE measure at a time
- Fully validate before adding another
- Do NOT batch-build multiple measures
- ISNCSCI must only be implemented after at least 3 measures are fully working

---

## Charts

- Must use clinically accurate scales
- Must include threshold reference lines
- Must not auto-scale without clinical reasoning
- Chart config must come from `MEASURES` registry only

---

## Patient Data

- Use `date_of_birth`, not stored age
- Age calculated at runtime
- Condition must be selected from controlled list (`CONDITION_OPTIONS`)
- No free text condition input

---

## Supabase

- `patients` table is source of truth for patient data
- `assessments` table stores:
  - inputs (JSONB)
  - results (JSONB)
  - created_at

- Always sort assessments by `created_at DESC`
  - latest = first
  - previous = second

- Never rely on localStorage for clinical data