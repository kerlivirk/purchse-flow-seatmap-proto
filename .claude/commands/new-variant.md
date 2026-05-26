---
description: Scaffold a new route variant (vN) by adding a sectors entry, wiring it into routing, the version switch, and VenueMap's variant union.
---

# New variant

Argument: the variant identifier, e.g. `v5`. If the user didn't pass one,
ask: "Which variant name should I scaffold? (e.g. `v5`)"

## Steps

1. **Update `src/app/components/VenueMap.tsx`**: extend the `variant` union
   type and the runtime checks. Search for `'v1' | 'v2' | 'v3' | 'v4'` —
   add the new variant. Update `gridLayout` / `fanLayout` / `allSeatsVisible`
   booleans if the new variant should follow v3 or v4 behaviour (ask the user
   which baseline to copy if it's not obvious).
2. **Update `src/app/App.tsx`**:
   - Add the new variant to the `variant: 'v1' | 'v2' | …` union (use sed
     with `replace_all`).
   - Add a `<Box component={Link} to="/vN" …>vN</Box>` chip inside
     `VersionSwitch` matching the existing pattern.
   - Add `<Route path="/vN" element={<MapLab variant="vN" />} />` above the
     other version routes.
3. **If the variant needs a new sector layout**, add a `sectorsVN` export to
   `src/app/data/sectors.ts` — usually start by copying `sectorsV3` and the
   `V3Sector` interface. Otherwise the new variant can reuse `sectorsV3`.
4. **Run `npm run build`** — fix any TS errors before reporting back.
5. **Don't commit or deploy** — leave that for the user, or instruct them to
   run `/ship` when they're happy.

## Output

Report:
- Which files were edited (one line each, with the variant route URL)
- Whether the new variant reuses sectorsV3 or needs a fresh data file
- Next step: open `localhost:5173/vN` (run `npm run dev` if not running)
