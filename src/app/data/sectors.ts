// Sector data + seat generation for all three layouts.
//
// Editing this file is how you "add a new venue":
//   - Tweak sectorsV1/v2 to change the box-and-rectangle layouts
//   - Edit sectorsV3 (used by /v3 and /v4) to swap the curved fan-shape sections
//   - generateSeats is the procedural seat factory — rows/cols/curve all live there
//
// Types stay in VenueMap.tsx so the public TS surface is unchanged.

import type { PriceCategory, Sector, Seat, SeatStatus } from '../components/VenueMap';

/** Fan-layout sectors derived from section_map.svg — viewBox 1280×900. */
export interface V3Sector extends Sector {
  /** Bounding rectangle where the seat dots get projected inside the sector path. */
  seatsBBox?: { x: number; y: number; w: number; h: number };
  /** The SVG viewBox rectangle to animate to when this sector is selected
   *  (screen-size independent). */
  focusBBox?: { x: number; y: number; w: number; h: number };
}

// ---------------------------------------------------------------------------
// Polar-coordinate helpers — used historically to lay out v3 wedges by hand.
// Kept in case future sector layouts want procedural wedge generation.
// ---------------------------------------------------------------------------

export const V3_CENTER = { cx: 450, cy: 0 };

export function polarPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy + r * Math.cos(rad) };
}

export function wedgePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const p1 = polarPoint(cx, cy, innerR, startDeg);
  const p2 = polarPoint(cx, cy, innerR, endDeg);
  const p3 = polarPoint(cx, cy, outerR, endDeg);
  const p4 = polarPoint(cx, cy, outerR, startDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

export function wedgeCentroid(cx: number, cy: number, innerR: number, outerR: number, startDeg: number, endDeg: number) {
  const midDeg = (startDeg + endDeg) / 2;
  const midR = (innerR + outerR) / 2;
  return polarPoint(cx, cy, midR, midDeg);
}

// ---------------------------------------------------------------------------
// Price-category palette — referenced from VenueMap and the legend.
// ---------------------------------------------------------------------------

export const categoryColors: Record<PriceCategory, string> = {
  vip: '#a855f7',
  premium: '#7c3aed',
  standard: '#6b7280',
  balcony: '#9ca3af',
  ga: '#4b5563',
};

// ---------------------------------------------------------------------------
// v1 — curved/realistic mock layout. Sectors are rotated rectangles.
// ---------------------------------------------------------------------------

export const sectorsV1: Sector[] = [
  { id: 'balcony', name: 'Balcony', localName: 'Balkon', x: 220, y: 132, width: 460, height: 72, rotation: 0, priceCategory: 'balcony', startingPrice: 99, totalSeats: 148, availableSeats: 118, accessible: true },
  { id: 'standard-left', name: 'Standard Left', localName: 'Standard vasak', x: 105, y: 250, width: 210, height: 112, rotation: -6, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 61 },
  { id: 'standard-center', name: 'Standard Center', localName: 'Standard kesk', x: 332, y: 238, width: 236, height: 118, rotation: 0, priceCategory: 'standard', startingPrice: 149, totalSeats: 126, availableSeats: 82, accessible: true },
  { id: 'standard-right', name: 'Standard Right', localName: 'Standard parem', x: 585, y: 250, width: 210, height: 112, rotation: 6, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 57 },
  { id: 'premium-left', name: 'Premium Left', localName: 'Premium vasak', x: 165, y: 390, width: 205, height: 118, rotation: -4, priceCategory: 'premium', startingPrice: 199, totalSeats: 72, availableSeats: 31, accessible: true },
  { id: 'premium-right', name: 'Premium Right', localName: 'Premium parem', x: 530, y: 390, width: 205, height: 118, rotation: 4, priceCategory: 'premium', startingPrice: 199, totalSeats: 72, availableSeats: 28, accessible: true },
  { id: 'vip-center', name: 'VIP Center', localName: 'VIP kesk', x: 350, y: 410, width: 200, height: 128, rotation: 0, priceCategory: 'vip', startingPrice: 299, totalSeats: 54, availableSeats: 18, accessible: true, tableLayout: true },
  { id: 'ga-floor', name: 'Standing GA', localName: 'Seisuala', x: 310, y: 560, width: 280, height: 88, rotation: 0, priceCategory: 'ga', startingPrice: 79, totalSeats: 220, availableSeats: 156, isGA: true },
  { id: 'crew-hidden', name: 'Press / Crew Hold', localName: 'Press / Crew', x: 720, y: 470, width: 120, height: 72, rotation: 10, priceCategory: 'vip', startingPrice: 0, totalSeats: 24, availableSeats: 24, locked: true },
];

// ---------------------------------------------------------------------------
// v2 — minimal grid-aligned layout. Sectors gently arc towards a curved stage
// (outer tiles tilt ±3°).
// ---------------------------------------------------------------------------

export const sectorsV2: Sector[] = [
  // Row 1 — Balcony (back, wide arc)
  { id: 'balcony', name: 'Balcony', localName: 'Balkon', x: 100, y: 130, width: 700, height: 80, rotation: 0, priceCategory: 'balcony', startingPrice: 99, totalSeats: 148, availableSeats: 118, accessible: true },
  // Row 2 — Standard L | C | R (outer tiles tilt slightly)
  { id: 'standard-left', name: 'Standard Left', localName: 'Standard vasak', x: 100, y: 232, width: 220, height: 120, rotation: -3, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 61 },
  { id: 'standard-center', name: 'Standard Center', localName: 'Standard kesk', x: 340, y: 232, width: 220, height: 120, rotation: 0, priceCategory: 'standard', startingPrice: 149, totalSeats: 126, availableSeats: 82, accessible: true },
  { id: 'standard-right', name: 'Standard Right', localName: 'Standard parem', x: 580, y: 232, width: 220, height: 120, rotation: 3, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 57 },
  // Row 3 — Premium L | VIP C | Premium R
  { id: 'premium-left', name: 'Premium Left', localName: 'Premium vasak', x: 100, y: 372, width: 220, height: 120, rotation: -3, priceCategory: 'premium', startingPrice: 199, totalSeats: 72, availableSeats: 31, accessible: true },
  { id: 'vip-center', name: 'VIP Center', localName: 'VIP kesk', x: 340, y: 372, width: 220, height: 120, rotation: 0, priceCategory: 'vip', startingPrice: 299, totalSeats: 54, availableSeats: 18, accessible: true, tableLayout: true },
  { id: 'premium-right', name: 'Premium Right', localName: 'Premium parem', x: 580, y: 372, width: 220, height: 120, rotation: 3, priceCategory: 'premium', startingPrice: 199, totalSeats: 72, availableSeats: 28, accessible: true },
  // Row 4 — Standing GA (closest to stage)
  { id: 'ga-floor', name: 'Standing GA', localName: 'Seisuala', x: 220, y: 512, width: 460, height: 100, rotation: 0, priceCategory: 'ga', startingPrice: 79, totalSeats: 220, availableSeats: 156, isGA: true },
  // Hidden access-code sector
  { id: 'crew-hidden', name: 'Press / Crew Hold', localName: 'Press / Crew', x: 100, y: 632, width: 220, height: 64, rotation: 0, priceCategory: 'vip', startingPrice: 0, totalSeats: 24, availableSeats: 24, locked: true },
];

// ---------------------------------------------------------------------------
// v3 / v4 — curved fan layout, paths and shapes derived from section_map.svg
// (viewBox 1280×900, stage on the LEFT, three concentric sections to the right).
// `seatsBBox` defines where the seat dots get projected. `focusBBox` is the
// viewBox to animate to when this sector is selected (screen-size independent).
// ---------------------------------------------------------------------------

export const sectorsV3: V3Sector[] = [
  {
    id: 'orchestra',
    name: 'Orchestra',
    localName: 'Orchestra',
    x: 200, y: 380, width: 280, height: 100, rotation: 0,
    priceCategory: 'standard',
    startingPrice: 149,
    totalSeats: 280,
    availableSeats: 215,
    accessible: true,
    path: 'M60 267 L240 151 L599 151 C640 284 641 501 599 730 L240 730 L60 614 C88 498 87 383 60 267 Z',
    seatsBBox: { x: 90, y: 200, w: 500, h: 480 },
    focusBBox: { x: 30, y: 130, w: 600, h: 620 },
  },
  {
    id: 'mezzanine',
    name: 'Mezzanine',
    localName: 'Mezzanine',
    x: 690, y: 380, width: 220, height: 100, rotation: 0,
    priceCategory: 'premium',
    startingPrice: 199,
    totalSeats: 200,
    availableSeats: 142,
    accessible: true,
    path: 'M625 151 L946 151 C998 279 1002 528 946 730 L624 730 C686 574 698 311 625 151 Z',
    seatsBBox: { x: 650, y: 200, w: 320, h: 480 },
    focusBBox: { x: 600, y: 130, w: 410, h: 620 },
  },
  {
    id: 'balcony',
    name: 'Balcony',
    localName: 'Balcony',
    x: 980, y: 380, width: 180, height: 100, rotation: 0,
    priceCategory: 'balcony',
    startingPrice: 99,
    totalSeats: 148,
    availableSeats: 96,
    path: 'M967 151 L1148 151 C1218 300 1220 575 1148 730 L967 730 C1049 574 1057 312 967 151 Z',
    seatsBBox: { x: 985, y: 200, w: 200, h: 480 },
    focusBBox: { x: 940, y: 130, w: 290, h: 620 },
  },
  // Hidden press / crew sector — small wedge tucked at the back
  {
    id: 'crew-hidden',
    name: 'Press / Crew Hold',
    localName: 'Press / Crew',
    x: 1180, y: 80, width: 80, height: 60, rotation: 0,
    priceCategory: 'vip',
    startingPrice: 0,
    totalSeats: 24,
    availableSeats: 24,
    locked: true,
    path: 'M1170 90 L1240 90 Q 1262 90 1262 110 L 1262 150 Q 1262 165 1240 165 L 1170 165 Z',
  },
];

// ---------------------------------------------------------------------------
// Seat factory — procedurally generates a deterministic set of seats inside a
// sector. Used as the source of truth for both the SVG seat dots and the
// TicketList row groupings.
//
// Knobs (edit here to change the look of every venue at once):
//   - rows / perRow              → grid density
//   - basePrice                  → derived from sector.startingPrice
//   - statusSeed thresholds      → how many seats are sold / held / available
//   - resale / accessible / limitedView rules
// ---------------------------------------------------------------------------

export function generateSeats(sector: Sector): Seat[] {
  const output: Seat[] = [];
  const rows = sector.tableLayout ? ['A', 'B', 'C', 'D', 'E', 'F'] : ['A', 'B', 'C', 'D', 'E', 'F', 'G', '0'];
  const perRow = sector.tableLayout ? 10 : 14;
  const basePrice = sector.startingPrice || 249;

  rows.forEach((row, rowIndex) => {
    for (let seatIndex = 0; seatIndex < perRow; seatIndex += 1) {
      const n = seatIndex === 0 && row === '0' ? 0 : seatIndex + 1;
      const centerOffset = Math.abs(seatIndex - (perRow - 1) / 2);
      const curve = Math.pow(centerOffset, 1.4) * 1.8;
      const statusSeed = (rowIndex * 17 + seatIndex * 11 + sector.id.length) % 19;
      const status: SeatStatus =
        statusSeed === 0 || statusSeed === 3
          ? 'unavailable'
          : statusSeed === 7
            ? 'reserved-by-other'
            : 'available';
      const accessible = rowIndex === rows.length - 1 && seatIndex < 2;
      const limitedView = rowIndex === 0 && (seatIndex === 0 || seatIndex === perRow - 1);
      const multi = sector.priceCategory === 'standard' && seatIndex > 4 && seatIndex < 9;
      const resale = status === 'available' && (statusSeed === 5 || statusSeed === 11);

      output.push({
        id: `${sector.id}-${row}-${n}`,
        sectorId: sector.id,
        sectorName: sector.name,
        row,
        number: n,
        x: 96 + seatIndex * 31,
        y: 96 + rowIndex * 32 + curve,
        price: limitedView
          ? Math.max(49, basePrice - 30)
          : resale
            ? Math.round(basePrice * 1.18)
            : basePrice,
        priceCategory: sector.priceCategory,
        status,
        accessible,
        limitedView,
        resale,
        note: limitedView ? 'Limited view: side angle' : accessible ? 'Wheelchair accessible seat' : undefined,
        categories: multi
          ? [
              { id: 'standard', label: 'Standard', price: basePrice },
              { id: 'discount', label: 'Discounted', price: Math.max(49, basePrice - 40) },
              { id: 'package', label: 'Fan package', price: basePrice + 55 },
            ]
          : undefined,
      });
    }
  });

  return output;
}
