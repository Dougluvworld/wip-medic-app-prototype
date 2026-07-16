
## Goal

Replace the current 5-step chip-picker `/assess` flow with a warm, chat-style symptom conversation — the way someone would describe things to a doctor — with a mic affordance for voice input. Prototype-only: no real AI call, no real transcription.

## UX flow

The AI assistant ("Medi") greets the user and asks one question at a time. The user replies via a chat composer. After ~5 exchanges the assistant summarises and offers a "View AI results" CTA that routes to the existing `/results` screen.

Scripted conversation (mock, deterministic):

1. Medi: "Hi 👋 I'm Medi. Tell me what's been bothering you — describe it in your own words."
2. User types free-text → parsed into `mainSymptom` (first meaningful phrase, capped ~60 chars).
3. Medi: "Thanks. Where in your body are you feeling this most?"
4. User replies → `bodyArea`.
5. Medi: "How long has this been going on?"
6. User replies → `duration`.
7. Medi: "On a scale of 1–10, how bad does it feel right now?"
8. User replies → `severity` (parseInt, clamped 1–10).
9. Medi: "Anything else you've noticed — fever, nausea, fatigue, anything?"
10. User replies → `additional` (split on commas).
11. Medi: recap card ("Here's what I've got: …") + primary CTA **View AI results** → `/results`.

State still flows into the existing `assessmentStore`, so `/results` and downstream screens keep working unchanged.

## Composer

- Rounded pill textarea, auto-grow (max 4 lines).
- Left: circular **mic button** (Lucide `Mic`). Tapping toggles a "listening…" state with an animated pulse ring for ~1.5s, then inserts a canned phrase into the input (prototype-only, no real STT). Tooltip: "Voice input (demo)".
- Right: send button (gradient, `ArrowUp` icon), disabled when empty.
- "Skip question" ghost link under composer for quick demo flow.

## Visual design

- Reuse `PhoneFrame`, `ScreenHeader` ("Symptom check", subtitle shows live step e.g. "Question 2 of 5"), and `BottomNav`.
- Assistant bubble: no background, avatar dot with Medi logo mark, body text in foreground token, subtle fade-in-up.
- User bubble: filled `primary` bg with `primary-foreground` text, right-aligned, max-w 78%.
- Typing indicator: three dots pulsing before each assistant message (400ms delay) to make it feel alive.
- Sticky composer with `backdrop-blur`, safe-area padding.
- Progress hairline at top of screen tracks question index (reuses existing gradient bar).

## Files

- **Rewrite** `src/routes/assess.tsx` — chat UI, local `messages` state (`{id, role, text}[]`), scripted `script` array driving next assistant prompt, mic mock, mapping to `assessmentStore`, final recap + CTA to `/results`.
- **No changes** to routing, `assessmentStore`, `mock-data`, `/results`, or other screens.
- **No new deps** — Lucide already available for `Mic`, `ArrowUp`, `SkipForward`.

## Out of scope

- Real AI call / real speech-to-text (business case says MVP prototype only, no backend).
- Persisting chat transcripts.
- Editing prior answers inline (user can restart via back button).
