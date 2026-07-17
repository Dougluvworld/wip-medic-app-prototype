Revert the bottom navigation order so Care returns to the left side and Profile sits next to Settings.

New order: **Home · Care · [Assess FAB] · Profile · Settings**

Changes in `src/components/BottomNav.tsx`:
- Update `leftItems` to: Home, Care.
- Update `rightItems` to: Profile, Settings.
- Keep the fixed-height row, centred FAB, and active-state styling already in place so the nav stays vertically consistent across tabs.

No other files or page content changes.