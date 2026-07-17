
# Apply full app review — implementation plan

I'll ship the whole review in three passes. Each pass is self-contained and leaves the app in a working state.

## Pass 1 — Trust & correctness (remove/fix fake affordances)

- **Splash** (`src/routes/index.tsx`): if `localStorage.mediCareOnboarded === "1"`, redirect to `/home`. Collapse "Sign In" + "Create Account" into a single "Get started" CTA (keeps "Continue as Guest"). Set the flag when onboarding completes.
- **Home** (`src/routes/home.tsx`):
  - Read name from profile store; fall back to "there".
  - Remove the mock "Recent assessments" list until real history exists; replace with a compact "Start your first check-in" empty state (or, if `localStorage` has past AI results, render those — see Pass 3).
  - Remove the dead "See all" button.
  - Rotate daily tip from a small pool keyed to the day-of-year.
  - Demote emergency banner to a slim pinned pill so the primary CTA is unmissable.
- **Assess** (`src/routes/assess.tsx`):
  - Remove the fake mic button (it just types a canned string). Keep only the send button.
  - Gate "Use example answer" behind `?demo=1` search param.
  - Add a 25s timeout + one-tap "Retry" on the AI call.
  - Switch the progress bar to an indeterminate "Analysing…" state during `thinking`/red-flag branches.
- **Results** (`src/routes/results.tsx`):
  - Convert AI-error notice from tiny grey footer to a visible banner at the top of the content.
  - Remove the duplicate bottom "Find care near me" link (keep the single urgency CTA).
  - Replace numeric confidence % with a qualitative label ("More likely / Possible / Less likely"); keep the % only inside the expanded reasoning line.
  - Add a "Copy summary" button (copies urgency + top 3 conditions + next step to clipboard) with a `Copied ✓` toast.
- **Profile** (`src/routes/profile.tsx`):
  - Persist `name` to profile store; read it on mount.
  - Add subtle inline "Saved ✓" indicator after any change (2s fade).
  - Remove hardcoded emergency contact; replace with editable single-contact card (name + relationship + phone) persisted in profile store.
  - Add "Blood type" and "GP / doctor name" fields.
- **Settings** (`src/routes/settings.tsx`):
  - Persist dark mode to `localStorage` and read on mount (in `useEffect` to avoid hydration mismatch).
  - Hide the placeholder rows (Language, Privacy, Medical data, Support) behind a "Coming soon" tag OR remove them — I'll tag them "Coming soon" and disable clicks so the settings page still looks populated.
  - Rename "Sign out" → "Reset demo" (clears localStorage + navigates to `/`).

## Pass 2 — Core-flow UX

- **Bottom nav** (`src/components/BottomNav.tsx`): 5-slot layout with a raised center FAB for Assess (larger circle, gradient, elevated shadow). Home / Care flank left; Profile / Settings flank right. Move Settings into the nav so it's reachable everywhere; drop the Settings gear from Home header.
- **Show bottom nav consistently**: audit `care.$id.tsx` and any other deep screens; render `<BottomNav />` everywhere except splash + onboarding.
- **ScreenHeader back**: change `back` prop to support "auto" — uses `router.history.back()` with fallback path. Update Care detail and Results to use auto-back.
- **Assess edit-answer**: each user bubble gets a small pencil affordance → rewinds `messages` + `phase` to that step; profile/state carried forward is recomputed from remaining answers.
- **Care list** (`src/routes/care.index.tsx`):
  - When the recommendation banner shows, drop the auto-selected chip highlight (one signal, not two).
  - Add "Opens at HH:MM" hint to closed cards (using `hours.ts`).
  - Add empty state when filters return 0 providers (illustration + "Clear filters" button).
  - Location: on first visit show a small "Enable location for accurate distances" prompt above the map, with a Grant button; remember dismissal in localStorage.
- **Care detail** (`src/routes/care.$id.tsx`): sticky bottom action bar with `[Call] [Directions] [Book]`. Label reviews section "Sample reviews" until real.
- **Page transitions**: add fade + slight slide on `<Outlet />` swap in `__root.tsx` using CSS keyframes (no framer-motion dep needed).

## Pass 3 — Depth

- **Persist assessment history**: on results mount, append `{id, date, mainSymptom, urgency, topCondition}` to `localStorage.mediCareHistory` (cap 20). Wire Home's "Recent assessments" to read from it. Add a `/history` route with the full list; each item routes to a new `/results/$id` that reads that snapshot.
- **Personalised daily tip**: if profile has conditions/allergies, prefer a tip from a matching pool (e.g. "asthma → pollen check"); otherwise generic.
- **Accessibility sweep**: `aria-label` on every icon-only button (mic — now removed —, pencil, edit, share, dismiss, close, back). Ensure severity picker is a `role="radiogroup"` with arrow-key navigation. Replace colour-only urgency cues on the severity picker with a small text label per band.
- **Loading skeletons**: skeleton cards for the AI thinking state on Results (if user lands on `/results` while `aiResult` is still null, e.g. deep-link) and for the map tile while location is being fetched.

## Technical notes

- All persistence uses `localStorage` (matches existing pattern in `profile-store.ts`, `travel-mode.ts`). Cloud not enabled — I won't wire it unless you ask.
- No new npm deps. Toast for "Saved ✓" / "Copied ✓" uses a tiny local component (fixed-position, auto-dismiss) to avoid pulling in a toast lib if one isn't already wired.
- Profile store gains: `name`, `bloodType`, `gpName`, `emergencyContact: { name, relationship, phone }`. Migration: existing keys read unchanged; new fields default to empty.
- The center-FAB nav means Assess is no longer a peer route in the grid — I'll implement it as a 5-column grid with slot 3 elevated; active state still highlights correctly on all routes.
- Page transitions are pure CSS (`@keyframes fade-slide-in`) applied to a route-keyed wrapper — no layout thrash on TanStack's default routing.

## What I will NOT do (unless you ask)

- Wire real authentication / Lovable Cloud (mentioned as a follow-up in the review).
- Wire real Web Speech API voice input (removed instead — safer than half-real).
- Build a "Share as PDF" export (Copy summary covers 90% of the use case with none of the complexity).
- Build stubs for Language / Privacy / Medical data / Support pages (marked "Coming soon" instead).

## Rollout order

I'll ship the passes in order, each as one implementation batch. If you want a smaller first cut, say "just Pass 1" and I'll stop there.
