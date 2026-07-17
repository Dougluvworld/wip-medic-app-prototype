Goal: Keep the Care tab discoverable, but make it feel purposeful before a user has completed a symptom assessment.

1. Add an empty-state banner to `/care` when no recent assessment exists
   - Friendly copy explaining that Care shows nearby pharmacies, GPs, urgent care and emergency departments.
   - Primary CTA: “Start a quick assessment” → links to `/assess`.
   - Secondary note: completing an assessment personalises the recommended care type.

2. Hide the assessment-driven recommendation banner when no recommendation exists
   - Currently `rec && !recDismissed` already guards it, but verify the fallback feels natural (no blank gap).

3. Make the Home shortcut contextual
   - Keep the “Find care” shortcut, but add a small hint when no assessment exists (e.g., subtitle changes from “Pharmacies, GPs, Emergency Depts” to “Browse nearby care” or similar).

4. Ensure the BottomNav remains unchanged structurally
   - Keep Home / Care / Assess (FAB) / Profile / Settings.
   - The change is in the Care screen content, not navigation topology.

5. Polish the Care screen when a recommendation *is* present
   - Keep the existing recommended-types filter and sorting logic.
   - Make the banner dismissible state persist only for the session (current behaviour) or optionally not dismissible for first-time visitors.

Out of scope:
- No new backend or data changes.
- No removal of the Care tab or route.
- No changes to the assessment flow itself.

Files likely touched:
- `src/routes/care.index.tsx`
- `src/routes/home.tsx` (minor subtitle tweak)