# RehabMetrics IQ Mobile — Phase 1 Complete

**Date:** 2026-05-08
**Commit:** 35ea0cd — fix: complete mobile Google OAuth flow

---

## Confirmed working (iOS dev build)

- Email/password sign-in ✓
- Google OAuth sign-in ✓
- AsyncStorage session persistence across app terminate/relaunch ✓
- Patient list loads ✓
- Patient summary loads ✓
- Measure selector opens ✓
- ISNCSCI hidden from measure selector ✓

## Confirmed not present

- No write/save assessment functionality
- No patient creation
- No Phase 2 work

## Known deferred items

- PKCE SHA-256 challenge (WebCrypto polyfill) — currently using `plain` fallback due to Hermes engine limitations. Accepted for Phase 1. Fix before production.
- Bundle identifier `com.anonymous.rehabmetrics-iq` — must be replaced before TestFlight/App Store submission.

---

Phase 2 not started.
