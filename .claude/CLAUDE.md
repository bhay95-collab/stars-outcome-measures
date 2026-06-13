# RehabMetrics IQ — Claude Code Instructions

The master orientation file for this project is **[CLAUDE.md at the repo root](../CLAUDE.md)**. Read it first — it states your role, maps every documentation file (ARCHITECTURE.md, DESIGN.md, PRODUCT.md, SECURITY.md, CONTRIBUTING.md, TESTING.md, mobile/MOBILE.md), lists the non-negotiable working rules, and records current build gotchas.

This file was unified into the root documentation set on 2026-06-13. The operational rules that previously lived here now live in:

- Visual system, tokens, brand, class naming, preservation lists → `DESIGN.md`
- Stack, file scope, clinical architecture, data contract, Supabase/Stripe rules → `ARCHITECTURE.md` and `SECURITY.md`
- Clinical scope, integrity rules, measure workflow → `PRODUCT.md`
- Workflow, verification steps, failure conditions → `CONTRIBUTING.md` and `TESTING.md`

Do not re-add project rules here — update the mapped files instead, in the same session as the change that affects them.
