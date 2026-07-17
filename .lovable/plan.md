## Pre-publish check — Medi-Care

### Ready to publish
- **Security scan:** clean, no findings.
- **Metadata:** every route (home, assess, results, care, care/$id, profile, settings, onboarding, privacy, terms, 404) has its own title + description + og tags. Root sets theme-color, manifest, JSON-LD, Apple/PWA meta.
- **Routing:** TanStack file-based routes are consistent, error + notFound boundaries wired in `__root.tsx`.
- **PWA:** manifest, icons, apple-touch-icon, offline banner, install prompt in place.
- **Theming:** pre-hydration dark-mode script prevents FOUC.
- **Recent fixes:** SOS centering, sticky nav, and "While you wait" comfort card are in.

### Optional improvements (not blockers)

1. **`og:image`** — none is set. Hosting will auto-inject a screenshot on publish, so it's fine to ship. If you want a branded share preview, we can generate a 1200×630 cover and wire it into leaf routes.
2. **Medical disclaimer visibility** — the "not medical advice" line lives inside the While-you-wait card. Consider also surfacing it once in onboarding and in the footer of `results` for legal safety.
3. **Analytics / error reporting** — `reportLovableError` is wired for boundary crashes, but there's no product analytics (e.g. how many users complete assess → results). Optional for MVP.
4. **Credits guardrail** — you're at 24 credits remaining. Before sharing publicly, consider setting a usage cap via the credits limit so testers can't drain the balance.
5. **Rate limiting on AI calls** — no per-user throttle on the symptom assessment. Low priority for a soft launch, worth adding before wider release.
6. **Empty/loading states** — quick pass to confirm assess and results pages show skeletons (not blank) during AI calls, on slow networks.

### Recommendation
App is in good shape to publish. I'd suggest: (a) set a credits limit first, (b) publish, then (c) iterate on og:image and disclaimer placement.

Approve this plan and I'll set the credits limit and walk you through publishing — or tell me which of the improvements above you want done before we ship.