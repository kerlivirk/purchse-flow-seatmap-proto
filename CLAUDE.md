# Claude project guide

This file is read by Claude Code on every session. Keep it short. Update it
when conventions change.

## What this is

A four-variant interactive seatmap prototype for the Piletilevi purchase flow.
Routes `/`, `/v2`, `/v3`, `/v4` each explore a different layout / interaction.

## Stack

- Vite + React 18 + TypeScript
- MUI v7 (Material) — `Box`, `Stack`, `Typography`, `IconButton`, …
- React Router 7 for the variant routes
- Tailwind utilities are available but most styling is MUI `sx`
- Vercel for hosting

## Code layout

```
src/app/
├── App.tsx                       # routing, AppBar, cart drawer, fixed action bar
├── types.ts                      # Sector, Seat, VenueFilters, MapHandle, RESALE_COLOR
├── utils.ts                      # formatTimer
├── data/
│   └── sectors.ts                # sectorsV1/v2/v3, categoryColors, generateSeats
└── components/
    ├── VenueMap.tsx              # seatmap orchestrator (overview SVG, desktop list, state)
    ├── VenueMap/
    │   ├── StageMarker.tsx       # always-visible left-edge STAGE pill
    │   ├── Minimap.tsx           # clickable back-to-venue thumbnail
    │   └── MobileBottomSheet.tsx # mobile drawer (v4 chips + flowing list; v3 single-sector)
    ├── TicketList.tsx            # row-grouped ticket list (supports flowing mode)
    ├── FilterSidebar.tsx         # category / accessibility / price filters
    ├── M3Button, M3Chip, ...     # brand primitives
    └── Icon.tsx                  # streamline-thin icon font wrapper
```

**Onboarding a new venue:** edit `src/app/data/sectors.ts` only.
**Refactor temptation:** prefer adding to `VenueMap/<NewSubComponent>.tsx` over
growing `VenueMap.tsx`.

## Brand palette

- Navy `#11002b` — primary text, "available" seat fill
- Green `#06d373` — selected seats, success accents, CTAs
- Purples `#9d85d0` (light) / `#7b5aa8` (mid) / `#54426e` (dark) — sector tiles
- Mauve `#a99db6` — sold / unavailable
- Gray-purple `#84738f` — held-by-others
- Pink `#ec4899` — resale stroke

Legend must always mirror these — both `VenueMap`'s in-map sidebar and
`FilterSidebar`.

## Workflows

| Goal | Command |
| --- | --- |
| Run dev server | `npm run dev` |
| Production build | `npm run build` |
| Bundle source for Figma Make | `npm run pack` → `proto-bundle.txt` |
| Deploy to Vercel | `vercel --prod --yes` |

## Things to know about working with this codebase

- **No headless browser in Claude sessions.** I (Claude) can't visually verify
  mobile rendering. The user has to spot-check on their phone or paste a
  screenshot. Don't claim "I checked it on mobile" without that.
- **Keep variants additive.** Don't break v1/v2/v3 while iterating on v4.
  Variant-specific code goes behind `variant === 'v4'` checks; shared code
  belongs in `data/sectors.ts` or `types.ts`.
- **`sessionStorage` cart persistence** is intentional, not a bug.
- **The "simulate other users" interval** is a demo behaviour. Don't remove it.
- **Edge-to-edge layout** on v3/v4 is intentional. No `Container`, no rounded
  `Paper`, no outer padding. v1/v2 keep the centered `Container` + `EventHeader`.
- **Mobile bottom sheet height math**: outer page uses `100dvh` + `overflow:
  hidden`. Main has `pb: calc(56px + env(safe-area-inset-bottom))`. The
  drawer is positioned `absolute` inside `VenueMap` (which is
  `position: relative`).

## Prototype-only behaviours

- Reservation timer starts after first held seat
- Multi-user simulation toggle (people icon in AppBar, v3/v4)
- Verify-at-checkout has a ~35% chance to "yank" a seat (intentional)
- Access codes `CREW`, `PRESS`, `PHANTOM` unlock the hidden crew sector

## Deployed URL

Production is on Vercel under `kerlivirk-8836s-projects` →
`purchse-flow-seatmap-proto`. The Vercel project is pre-linked
(`.vercel/project.json`).
