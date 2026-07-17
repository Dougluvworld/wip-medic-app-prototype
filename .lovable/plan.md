## Goal
Make the bottom navigation stay visible at the bottom of the screen while the user scrolls, and ensure scrollable content clears the nav so nothing is hidden.

## Current state
- `BottomNav` already uses `sticky bottom-0`.
- Each page is wrapped in `PhoneFrame`, whose inner `div` is the actual scroll container (`overflow-y-auto`).
- The nav is the last child of a `min-h-full flex-col` inside that scroll container.
- Long pages (e.g. Profile) scroll, so the nav could potentially be lost if sticky behaviour fails or if content ends exactly behind it.

## Proposed changes
1. **Convert `BottomNav` from `sticky` to `fixed` positioning** inside `PhoneFrame`’s scroll context, so it is reliably pinned to the bottom of the viewport/device frame regardless of which page is rendered.
2. **Add bottom safe-area padding** to the scrollable page content so the last form field/card/tip is not obscured by the nav.
3. **Keep the existing nav order and styling** (`Home · Care · [Assess FAB] · Profile · Settings`, fixed row height, centred FAB, active states).
4. **Verify across tabs** (Home, Profile, Care, Settings) that the nav stays put and content scrolls cleanly behind it.

## Technical notes
- `BottomNav` lives in `src/components/BottomNav.tsx`.
- `PhoneFrame` lives in `src/components/PhoneFrame.tsx`.
- The change is purely presentational; no business logic or route changes.
- On desktop the device frame is `md:max-h-[900px] md:overflow-hidden`, so fixed positioning must be relative to that frame, not the full viewport.

## Acceptance criteria
- Nav remains visible while scrolling on all main tabs.
- Last piece of content on each page is fully readable above the nav.
- No layout shift or jump when switching tabs.
- Typecheck passes.