## Goal

Add a small theme toggle in the top-right of the app so users can flip between light and dark without hunting through Settings. Default to the OS/system setting so first launch at night opens dark automatically.

## Behaviour

- **Default (no user choice yet):** follow `prefers-color-scheme`. If the OS is dark, the app opens dark; if light, it opens light. Live-updates if the OS theme changes.
- **User taps the toggle:** overrides the system preference and persists their choice (light or dark). Reflected everywhere immediately.
- **Settings dark-mode row:** stays in sync with the toggle. Add a small "Use system" reset control there so users can return to the system-follow default.
- **No flash on load:** the pre-hydration script in `__root.tsx` is updated to apply dark if either the stored choice is dark OR (no stored choice AND system prefers dark).

## UI placement

- A single icon-only button (sun/moon from lucide) pinned to the top-right of the phone frame, above page content.
- Lives in `PhoneFrame` so it appears on every screen (Home, Care, Assess, Profile, Settings, Onboarding) without each route re-adding it.
- Sits inside the safe-area, ~12px from the top and right edges, with a subtle translucent background so it reads over any header art but doesn't compete with page titles.
- 40x40 tap target, aria-label toggles between "Switch to dark mode" / "Switch to light mode".

## Technical notes

- New `useTheme` hook centralises: read stored choice, fall back to `matchMedia('(prefers-color-scheme: dark)')`, expose `{ isDark, setTheme('light'|'dark'|'system') }`, toggle the `dark` class on `<html>`, persist to `medi-care.dark` with values `"1" | "0" | null` (null = follow system).
- Update `THEME_INIT_SCRIPT` in `src/routes/__root.tsx` to honour system preference when the stored value is missing.
- Refactor `settings.tsx` to consume the hook instead of owning its own state, and add a small "Follow system" text button next to the Dark mode row.
- Add `ThemeToggle` component and render it inside `PhoneFrame` as an absolutely-positioned overlay so it doesn't affect page layout.
- Purely presentational + client state; no routing, data, or business logic changes.

## Files touched

- `src/hooks/useTheme.ts` (new)
- `src/components/ThemeToggle.tsx` (new)
- `src/components/PhoneFrame.tsx` (mount the toggle)
- `src/routes/__root.tsx` (upgrade pre-hydration script)
- `src/routes/settings.tsx` (use the hook, add "Follow system")
