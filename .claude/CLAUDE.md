# RehabMetrics IQ - Project Context

## What This Project Is
RehabMetrics IQ is a clinical SaaS landing page and product direction for physiotherapists and rehabilitation teams.

Positioning:
**Data-driven outcomes. Better patient care.**

The product helps clinicians capture, score, interpret, and report rehabilitation outcome measures with less manual work and clearer clinical insight.

## My Situation
- I am not a developer
- Claude Code writes and edits the code for this project
- Explain changes clearly in plain English
- When giving instructions, be specific about what changed and why
- Prefer direct, practical guidance over technical theory

## Development Workflow
- Use `/plan` before any multi-step change
- Wait for approval before making major edits
- After changes, run `/code-review`
- After visual changes, use Playwright to check the page renders correctly
- If a change touches auth, payments, or sensitive data, run `/security-review`
- If the code becomes bloated, use `/simplify`

## Project Structure
Main stack:
- Next.js (pages router)
- React with hooks
- Single-page landing page in `pages/index.js`
- Plain CSS inside the existing `<style>` tag
- Supabase in `lib/supabase.js`
- Stripe in `lib/stripe.js`
- `lucide-react` for icons

## File Rules
- Edit `pages/index.js` directly unless explicitly told otherwise
- Do not create extra component files unless explicitly asked
- Do not install packages without confirming first
- Never hardcode secrets; use environment variables
- Use proper error handling
- No `console.log` in production code
- Do not mutate arrays or objects

## How To Communicate Changes
When making changes:
- Tell me exactly which file was edited
- Tell me exactly what section was updated
- Summarise the reason for the change in simple language
- Keep explanations clear enough for a non-technical user

## Brand Identity
### Brand
- Name: **RehabMetrics IQ**
- Tone: calm, precise, trustworthy
- Style: editorial, clinical, minimal
- Avoid startup-flashy language or styling

### Core Positioning
- Primary message: **Data-driven outcomes. Better patient care.**
- Product theme: standardised measures, automated scoring, clear clinical insight

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
