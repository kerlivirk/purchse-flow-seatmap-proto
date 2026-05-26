---
description: Open the latest production deploy in a browser with the device toolbar pre-loaded, and print a structured mobile-verification checklist for the user to walk through.
---

# Check mobile

**You (Claude) cannot visually verify mobile rendering in a default session.**
There is no headless browser available. This skill does the next best thing:
opens the prod deploy in the user's default browser and gives them a precise
checklist to walk through on their phone or in Chrome devtools.

## Steps

1. **Find the latest prod URL.** Run `vercel ls --prod 2>&1 | head -20` and
   extract the most recent `READY` URL. If `vercel ls` fails or the project
   isn't linked, ask the user for the URL.

2. **Check if Playwright is installed locally.**
   ```bash
   npx --no-install playwright --version 2>&1 | head -1
   ```
   - If installed → ask the user "Want me to capture screenshots at iPhone 14
     (390x844), iPhone SE (375x667), and iPad mini (768x1024)? I'll save them
     to `tmp/mobile-check/` and let you eyeball them." If yes, run a small
     Playwright script (write it to `tmp/mobile-check.mjs`, run, then remove)
     that loads each of `/`, `/v3`, `/v4` at each viewport and saves PNGs.
   - If not installed → skip. Don't install Playwright just for this.

3. **Open the URL in the user's default browser.**
   ```bash
   open "<url>/v4"
   ```
   Note in the response that the user should hit **Cmd+Opt+M** in Chrome (or
   **Develop → Responsive Design Mode** in Safari) to emulate a phone.

4. **Print the checklist** below. Adapt based on which variant the user wants
   to verify — default to v4 since it's the active one.

## Verification checklist

### v4 overview (`/v4`)

- [ ] **STAGE marker** is visible on the left edge of the map area (vertical
      navy pill reading "STAGE" bottom-to-top)
- [ ] **Sector labels** on Orchestra / Mezzanine / Balcony are readable —
      dark grey, ~18-28px in display size, with the ticket count + price
      line below
- [ ] **Section chips** (Orchestra / Mezzanine / Balcony with seat count) are
      visible above the bottom action bar without scrolling
- [ ] **"SHOW ALL SEATS" pill** straddles the drawer's top edge (half above,
      half on), brand navy with white text + up-chevron
- [ ] Tapping a **chip** zooms the map into that section and outlines the chip
- [ ] Tapping the **pill** opens the drawer to ~70% with a multi-section list,
      sticky section headers, rows pre-expanded; pill label changes to
      "HIDE SEATS"
- [ ] Map fills the area between AppBar and bottom action bar — no page
      scroll, no content hidden under the fixed bar

### v4 zoomed (tap a sector)

- [ ] **Minimap** appears (top-right on mobile, bottom-right on desktop). The
      focused sector is fully opaque with a navy outline; other sectors are
      dimmed to ~22%
- [ ] Tapping the **minimap** returns to the full overview, with the small
      "Back to venue" caption visible at the bottom of the thumbnail
- [ ] Zoom controls (+/-/reset) remain visible at the bottom-right of the map

### v3 (`/v3`)

- [ ] Sector tiles are visible with their labels (Orchestra / Mezzanine /
      Balcony), bottom sheet does **not** appear on overview
- [ ] Tapping a sector zooms in and reveals the seat overlay
- [ ] Bottom sheet appears with the single-sector TicketList; tap to expand

### General

- [ ] Cart pill in AppBar updates on seat selection; tapping it opens the
      cart drawer
- [ ] Reservation timer starts after the first seat is selected
- [ ] Simulate-other-users toggle (people icon in AppBar) flashes a red seat
      every ~3s when on

## Output

After running, summarise:

```
## Mobile check
- Latest deploy: <url>/v4
- Opened in browser: ✓
- Screenshots: (only if Playwright was available)
  - tmp/mobile-check/iphone-14-v4.png
  - tmp/mobile-check/iphone-se-v4.png
  - tmp/mobile-check/ipad-mini-v4.png
- Checklist: above — walk through on your phone and tell me anything that's off.
```

Remind the user explicitly: "I (Claude) cannot see what you see — paste a
screenshot if anything looks wrong."
