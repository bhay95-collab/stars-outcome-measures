# STARS Outcome Measures - Project Context

## What This Is
A web tool for interpreting Rehabilitation Outcome Measures.
Built with Next.js (JavaScript/TypeScript).

## My Situation
- I am not a developer
- Claude Code writes all code for this project
- Explain decisions clearly when making changes

## Code Rules
- Many small files over few large files
- Never mutate objects or arrays
- No console.log in production code
- Proper error handling always
- No hardcoded secrets — use environment variables

## File Structure
stars-outcome-measures/
|-- pages/        # Next.js pages
|-- components/   # Reusable UI components
|-- lib/          # Utility functions
|-- assets/       # Images, styles
|-- public/       # Static files

## Useful Commands
- `/ecc:plan "task"` - Plan before building anything new
- `/code-review` - Check work just done
- `/build-fix` - Fix broken builds

## Design System — RehabMetrics IQ
ALWAYS follow these rules for any UI/design work.

### Brand
- Name: RehabMetrics IQ
- Tone: calm, precise, trustworthy
- Style: editorial, clinical, minimal

### Typography
- Headings: Source Serif 4
- Body/UI: Inter

### Colours
- Primary: #236499
- Secondary: #7FB3E6
- Surface: #FFFFFF
- Border: #D8E2EC
- Text primary: #1F2933
- Text secondary: #5F6B7A
- Text muted: #8A96A3

### Spacing & Layout
- 4px spacing system
- Border radius: 6–24px
- Shadows: subtle only
- No gradients
- No decorative styling

### Logo Rules
- Wordmark: "RehabMetrics IQ"
- Square logo: "RM/IQ" only
- 3-bar data motif is NOT a logo

### Strict Rules
- Use design tokens only
- No new colours, fonts, spacing, or shadows
- Maintain clarity and consistency at all times

### Brand Assets
- Square logo: /assets/brand/SquareLogo.png — use for favicons, app icons, small spaces
- Visual identity guide: /assets/brand/Visual Guide.png — reference for any design decisions
- ALWAYS use these files. Never recreate or substitute logos.

