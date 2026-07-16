## Goal

Make the care detail page (`/care/$id`) feel trustworthy and actionable. Right now it shows a rating number and three action tiles, but no real voices and no obvious "just call them now" moment. We'll add customer feedback and make contact one tap away.

## Why this builds trust

Two things matter most when someone is unwell and picking a provider:
1. **Social proof** — "other people like me had a good experience here"
2. **Zero friction to act** — the phone number should call, not just display

Everything below serves one of those two.

## Changes

### 1. One-tap contact (top of page)

- Promote **Call** to a full-width primary CTA under the hero: `tel:` link, big phone icon, subtitle "Usually answers in under 1 min" (mock).
- Keep secondary tiles for **Directions** (`https://maps.google.com/?q=<address>`), **Book**, and a new **Message** tile (opens `sms:` on mobile). All native handoffs — no in-app chat to build.
- Sticky bottom bar changes from "Book appointment" to a two-button row: **Call now** (primary) + **Book** (secondary), so the call action is always reachable while scrolling.
- Phone-number row becomes a tappable `tel:` link with a subtle "Tap to call" hint.

### 2. Reviews section (new)

- New `Reviews` block below About with:
  - Rating summary: big score, star row, total review count, and a mini 5→1 star distribution bar.
  - 2–3 highlighted quote cards (reviewer initial avatar, name, star row, 1–2 sentence quote, relative date, "Verified visit" chip).
  - "See all reviews" ghost button (non-functional for prototype, or scrolls to a longer list — see below).
- Add a mock `reviews` array per provider in `src/lib/mock-data.ts` (3 reviews each, realistic Irish/travel-mode-appropriate names, mix of 4–5 star with one honest 3-star to feel real — perfect scores read as fake).
- Add a `TrustSignals` row above reviews: small chips like "HSE-registered", "Wheelchair accessible", "Accepts walk-ins" — pulled from a new `badges: string[]` field on each provider. Only render chips that exist.

### 3. Small polish

- Add a "Last updated 2 days ago" line under hours to signal data freshness.
- Booked-confirmation card gets a "We'll text you a reminder" line — reinforces the platform actually does something.

## Files

- **Edit** `src/lib/mock-data.ts` — add `reviews` and `badges` to each provider; export `Review` type.
- **Edit** `src/routes/care.$id.tsx` — new sections (primary call CTA, trust chips, reviews block), sticky bar with two buttons, `tel:`/`sms:`/maps links.
- **New** `src/components/ReviewCard.tsx` — single review card, kept small and reusable.

## Out of scope

- No real review submission, no auth-gated "verified visit" logic — prototype only.
- No in-app chat/telemedicine — native `tel:`/`sms:` is enough to feel real.
- No backend; all data stays in `mock-data.ts`.

## Open question

Want me to also add a **"Report incorrect info"** link at the bottom? It's a small trust signal (shows the platform cares about accuracy) but adds a dead-end in the prototype. Happy either way — will skip unless you say yes.
