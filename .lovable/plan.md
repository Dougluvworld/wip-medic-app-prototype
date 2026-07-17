## Goal

Replace the fixed 5-question script + keyword matcher with an adaptive, clinically-aware assessment powered by Lovable AI. Users should feel the app is reasoning about *their* situation, not filling a template.

## What changes for the user

1. **Follow-ups adapt to the symptom.** After the main complaint, Medi asks 2–3 targeted questions (e.g. chest pain → "worse with breathing?", "spreading to arm/jaw?", "short of breath?").
2. **Red flags are checked first.** If answers trigger an emergency pattern (chest pain + shortness of breath, sudden "worst ever" headache, one-sided weakness, severe bleeding, difficulty breathing), the result jumps straight to High urgency with a call-emergency banner — no differential shown.
3. **Personal context is used.** Profile gains optional fields (age, sex at birth, pregnancy, chronic conditions, medications/allergies). These are sent with every assessment and shift the ranking.
4. **Results explain themselves.** Each condition shows a one-line "Because you said…" citation. Urgency banner shows the top 1–2 factors driving it.

## How it works

### Adaptive follow-ups (`src/lib/follow-ups.ts`, new)

- Map main-symptom keyword → 2–3 follow-up questions (chest pain, headache, abdominal pain, cough, rash, back pain, dizziness, sore throat, fever + a generic fallback).
- Each question is a short yes/no or short-text prompt with an example answer for the "Use example" button.
- Red-flag rules live in the same file: array of `{ trigger: (answers) => boolean, reason: string }`.

### Assessment flow (`src/routes/assess.tsx`, edit)

- Keep first prompt (main symptom, free text).
- After it: look up follow-ups for the detected area/symptom and ask each in turn. Fall back to the current duration/severity/additional questions when no specific set exists.
- Always end with severity (1–10) and duration.
- On finish: run red-flag rules → if any fire, skip AI call and mark the assessment High with the red-flag reason. Otherwise call the AI server function.

### AI reasoning (`src/lib/assessment.functions.ts`, new)

- `runAssessment` server function using `createServerFn` + Lovable AI Gateway (`openai/gpt-5.5`).
- Structured output via `Output.object` (provider built with `structuredOutputs: true`):
  ```
  { urgency: "Low"|"Medium"|"High",
    urgencyReasons: string[],
    conditions: [{ name, confidence: number, reasoning: string }],
    recommendedAction: string,
    whenToSeekHelp: string[] }
  ```
- System prompt: "You are a triage assistant. You do not diagnose. Rank plausible conditions and set urgency using the user's answers and profile. Cite the specific answer that justifies each condition."
- Falls back to the existing keyword matcher if the call errors (429/402/network).

### Profile fields (`src/routes/profile.tsx`, edit; `src/lib/assessment-store.ts`, edit)

- Add optional health-context section: Age, Sex at birth, Pregnancy (conditional), Chronic conditions (multi-select chips), Medications/allergies (free text).
- Persist to `localStorage` (no backend needed for the prototype).
- Merge into the assessment payload before the AI call.

### Results page (`src/routes/results.tsx`, edit)

- Render red-flag banner when triggered (uses `urgencyReasons`).
- Under each condition, show `reasoning` as small muted text ("Because you said…").
- Add "Personalised using your profile" chip if any profile fields were used.
- Keep existing urgency hero, care-type CTA, and disclaimer.
- Keep the keyword-matcher fallback rendering path.

## Files

- **New** `src/lib/follow-ups.ts` — symptom → follow-up questions map, red-flag rules.
- **New** `src/lib/assessment.functions.ts` — `runAssessment` server function calling Lovable AI.
- **New** `src/lib/ai-gateway.server.ts` — canonical Lovable AI Gateway provider helper (per knowledge file).
- **Edit** `src/lib/assessment-store.ts` — add `followUpAnswers`, `redFlags`, `aiResult`, `profile` fields.
- **Edit** `src/routes/assess.tsx` — branch into follow-ups, run red-flag screen, call `runAssessment` on finish.
- **Edit** `src/routes/profile.tsx` — add health-context form.
- **Edit** `src/routes/results.tsx` — render AI result with reasoning + red-flag banner; keep keyword fallback.

## Setup

- Enable Lovable AI (provision `LOVABLE_API_KEY`) — no user action required.
- No database, no Cloud tables. Profile stays in `localStorage` for now.

## Out of scope

- Persisting past assessments to a database (can add later if you want history across devices).
- Image upload for rashes/wounds.
- Any real clinical algorithm — this stays a prototype with clear "guidance only" disclaimers.

## Small caveat

Each finished assessment = one Lovable AI call (small credit cost). The red-flag path skips the call, so obvious emergencies are free and instant.

Ready to build?