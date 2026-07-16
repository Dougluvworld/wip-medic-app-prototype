
## Goal

Make Medi-Care travel-aware. If we detect the user is abroad, offer to switch to travel mode with a dismissible banner. In travel mode, "GP" becomes "Walk-in doctor / local clinic" everywhere, since a personal GP isn't accessible on holiday.

## How detection works

Two signals, combined:

1. **Home country** — derived from `navigator.language` (e.g. `en-GB` → GB). Same source we already use for the emergency number.
2. **Current country** — from `navigator.geolocation` → reverse geocode via a free open endpoint (BigDataCloud's `client-ip-country` free tier, no key needed) OR a simple offline lookup on lat/long bounding boxes for the demo. Prototype-only, so we won't over-engineer.

Rule: if `current !== home` and both are known → suggest travel mode. If geolocation is denied/unavailable → do nothing (no forced ask), user can still flip mode manually from the banner if it ever appears.

State lives in a tiny `useTravelMode()` hook backed by `localStorage` so the choice persists across screens and reloads. Values: `"home" | "away" | "unknown"` + `awayCountry?: string`.

## UI changes

**Travel banner** (`src/components/TravelBanner.tsx`, new)
- Appears at the top of `/home`, `/results`, and `/care` when detection returns `away` and the user hasn't dismissed/confirmed yet.
- Copy: *"Looks like you're in {country}. Show local care instead of your usual GP?"*
- Buttons: **Yes, I'm travelling** (sets mode=away) · **I'm home** (sets mode=home). Both dismiss the banner.
- Soft teal card, plane icon (`Plane` from lucide), fade-in.

**Terminology swap** — driven by a helper `careLabel(mode)` returning either `"GP"` or `"Walk-in doctor"`:
- `results.tsx`: Medium-urgency `next` text, CTA button, and `nextBody` swap.
- `care.tsx`: the "GP" filter chip label. Underlying provider `type` stays `"GP"` (mock data key) so filtering still works — only the display label changes.
- `mock-data.ts`: no data change; we're only re-labelling.

**Emergency number** — already dynamic from locale. When in travel mode, we prefer the *current-country* emergency number instead of the home one (uses same `BY_COUNTRY` map already in `src/lib/locale.ts`).

## Files

- **New** `src/lib/travel-mode.ts` — hook + detection (`useTravelMode()`), localStorage persistence, geolocation call.
- **New** `src/components/TravelBanner.tsx` — the confirm card.
- **New** `src/lib/care-labels.ts` — `careLabel(mode)` returning `"GP" | "Walk-in doctor"` and a helper for full sentences.
- **Edit** `src/lib/locale.ts` — export `emergencyForCountry(cc)` so we can pass the current-country code explicitly.
- **Edit** `src/routes/home.tsx` — render `<TravelBanner />`, use current-country emergency number if in travel mode.
- **Edit** `src/routes/results.tsx` — render banner, swap "GP" copy via `careLabel`, use travel-aware emergency number.
- **Edit** `src/routes/care.tsx` — render banner, relabel the "GP" filter chip (value stays `"GP"`).

## Out of scope

- No real reverse-geocoding vendor / no API keys. Geolocation → simple client-side lookup using timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone` → country hint) as the prototype path; if unavailable, offer manual "I'm travelling" toggle only via the banner when the user opens it themselves. Reliable enough for a demo, zero infra.
- No embassy links, no travel-insurance card (per your answer, only the GP relabel is in).
- No new onboarding step — detection is passive.
