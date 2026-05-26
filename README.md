# Piletilevi Seatmap Prototype

A four-variant interactive seatmap exploration for the Piletilevi purchase flow.
Live on Vercel — see the routes below for each prototype.

## The four prototypes

| Route | What it explores |
| --- | --- |
| `/` | **v1** — curved/realistic mock layout with rotated rectangle sectors. The starting point. |
| `/v2` | **v2** — grid-aligned arena with a curved proscenium stage. Cleaner, more readable. |
| `/v3` | **v3** — Ticketmaster-style fan-shape sectors (Orchestra · Mezzanine · Balcony) built from `section_map.svg`. Sector → seat drill-down with SVG `viewBox` zoom animation. |
| `/v4` | **v4** — same fan canvas as v3, but **all seats visible up front** and a continuous multi-section ticket list (sticky headers, rows pre-expanded). Mobile floats a "Show all seats" pill that opens a bottom sheet. |

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle into dist/
```

Open VS Code on the project and accept the recommended extensions
(`.vscode/extensions.json`) — Tailwind IntelliSense, ESLint, Prettier and a
few others that make this codebase nicer to live in.

## `npm run pack` — single-file export for Figma Make

```bash
npm run pack     # writes proto-bundle.txt (~470 KB)
```

Figma Make ingests the entire prototype in one paste. The script walks `src/`
plus key config files (`package.json`, `vite.config.ts`, `tsconfig*.json`,
`index.html`, `vercel.json`) and concatenates them with `// === path ===`
headers. Output is gitignored — regenerate after every change.

## Code layout

```
src/app/
├── App.tsx                  # routing, AppBar, cart drawer, fixed action bar
├── components/
│   ├── VenueMap.tsx         # the seatmap (SVG + interactions). Drives all four variants.
│   ├── TicketList.tsx       # row-grouped ticket list. Flowing mode used in v4.
│   ├── FilterSidebar.tsx    # category / accessibility / price filters
│   ├── M3Button, M3Chip…    # brand primitives (Material You-flavoured)
│   └── Icon.tsx             # streamline-thin icon font wrapper
└── data/
    └── sectors.ts           # ⭐ sector layouts + procedural seat factory
```

**To add a new venue / change layout**, edit only `src/app/data/sectors.ts`.
Knobs:

- `sectorsV1` / `sectorsV2` — rectangle-and-rotation layouts
- `sectorsV3` — the fan-shape paths (used by both `/v3` and `/v4`)
- `generateSeats` — rows/cols/curve, status seeds, accessibility/limited-view/resale rules

## Prototype-only behaviours

| Feature | Trigger |
| --- | --- |
| Reservation timer | Starts after the first seat is held; runs in the AppBar. |
| Multi-user simulation | Toggle on the people icon in the AppBar (v3/v4 only). |
| Verify-at-checkout | Random 35% chance a seat gets "yanked" during cart verify. |
| Cart restore | Selected seats persist in `sessionStorage` and rehydrate on reload. |
| Access codes | Enter `CREW`, `PRESS`, or `PHANTOM` to unlock the hidden Press/Crew sector. |

## Deploy

```bash
vercel --prod --yes
```

Production URL is set as the default Vercel project for this repo. SPA
rewrites live in `vercel.json` so deep links like `/v4` work.

## Reusing this as a baseline

The fastest path to a new prototype:

```bash
npx degit <your-repo-url> new-proto && cd new-proto
npm install && npm run dev
```

Then:

1. Replace `src/assets/section_map.svg` and rework the path data in `src/app/data/sectors.ts`.
2. Recolour via the `categoryColors` map at the top of `src/app/data/sectors.ts`.
3. Brand tokens (poster, header copy, palette) all live in `App.tsx` and the
   theme block — search for `phantomPoster` and `#11002b` (brand navy) /
   `#06d373` (brand green) / `#7b5aa8` (brand purple).

## License

Internal prototype — not for redistribution.
