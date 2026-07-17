# Frictionless onboarding + clearer condition ranking

Two focused changes. Presentation-only — no new data sources, no backend.

## 1. Onboarding: manual, but frictionless

Rework `src/routes/onboarding.tsx` so every field feels like one tap or is skippable.

- **Step 1 — You**: name input with `autocomplete="given-name"`, `autoFocus`, `enterKeyHint="next"`. Auto-detected locale shown as a small muted line ("We'll use UK units — tap to change") — no input required.
- **Step 2 — Vitals**:
  - DOB: native `type="date"` with `max={today}`. Age is derived, never asked separately (remove the `age` field from the flow; keep it in the type for back-compat).
  - Sex: 3-button segmented control (Female / Male / Prefer not to say).
  - Allergies: preset chips (Penicillin, Peanuts, Latex, Shellfish, Pollen, Dairy, Eggs, None) tap-to-add, plus a free-text add for anything else. Same chip pattern for conditions and medications if we surface them (kept optional).
- **Step 3 — Emergency contact**: unchanged Android Contact Picker + manual fallback already in place. Inputs get `inputmode="tel"` and `autocomplete="tel"` / `name`.
- **Every step**: large "Skip" link top-right, "Continue" primary button bottom. Progress dots stay.
- **Honesty line** on step 1, small and muted: "Browsers can't read health data from your phone, so we keep this manual and quick."
- No new deps. All values persist via existing `saveProfile()`.

## 2. Results: rank-based condition hierarchy

Rework the "Possible conditions" section in `src/routes/results.tsx` and the `likelihood()` helper.

- Sort by confidence (already done), then assign labels **by rank**, not by threshold:
  - Rank 1 → **"Most likely"** — filled primary pill, full-width confidence bar in primary.
  - Rank 2 → **"Also possible"** — outlined pill, half-width bar in accent.
  - Rank 3+ → **"Less likely"** — muted pill, thin muted bar.
- The confidence bar width uses the raw confidence relative to the top item's score, so the top is always visually dominant.
- Remove the raw "% confidence" from the chip; keep it in the small italic reasoning line for transparency ("…based on your allergy history · 72%").
- Card treatment reinforces hierarchy: rank-1 card gets a subtle primary ring/tint; rank-2 stays default; rank-3+ get reduced opacity on the header text.

Copy summary and history entry keep using the top item — no downstream changes.

## Files touched

- `src/routes/onboarding.tsx` — restructure steps, add chips, keyboard hints, honesty line, remove standalone age.
- `src/routes/results.tsx` — replace `likelihood()` with rank-based assignment, add bar element, restyle three ranks.
- `src/lib/profile-store.ts` — no schema change; `age` stays optional for back-compat but is no longer written.

## Explicit non-goals

- No Apple Health / Google Fit / native bridges (not possible in a web app).
- No auth, no Lovable Cloud.
- No changes to the AI prompt, urgency logic, or care recommendation.
- No file-import / vCard flow.
