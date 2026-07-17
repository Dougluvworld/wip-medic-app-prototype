## Bottom navigation: reorder + stabilise

### New order
`Home · Profile · [Assess FAB] · Care · Settings`

Rationale: left side = "who/where I am" (Home, Profile). Centre FAB = the primary action (Assess). Right side = "what to do next" (Care) and app config (Settings). Reads left-to-right as *identify → assess → act*.

### Consistency fix (nav shifting up/down between tabs)

The nav appears to move because of two subtle things in `src/components/BottomNav.tsx`:

1. The centre FAB uses `-mt-6` and the row uses `items-end`. When the Assess route is active, the FAB gets `scale-105`, nudging its visual baseline and making neighbouring items feel like they've shifted.
2. Row height isn't pinned — it's implied by the tallest child (the FAB). Any change to icon/label rendering per route can cause 1–2px drift.

Fix:
- Give the `<ul>` a fixed height (e.g. `h-16`) and use `items-center` instead of `items-end`, so all five slots share one baseline regardless of active state.
- Anchor the FAB with absolute positioning inside its centred grid cell (or `translate-y` from a fixed reference) so its "lift" no longer influences row height.
- Drop the `scale-105` active pulse on the FAB (or replace with a subtle ring) so the active state doesn't change its footprint.
- Keep `sticky bottom-0` + `pb-[env(safe-area-inset-bottom)]` unchanged.

### Files touched
- `src/components/BottomNav.tsx` — reorder items, pin row height, restructure FAB positioning, remove scale-on-active.

### Out of scope
- No route changes, no icon changes, no new tabs.
- No changes to page content or the FAB's gradient/styling beyond the active-state tweak.
