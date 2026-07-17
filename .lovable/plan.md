## Goal

Make the "navigate" pillar as strong as the "assess" pillar. Right now the assessment output and the care directory don't talk to each other. After a result, the user should land on a shortlist that already matches the urgency the AI decided — with a real map, real distances, and one-tap actions to call or get directions.

## What changes for the user

1. **Result → "See care nearby" opens a filtered shortlist.** High urgency → Hospital + Urgent Care. Medium → GP + Urgent Care (walk-in doctor abroad). Low → Pharmacy first, then GP. Empty state suggests calling 112/999/local emergency line for High.
2. **Provider list is ranked, not just filtered.** Sorted by a simple score: recommended-for-urgency > open-now > distance. Each card shows a small "Recommended for your assessment" chip when it matches the AI's care type.
3. **Real map (Google Maps).** The map placeholder on `/care` and the mini-map on `/care/$id` become real Google Maps with pins for the visible providers and a "You are here" marker.
4. **Real distances.** When the user allows location, distances/travel-min are recomputed from their coordinates to each provider (Haversine — no Routes API call, no cost). Fall back to the mock values if permission is denied.
5. **One-tap "Get directions" opens Google Maps navigation** from current location to the provider address (already partially wired — we'll polish it and add on the list cards too).

## How it works

### Urgency → care type mapping (`src/lib/care-recommendation.ts`, new)
- Pure function `recommendCareTypes(urgency, redFlag, mainSymptom)` → ordered array of provider types, plus a one-line "why we're showing this" string.
- High + red flag → `["Hospital", "Urgent Care"]` with emergency-call banner.
- Medium → `["GP", "Urgent Care"]`.
- Low → `["Pharmacy", "GP"]`.

### Assessment store (`src/lib/assessment-store.ts`, edit)
- Add `careRecommendation` (result of the function above) so `/care` can read it without recomputing.

### Results page (`src/routes/results.tsx`, edit)
- Existing "Find care nearby" CTA now links to `/care` with `?type=<top-recommendation>` (already supported by `validateSearch`) AND stores the full ordered list in the assessment store.
- High-urgency banner adds an "Call emergency" button that uses `tel:112` (or locale-appropriate via `getEmergencyInfo`).

### Care list (`src/routes/care.index.tsx`, edit)
- Read `assessmentStore.careRecommendation` on mount. If present, show a dismissible "Recommended for your assessment: …" banner at the top and pre-select the top type in the filter chips.
- Ranking: providers get a score = (matches recommended type ? 100 : 0) + (openNow ? 20 : 0) − distanceKm. Sort descending.
- Show a small teal "★ Recommended" pill on cards whose type is in the recommended list.
- Replace the SVG map placeholder with a real Google Map (see below).

### Provider detail (`src/routes/care.$id.tsx`, edit)
- Replace the mini-map placeholder with a real Google Map centred on the provider.
- Keep the existing Call / Directions / Book actions; make the "Directions" link use `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` when coords are known, else fall back to the current address-based URL.

### Google Maps integration (`src/components/ProviderMap.tsx`, new)
- Uses the **Google Maps Platform connector** (Managed by Lovable — one click, no user setup) via `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` and the browser JS SDK.
- Loads Maps JS async with `callback=initMap`, uses `google.maps.Marker` (not AdvancedMarkerElement), no `mapId`.
- Props: `providers`, `userLocation?`, `activeId?`. Renders pins; clicking a pin scrolls the matching list card into view.
- Gracefully degrades to the current gradient placeholder if the key is missing.

### User location (`src/lib/use-user-location.ts`, new)
- Small hook wrapping `navigator.geolocation.getCurrentPosition` with permission state (`prompt` / `granted` / `denied`).
- Adds mock coordinates to each provider in `src/lib/mock-data.ts` (Dublin lat/lngs) so distance recompute works.
- Haversine helper for distance in km; travel-min estimate = distanceKm × 12 (walking) — keeps it honest without a Routes API call.

### Provider mock data (`src/lib/mock-data.ts`, edit)
- Add `lat`, `lng` to each of the 5 providers (real Dublin coordinates for the named streets).

## Files

- **New** `src/lib/care-recommendation.ts`
- **New** `src/components/ProviderMap.tsx`
- **New** `src/lib/use-user-location.ts`
- **Edit** `src/lib/assessment-store.ts` — add `careRecommendation`
- **Edit** `src/lib/mock-data.ts` — add lat/lng
- **Edit** `src/routes/results.tsx` — set care recommendation, deep-link to `/care?type=…`, emergency call button
- **Edit** `src/routes/care.index.tsx` — recommendation banner, ranking, real map
- **Edit** `src/routes/care.$id.tsx` — real mini-map, coord-based directions link

## Setup

- Enable the **Google Maps Platform** connector (Managed by Lovable) — one click, no Google Cloud account needed. Runs on Lovable's `*.lovable.app` domain out of the box; you only need your own key later if you publish on a custom domain.
- No new dependencies. Uses the Maps JavaScript API via a `<script>` tag loaded on demand.

## Out of scope (for this step)

- Real-time traffic / driving vs walking route selection (would need Routes API — costs credits).
- Live "wait times" or slot availability at providers (needs partner data).
- Booking flow beyond the existing demo confirmation.
- Persisting past assessments so the care list stays personalised across sessions.

Ready to build?
