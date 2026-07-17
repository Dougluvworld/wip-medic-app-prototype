# Medi-Care QA review & recommendations

I went through every route (`/`, `/onboarding`, `/home`, `/assess`, `/results`, `/care`, `/care/$id`, `/profile`, `/settings`), the components, and the stores. Overall the prototype is in solid shape — clean design language, sensible flow, real AI wiring, red-flag safety, travel mode, history, personalisation, offline-first via localStorage. Below are the issues I found and what I'd change, ordered by impact. Nothing here is built yet — this is the review + proposal.

## 1. Blocking / correctness issues (fix first)

1. **Splash flashes on every load, and SSR mismatch risk.** `src/routes/index.tsx` reads `hasOnboarded()` in `useEffect`, then renders `null` until ready. On first paint the user sees a blank frame, then splash, then a redirect. Move the check into a small `useHydrated()` gate and render the splash markup immediately for the not-onboarded case; skip the null frame.
2. **`/results` history saves duplicates.** The `useEffect` in `results.tsx` (line 178) writes a history entry once per mount, but `useEffect` re-runs when `urgency` or `redFlag` change. The `saved` local flag is fine, but if the user comes back to `/results` from `/care`, a new entry is saved again. Guard by hashing (mainSymptom+startedAt) and skipping if the same assessment id is already the newest entry.
3. **Severity picker `aria-checked` is always false** (`assess.tsx` line 432). Screen readers can't tell which value is selected. Track the picked value and reflect it in `aria-checked`.
4. **`useState` initial `false` for `dark`** followed by `documentElement.classList.toggle("dark", dark)` after hydration causes a one-frame flash of light theme for dark users. Inline a tiny blocking script in `__root.tsx` `<head>` that reads `medi-care.dark` and sets the class before paint.
5. **`h-screen` used in splash** (`index.tsx`). On iOS Safari the URL bar makes this jump; replace with `h-dvh` (and `min-h-dvh`) across every full-screen container.
6. **Assessment "None" chip vs custom allergies.** In `StepVitals`, `toggle("None")` sets `["None"]` and wipes free-text entries. That's correct, but adding a custom allergy after "None" leaves the button visually inactive without warning. Auto-clear "None" on `addCustom`, done.
7. **`AI_TIMEOUT_MS = 25s`** with a spinner and no cancel option. Add an inline cancel button on `phase === "thinking"` that aborts and drops to the error state.
8. **Public routes are indexed except home.** All app routes set `robots: noindex`; the landing `/` doesn't — but it also doesn't set `og:image`. Add a static `og:image` for `/` and keep the current title/description.

## 2. Trust, safety & medical-app polish

The app is triage, not diagnosis — every screen needs to reinforce that without becoming noisy.

- **Persistent tiny disclaimer in results header** ("Guidance, not diagnosis") next to the Beta pill. Keep the long disclaimer at the bottom.
- **Emergency shortcut is easy to miss** on `/home` when the user has an emergency contact — the pill says "Call Sam" with no visual weight. Bump to a filled destructive button on `/results` red-flag paths (already good there) and consider a persistent floating SOS on `/assess` while any red-flag keyword has been detected mid-conversation.
- **Red-flag detection currently only runs at `finish()`.** Run it after every user message during `handleFreeText` too, so if someone types "crushing chest pain radiating to arm" as their first sentence we surface urgent care immediately, not after 6 more questions.
- **Copy summary** on `/results` is great for GP visits. Add a second button: "Save as PDF" (client-side, `window.print()` with a print stylesheet that hides nav/chrome). This is the single most-requested feature for real triage apps.
- **Privacy screen isn't real yet.** `/settings` shows "Manage permissions" and "Export or delete" as Soon. For an App Store review, add at least a real Export (dumps `localStorage` as JSON download) and Delete (wipes and returns to splash). Both are ~20 lines.

## 3. UX / interaction

- **`/assess` chat** doesn't let you edit a previous answer. Add a subtle "Edit" affordance on the last user bubble (rewinds `phase` and pops the last store entry). Users will type "no wait, it's been 3 days" without this.
- **Voice input hint.** The textarea says "Type your reply…". On mobile most users want dictation — hint with a mic icon that focuses the input and shows a "tap the mic on your keyboard" toast the first time.
- **Severity picker** is a 1-10 grid; on a 402px phone the buttons are 30px wide — under the 44px target. Switch to a slider with haptic-style tick labels, or a 5-button coarse picker that maps to 1/3/5/7/9.
- **Duration chips** wrap awkwardly on small screens. Two-column grid inside the pl-10 chat indent.
- **`/care` filters** currently include "All" plus 4 types, which overflow on small phones and produce a horizontal scroll with no scrollbar affordance. Show a fade-out gradient on the right edge as a discoverability cue.
- **Provider cards** never surface *why* one is ranked first. `scoreProvider` computes it — show a one-line "Recommended because it's open now and closest" on the top card only.
- **Booking on `/care/$id`** is a fake toast. Either move it to a proper bottom-sheet with time slots (still mock, but feels real) or label it "Request callback" so the interaction matches the outcome.
- **Onboarding "Skip"** dumps you to `/home` with an empty profile. Add a subtle inline "Complete later in Profile →" toast on skip so users know where the data lives.
- **Home greeting** uses `Date.getHours()` on both server and client — during SSR you can render a stale greeting for a user in a different timezone. Compute greeting client-only or drop it below the fold.

## 4. Design & visual craft

- **Typography feels defaulted.** The plan hints at `font-display` but the actual `styles.css` needs auditing. Commit to a real display pair (e.g. Instrument Serif for wordmark + Inter Tight for UI, or Söhne-alike). This is the single biggest lift to make it look like an App Store app.
- **Icon inconsistency.** Lucide icons at mixed `strokeWidth` values (`1.7`, `2`, `2.2`) across screens. Standardise on `1.75`.
- **Card shadows.** Everything uses `shadow-card` / `shadow-soft` / `shadow-float` — the layering is fine, but two adjacent cards on `/results` create a "sea of cards". Introduce more inline lists (dividers only) for secondary info like "Why this urgency" and "When to seek help".
- **Empty states are good.** Add one for `/care` when both `filter="All"` and location denied — offer a "Try demo location (Dublin)" button.
- **Dark mode.** Toggle exists but never audited. Screenshot every route in dark and fix contrast — most likely offenders: `bg-warning/20 text-warning-foreground`, `bg-destructive/15 text-destructive` chips.

## 5. Performance & code health

- **`useAssessment()` re-renders on every store write** via `useSyncExternalStore` with a broad selector. Split selectors so `/results` doesn't re-render mid-typing on `/assess`.
- **`providers` mock is 207 lines** imported by both `/care` and `/care/$id`. Fine for now, but move to a loader-fetched shape now so swapping in a real API later is a one-file change.
- **`ProviderMap`** — verify it doesn't SSR (Leaflet or similar); if it does, wrap in `<ClientOnly>` per the tanstack-execution-model note.
- **Console/network sanity pass.** Do a Playwright pass on every route in build:dev and fix any warnings/network 404s (favicons, source maps).
- **Bundle** — with 4.5k LOC and no obvious offenders, this should be well under 200kb gz. Verify with `bun run build` and add a `size-limit` budget.

## 6. Metadata & shareability

Every non-onboarded route sets `robots: noindex`, which is right, but the landing route should:
- add `og:title`, `og:description`, `og:image`, `twitter:card` (image lives at leaf, not `__root`);
- add JSON-LD `MedicalWebPage` schema;
- set a real `apple-touch-icon` and 512px maskable icon;
- ship a proper `manifest.webmanifest` so "Add to Home Screen" on iOS looks like a real app — this is the App Store-feel win.

## 7. Missing "real app" table stakes

Things reviewers will notice as soon as they open it:

- **No auth / no cross-device sync.** Position clearly as "This device only" everywhere data is saved (profile footer already does this — extend to history and settings).
- **No offline indicator.** If the AI call fails because the device is offline, show that specifically instead of "Couldn't finish reasoning".
- **No accessibility statement / T&Cs** in Settings. Two placeholder pages ("Terms" and "Privacy") wired from Settings satisfy App Store gates.
- **No `SafeArea` on landing splash.** Nav bar overlays content on iOS notch devices — the phone frame handles it, but `/` doesn't.
- **No haptics prompt or install prompt** for PWA install (`beforeinstallprompt`). Add a dismissable "Install Medi-Care" chip on `/home` for users on Android Chrome.

## Recommended order (small, shippable batches)

I'd tackle it as three passes so you always have a working, better build:

1. **Correctness pass** (§1 + a11y fixes from §3): SSR/theme flash, history dedupe, red-flag mid-chat, severity aria, cancel on thinking, `h-dvh`.
2. **Trust & polish pass** (§2 + §4): persistent tiny disclaimer, real Export/Delete, print/PDF summary, dark-mode audit, icon/shadow unification, typography commitment.
3. **App-store table stakes pass** (§6 + §7): manifest, icons, splash safe-area, install prompt, offline banner, placeholder Terms/Privacy pages, JSON-LD.

Tell me which pass to start (or pick individual items) and I'll implement it once you switch to build mode.
