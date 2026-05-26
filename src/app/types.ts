// Shared types for the seatmap prototype.
// Components and data files import from here so VenueMap doesn't have to be
// the canonical location for every interface.

export type PriceCategory = 'vip' | 'premium' | 'standard' | 'balcony' | 'ga';

export type SeatStatus =
  | 'available'
  | 'unavailable'
  | 'selected'
  | 'pre-reserving'
  | 'reservation-failed'
  | 'reserved-by-other';

export interface Sector {
  id: string;
  name: string;
  localName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  priceCategory: PriceCategory;
  startingPrice: number;
  totalSeats: number;
  availableSeats: number;
  isGA?: boolean;
  accessible?: boolean;
  locked?: boolean;
  tableLayout?: boolean;
  /** Optional SVG path. When set, the sector renders as that path; x/y/w/h still drive label position. */
  path?: string;
  /** Optional label color override (when path background contrasts differently). */
  labelColor?: string;
}

export interface Seat {
  id: string;
  sectorId: string;
  sectorName: string;
  row: string;
  number: number | string;
  x: number;
  y: number;
  price: number;
  priceCategory: PriceCategory;
  status: SeatStatus;
  accessible?: boolean;
  limitedView?: boolean;
  resale?: boolean;
  note?: string;
  categories?: Array<{ id: string; label: string; price: number }>;
}

export interface SelectedSeat extends Seat {
  selectedCategory?: string;
  selectedCategoryLabel?: string;
}

export interface VenueFilters {
  priceRange: [number, number];
  categories: PriceCategory[];
  accessibleOnly: boolean;
  adjacentOnly: boolean;
  hideLimitedView: boolean;
}

export const DEFAULT_FILTERS: VenueFilters = {
  priceRange: [0, 320],
  categories: ['vip', 'premium', 'standard', 'balcony', 'ga'],
  accessibleOnly: false,
  adjacentOnly: false,
  hideLimitedView: false,
};

export interface MapState {
  selectedSectorName: string | null;
  view: 'overview' | 'detail' | 'pure';
  tableLayoutAvailable: boolean;
}

export interface MapHandle {
  selectBestAvailable: (count: number) => void;
  buyFullTable: () => void;
  clearBasket: () => void;
  /** Simulate another user claiming a random available seat in the currently open sector.
   *  Returns the seat description if one was taken, or null if no sector is open / nothing available. */
  claimRandomSeat: () => { seatId: string; label: string } | null;
}

/** Shared "resale" colour — pink stroke on seats and the per-sector dot on v3 overview. */
export const RESALE_COLOR = '#ec4899';
