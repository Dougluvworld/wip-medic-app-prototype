## Effortless sign-up + wired-in emergency contact

Replace the current 3-slide intro with a 3-step onboarding wizard that collects only what changes triage, plus an emergency contact that we actually use in the app. No auth, all `localStorage` (matches the current demo model).

## Flow

```text
Splash → 1. You (name)  → 2. Vitals (DOB, sex, allergies)  → 3. Emergency contact → /home
         autofocus         all optional, single screen        Android Contact Picker
         Skip →            Skip →                             or 2 fields · Skip →
```

Progress dots at top of every step. Every step has a **Skip** link that jumps straight to `/home` (still marks onboarded).

### Step 1 — You
- Single input: **Name** (autofocused, `autocomplete="given-name"`).
- Continue button, Skip link.

### Step 2 — A few vitals (all optional)
- **Date of birth** — native `<input type="date">` (mobile OSes render wheel pickers).
- **Biological sex** — segmented control: Female / Male / Other / Prefer not to say.
- **Known allergies** — preset chips (Penicillin, Peanuts, Latex, Shellfish, Ibuprofen, None) + free-text add.

### Step 3 — Emergency contact
- If `navigator.contacts` supported → big **"Pick from contacts"** button (Android). On success, name + phone auto-fill.
- Always available: two fields — **Name** (`autocomplete="name"`) and **Phone** (`autocomplete="tel"`, `inputmode="tel"`) so iOS keyboard suggests contacts.
- Optional **Relationship** chip (Partner, Parent, Sibling, Friend, Other).
- Small privacy line: "Stored only on this device. You can remove it any time in Profile."

## Wiring so the contact earns its place

- **Home header SOS pill** — when `emergencyContact.phone` exists, the pill's label becomes "Call [Name]" and `href="tel:..."` dials the contact. When empty, keeps the current country emergency number (999/911/112).
- **Results high-urgency band** — when `urgency === "High"` and a contact exists, add a secondary "Call [Name]" button next to the existing emergency-number call button.

That's it — no new screens, no shareable ICE card, no SMS. Two small surface changes so the field isn't dead weight.

## Files

- **Rewrite** `src/routes/onboarding.tsx` — 3-step wizard with progress dots + Skip. Uses `zod` for form validation.
- **New** `src/lib/contact-picker.ts` — typed wrapper around `navigator.contacts.select` with feature detection.
- **Update** `src/lib/profile-store.ts` — add `dob` field; clear the fake defaults ("Alex Morgan", "Asthma", etc.) so a new user starts blank.
- **Update** `src/routes/home.tsx` — SOS pill reads `emergencyContact` and swaps label + `tel:` target when present.
- **Update** `src/routes/results.tsx` — high-urgency band renders extra "Call [Name]" button when contact exists.

No new npm packages (`zod` already installed).

## Validation

- `zod` schema: name ≤ 60 chars, phone `^[+\d\s\-()]{5,20}$`, allergies ≤ 10 items × 40 chars.
- Manual pass: clear localStorage → splash → onboarding → skip all 3 → land on `/home` with no personal data leaked. Repeat filling every field → Home pill flips to "Call [Name]" → run a High-urgency assessment → Results shows both call buttons.

## Explicit non-goals

- No real auth / Google / Apple.
- No Apple Health / Google Fit (not available on web).
- No auto-SMS, no shareable ICE lockscreen card.
- No Lovable Cloud — everything stays in `localStorage`.
