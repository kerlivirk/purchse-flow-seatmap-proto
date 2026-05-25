import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Slider,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Accessible,
  ArrowBack,
  AutoAwesome,
  Close,
  ConfirmationNumber,
  FilterList,
  Fullscreen,
  InfoOutlined,
  LockOpen,
  Map as MapIcon,
  MyLocation,
  Search,
  ShoppingCart,
  Visibility,
  WarningAmber,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { TicketList } from './TicketList';
import { M3Button } from './M3Button';
import { M3Chip } from './M3Chip';
import { Icon } from './Icon';
import { SearchField } from './SearchField';
import { PillToggleGroup } from './PillToggleGroup';

export type PriceCategory = 'vip' | 'premium' | 'standard' | 'balcony' | 'ga';
export type SeatStatus = 'available' | 'unavailable' | 'selected' | 'pre-reserving' | 'reservation-failed' | 'reserved-by-other';

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

const RESALE_COLOR = '#ec4899';

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

interface VenueMapProps {
  selectedSeats?: SelectedSeat[];
  onSelectionChange?: (seats: SelectedSeat[]) => void;
  filters: VenueFilters;
  onFiltersChange: (next: VenueFilters) => void;
  /** v1 = curved/realistic layout. v2 = grid-aligned. v3 = grid + keyboard nav (must-haves build). */
  variant?: 'v1' | 'v2' | 'v3' | 'v4';
  /** Override the access-code field label (e.g. "Press code", "Sponsor code"). Defaults to "Access code". */
  accessCodeLabel?: string;
  /** Optional callback fired when the internal map state changes (selected sector, view, etc.). */
  onMapStateChange?: (state: MapState) => void;
  /** When true, the in-map bottom action bar is hidden (so the host page can render its own). */
  hideActionBar?: boolean;
  /** When true, hide the filter chip row inside the toolbar (used when the host renders a sidebar). */
  hideToolbarFilters?: boolean;
}

const colors: Record<PriceCategory, string> = {
  vip: '#a855f7',
  premium: '#7c3aed',
  standard: '#6b7280',
  balcony: '#9ca3af',
  ga: '#4b5563',
};

const sectorsV1: Sector[] = [
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

// v2: minimal arena layout — rows of sectors gently arc around a curved stage.
// Outer sectors tilt ±3° toward the stage so the rows read like a real venue.
const sectorsV2: Sector[] = [
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

// v3: curved fan layout matching the Ticketmaster Palace Theatre overview.
// Paths and decorations are derived from section_map.svg — viewBox 1280x900,
// stage on the LEFT, three concentric sections sweeping to the right.
const V3_CENTER = { cx: 450, cy: 0 };
function polarPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy + r * Math.cos(rad) };
}
function wedgePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number
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
function wedgeCentroid(cx: number, cy: number, innerR: number, outerR: number, startDeg: number, endDeg: number) {
  const midDeg = (startDeg + endDeg) / 2;
  const midR = (innerR + outerR) / 2;
  return polarPoint(cx, cy, midR, midDeg);
}
// v3 sectors derived from section_map.svg — 3 main sections in a fan layout.
// `seatsBBox` defines where seat dots land inside the sector. `focusBBox` is the
// viewBox rectangle used to "zoom into" the sector — independent of screen size.
interface V3Sector extends Sector {
  seatsBBox?: { x: number; y: number; w: number; h: number };
  focusBBox?: { x: number; y: number; w: number; h: number };
}
const sectorsV3: V3Sector[] = [
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

function generateSeats(sector: Sector): Seat[] {
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
      const status: SeatStatus = statusSeed === 0 || statusSeed === 3 ? 'unavailable' : statusSeed === 7 ? 'reserved-by-other' : 'available';
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
        price: limitedView ? Math.max(49, basePrice - 30) : resale ? Math.round(basePrice * 1.18) : basePrice,
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

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = Math.max(0, seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

export const VenueMap = forwardRef<MapHandle, VenueMapProps>(function VenueMap(
  { selectedSeats = [], onSelectionChange, filters, onFiltersChange, variant = 'v1', accessCodeLabel = 'Access code', onMapStateChange, hideActionBar = false, hideToolbarFilters = false }: VenueMapProps,
  ref
) {
  const gridLayout = variant === 'v2' || variant === 'v3' || variant === 'v4';
  const fanLayout = variant === 'v3' || variant === 'v4';
  const allSeatsVisible = variant === 'v4';
  const sectors = fanLayout ? sectorsV3 : gridLayout ? sectorsV2 : sectorsV1;
  const keyboardNav = variant === 'v3' || variant === 'v4';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [view, setView] = useState<'overview' | 'pure' | 'detail'>('overview');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);
  const [findOpen, setFindOpen] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [unlockedCrew, setUnlockedCrew] = useState(false);
  const [preReserving, setPreReserving] = useState<string[]>([]);
  const [failedSeats, setFailedSeats] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState('');
  const [categorySeat, setCategorySeat] = useState<SelectedSeat | null>(null);
  const setFilters = (next: VenueFilters | ((prev: VenueFilters) => VenueFilters)) => {
    onFiltersChange(typeof next === 'function' ? next(filters) : next);
  };

  const seats = useMemo(() => {
    if (selectedSector) return generateSeats(selectedSector);
    if (allSeatsVisible) {
      // v4: pre-generate seats for every non-locked sector so the overview shows them all
      return sectorsV3
        .filter((s) => !s.locked && (s as V3Sector).seatsBBox)
        .flatMap((s) => generateSeats(s));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSector, allSeatsVisible]);
  const [focusedSeatId, setFocusedSeatId] = useState<string | null>(null);
  const [hoveredSectorId, setHoveredSectorId] = useState<string | null>(null);
  const [dynamicReservedByOthers, setDynamicReservedByOthers] = useState<Set<string>>(new Set());
  const [flashSeats, setFlashSeats] = useState<Set<string>>(new Set());
  // Smoothly animated SVG viewBox for v3 zoom-to-sector
  const [animVB, setAnimVB] = useState<[number, number, number, number]>([0, 0, 1280, 900]);
  const [listSheetExpanded, setListSheetExpanded] = useState(false);
  // v4 advanced filters: per-sector visibility toggle (empty = all sectors visible)
  const [hiddenSectorIds, setHiddenSectorIds] = useState<Set<string>>(new Set());
  const toggleSectorVisibility = (id: string) => {
    setHiddenSectorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectedIds = new Set(selectedSeats.map((seat) => seat.id));
  const selectedTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const visibleSectors = sectors.filter((sector) => !sector.locked || unlockedCrew);

  const toggleCategoryFilter = (cat: PriceCategory) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter((c) => c !== cat) : [...prev.categories, cat],
    }));
  };

  const updateSelection = (next: SelectedSeat[]) => {
    onSelectionChange?.(next);
  };

  const startDrag = (clientX: number, clientY: number) => {
    setDragging(true);
    dragStart.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragging) return;
    setPan({ x: clientX - dragStart.current.x, y: clientY - dragStart.current.y });
  };

  const resetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const sectorFiltered = (sector: Sector) => {
    if (!filters.categories.includes(sector.priceCategory)) return true;
    if (sector.startingPrice < filters.priceRange[0] || sector.startingPrice > filters.priceRange[1]) return true;
    if (filters.accessibleOnly && !sector.accessible) return true;
    return false;
  };

  const seatFiltered = (seat: Seat) => {
    if (!filters.categories.includes(seat.priceCategory)) return true;
    if (seat.price < filters.priceRange[0] || seat.price > filters.priceRange[1]) return true;
    if (filters.accessibleOnly && !seat.accessible) return true;
    if (filters.hideLimitedView && seat.limitedView) return true;
    return false;
  };

  const matchingBySector = useMemo(() => {
    const map: Record<string, { available: number; resale: number }> = {};
    visibleSectors.forEach((sector) => {
      if (sectorFiltered(sector)) {
        map[sector.id] = { available: 0, resale: 0 };
        return;
      }
      if (sector.isGA) {
        map[sector.id] = { available: sector.availableSeats, resale: 0 };
        return;
      }
      const generated = generateSeats(sector);
      const matches = generated.filter((seat) => seat.status === 'available' && !seatFiltered(seat));
      map[sector.id] = { available: matches.length, resale: matches.filter((s) => s.resale).length };
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, unlockedCrew]);

  const maxMatching = useMemo(
    () => Math.max(1, ...Object.values(matchingBySector).map((entry) => entry.available)),
    [matchingBySector]
  );

  const openSector = (sector: Sector) => {
    if (sectorFiltered(sector)) return;
    if (sector.isGA) {
      reserveSeat({
        id: `ga-${Date.now()}`,
        sectorId: sector.id,
        sectorName: sector.name,
        row: 'GA',
        number: 1,
        x: sector.x,
        y: sector.y,
        price: sector.startingPrice,
        priceCategory: 'ga',
        status: 'available',
      });
      return;
    }

    setSelectedSector(sector);
    if (fanLayout) {
      // v3: stay on the overview map; zoom is handled by switching the SVG viewBox
      // (in renderOverview below). Reset CSS pan/zoom so the focus is purely viewBox-driven.
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setView('detail');
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const wouldCreateOrphan = (seat: Seat) => {
    const sameRow = seats.filter((s) => s.row === seat.row).sort((a, b) => Number(a.number) - Number(b.number));
    const index = sameRow.findIndex((s) => s.id === seat.id);
    const left = sameRow[index - 1];
    const right = sameRow[index + 1];
    const leftLeft = sameRow[index - 2];
    const rightRight = sameRow[index + 2];
    const usable = (s?: Seat) => !!s && !['unavailable', 'reserved-by-other'].includes(s.status) && !selectedIds.has(s.id);
    return (usable(left) && (!leftLeft || !usable(leftLeft))) || (usable(right) && (!rightRight || !usable(rightRight)));
  };

  const reserveSeat = (seat: Seat) => {
    if (selectedIds.has(seat.id)) {
      updateSelection(selectedSeats.filter((s) => s.id !== seat.id));
      return;
    }
    if (seat.status === 'unavailable' || seat.status === 'reserved-by-other' || preReserving.includes(seat.id)) return;
    if (wouldCreateOrphan(seat)) {
      setSnackbar('This selection would leave a single orphan seat. Choose adjacent seats or use Best Available.');
      return;
    }

    setPreReserving((prev) => [...prev, seat.id]);
    window.setTimeout(() => {
      setPreReserving((prev) => prev.filter((id) => id !== seat.id));
      const shouldFail = seat.id.endsWith('-13');
      if (shouldFail) {
        setFailedSeats((prev) => [...prev, seat.id]);
        setSnackbar('Reservation failed. Seat returned to available.');
        window.setTimeout(() => setFailedSeats((prev) => prev.filter((id) => id !== seat.id)), 1400);
        return;
      }

      const selected: SelectedSeat = {
        ...seat,
        status: 'selected',
        selectedCategory: seat.categories?.[0]?.id ?? seat.priceCategory,
        selectedCategoryLabel: seat.categories?.[0]?.label ?? seat.priceCategory.toUpperCase(),
      };
      updateSelection([...selectedSeats, selected]);
      if (seat.categories?.length) setCategorySeat(selected);
    }, 550);
  };

  // v3: arrow-key navigation across seats in the detail view
  useEffect(() => {
    if (!keyboardNav || view !== 'detail') return;
    const handler = (e: KeyboardEvent) => {
      if (!seats.length) return;
      const activeTag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      const rowList = Array.from(new Set(seats.map((s) => s.row)));
      let current = seats.find((s) => s.id === focusedSeatId) ?? null;
      if (!current) {
        current = seats.find((s) => s.status === 'available') ?? seats[0];
      }
      if (!current) return;
      const sameRow = seats
        .filter((s) => s.row === current!.row)
        .sort((a, b) => Number(a.number) - Number(b.number));
      const idxInRow = sameRow.findIndex((s) => s.id === current!.id);
      const rowIdx = rowList.indexOf(current.row);
      let next: Seat | undefined;
      switch (e.key) {
        case 'ArrowRight':
          next = sameRow[idxInRow + 1];
          break;
        case 'ArrowLeft':
          next = sameRow[idxInRow - 1];
          break;
        case 'ArrowDown':
          if (rowIdx < rowList.length - 1) {
            const target = rowList[rowIdx + 1];
            const candidates = seats.filter((s) => s.row === target).sort((a, b) => Number(a.number) - Number(b.number));
            next = candidates[Math.min(idxInRow, candidates.length - 1)];
          }
          break;
        case 'ArrowUp':
          if (rowIdx > 0) {
            const target = rowList[rowIdx - 1];
            const candidates = seats.filter((s) => s.row === target).sort((a, b) => Number(a.number) - Number(b.number));
            next = candidates[Math.min(idxInRow, candidates.length - 1)];
          }
          break;
        case 'Enter':
        case ' ':
          if (current.status === 'available') reserveSeat(current);
          e.preventDefault();
          return;
        default:
          return;
      }
      if (next) {
        setFocusedSeatId(next.id);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardNav, view, seats, focusedSeatId]);

  const selectBestAvailable = (count: number) => {
    if (!selectedSector && !allSeatsVisible) {
      const best = visibleSectors.find((s) => !s.isGA && !sectorFiltered(s) && s.availableSeats > 0) ?? visibleSectors[0];
      if (best) openSector(best);
      setSnackbar('Open a sector first, then Best Available will reserve seats in that section.');
      return;
    }

    const pool = seats
      .filter((seat) => seat.status === 'available' && !seatFiltered(seat) && !selectedIds.has(seat.id))
      .sort((a, b) => Math.abs(Number(a.number) - 7) - Math.abs(Number(b.number) - 7) || a.y - b.y)
      .slice(0, count);

    if (!pool.length) {
      setSnackbar('No matching seats available with current filters.');
      return;
    }

    pool.forEach((seat, index) => window.setTimeout(() => reserveSeat(seat), index * 120));
  };

  const buyFullTable = () => {
    if (!selectedSector?.tableLayout) return;
    const tableSeats = seats.filter((s) => s.status === 'available' && s.row === 'A').slice(0, 10);
    tableSeats.forEach((seat, index) => window.setTimeout(() => reserveSeat(seat), index * 90));
  };

  const applyAccessCode = () => {
    const valid = ['CREW', 'PRESS', 'PHANTOM'].includes(accessCode.trim().toUpperCase());
    setUnlockedCrew(valid);
    setSnackbar(valid ? 'Crew sector unlocked. Hidden prices are now visible.' : 'Invalid code. Try CREW or PRESS in the prototype.');
  };

  const changeSeatCategory = (value: string) => {
    if (!categorySeat?.categories) return;
    const cat = categorySeat.categories.find((item) => item.id === value);
    if (!cat) return;
    updateSelection(
      selectedSeats.map((seat) =>
        seat.id === categorySeat.id
          ? { ...seat, price: cat.price, selectedCategory: cat.id, selectedCategoryLabel: cat.label }
          : seat
      )
    );
    setCategorySeat({ ...categorySeat, price: cat.price, selectedCategory: cat.id, selectedCategoryLabel: cat.label });
  };

  const renderAdvancedFilters = () => {
    const visibleFanSectors = sectorsV3.filter((s) => !s.locked && (s as V3Sector).seatsBBox);
    const allOn = hiddenSectorIds.size === 0;
    const totalAvailable = visibleFanSectors
      .filter((s) => !hiddenSectorIds.has(s.id))
      .reduce((sum, s) => sum + (matchingBySector[s.id]?.available ?? 0), 0);
    return (
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid #e9e7ed', flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.5 }}>ADVANCED FILTERS</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{totalAvailable} matching</Typography>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5 }}>SECTIONS</Typography>
              <Box
                component="button"
                onClick={() => setHiddenSectorIds(new Set())}
                disabled={allOn}
                sx={{ background: 'transparent', border: 'none', color: allOn ? '#a99db6' : '#7b5aa8', fontWeight: 800, fontSize: 11, cursor: allOn ? 'default' : 'pointer', textDecoration: allOn ? 'none' : 'underline' }}
              >Show all</Box>
            </Stack>
            <Stack spacing={0.75}>
              {visibleFanSectors.map((s) => {
                const v3Color = s.id === 'mezzanine' ? '#7b5aa8' : '#9d85d0';
                const visible = !hiddenSectorIds.has(s.id);
                const avail = matchingBySector[s.id]?.available ?? 0;
                return (
                  <Box
                    key={s.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1,
                      py: 0.75,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: visible ? v3Color : '#e9e7ed',
                      bgcolor: visible ? `${v3Color}14` : '#fafafa',
                      transition: 'all 150ms',
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={visible}
                      onChange={() => toggleSectorVisibility(s.id)}
                      sx={{ p: 0.25, color: v3Color, '&.Mui-checked': { color: v3Color } }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.1 }} noWrap>{s.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {avail} tickets · from {s.startingPrice} PLN
                      </Typography>
                    </Box>
                    <Tooltip title={`Best 2 in ${s.name}`}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!visible || avail < 2}
                          onClick={() => { setSelectedSector(s); window.setTimeout(() => selectBestAvailable(2), 50); }}
                          sx={{ color: v3Color, '&.Mui-disabled': { color: '#d4d4d8' } }}
                        >
                          <AutoAwesome fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={() => openSector(s)}
                      sx={{ color: '#5a5062' }}
                      aria-label={`Open ${s.name}`}
                    >
                      <Icon name="tailless-line-arrow-right-5" size={14} />
                    </IconButton>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Divider sx={{ mx: 1.5, my: 0.5, borderColor: '#e9e7ed' }} />

          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>TICKET TYPE</Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {(['vip', 'premium', 'standard', 'balcony', 'ga'] as PriceCategory[]).map((cat) => {
                const active = filters.categories.includes(cat);
                return (
                  <Box
                    key={cat}
                    component="button"
                    onClick={() => toggleCategoryFilter(cat)}
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 100,
                      border: '1px solid',
                      borderColor: active ? '#11002b' : '#e9e7ed',
                      bgcolor: active ? '#11002b' : '#ffffff',
                      color: active ? '#ffffff' : '#11002b',
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >{cat}</Box>
                );
              })}
            </Stack>
          </Box>

          <Box sx={{ px: 1.5, pb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>ACCESSIBILITY</Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {[
                { key: 'accessibleOnly' as const, label: 'Accessible only' },
                { key: 'hideLimitedView' as const, label: 'Hide limited view' },
              ].map(({ key, label }) => {
                const active = (filters as any)[key];
                return (
                  <Box
                    key={key}
                    component="button"
                    onClick={() => setFilters({ ...filters, [key]: !active })}
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 100,
                      border: '1px solid',
                      borderColor: active ? '#11002b' : '#e9e7ed',
                      bgcolor: active ? '#11002b' : '#ffffff',
                      color: active ? '#ffffff' : '#11002b',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >{label}</Box>
                );
              })}
            </Stack>
          </Box>

          <Box sx={{ px: 1.5, pb: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5 }}>PRICE RANGE</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {filters.priceRange[0]}–{filters.priceRange[1]} PLN
              </Typography>
            </Stack>
            <Slider
              value={filters.priceRange}
              min={0}
              max={320}
              onChange={(_, value) => setFilters({ ...filters, priceRange: value as [number, number] })}
              sx={{ color: '#7b5aa8', py: 1 }}
            />
          </Box>

          <Divider sx={{ mx: 1.5, my: 0.5, borderColor: '#e9e7ed' }} />

          <Box sx={{ px: 1.5, py: 1, pb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>LEGEND</Typography>
            <Stack spacing={0.5}>
              {[['Available', '#11002b'], ['Selected', '#06d373'], ['Sold / locked', '#a99db6'], ['Held by others', '#84738f'], ['Resale', '#ec4899']].map(([label, color]) => (
                <Stack key={label} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: color }} />
                  <Typography variant="caption" sx={{ color: '#5a5062', fontWeight: 600 }}>{label}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderFilterPanel = () => (
    <>
      <Typography fontWeight={900} sx={{ mb: 0.5 }}>Advanced filters</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Categories are picked above in <strong>Select ticket type</strong>.
      </Typography>

      <Typography variant="body2" sx={{ mb: 1, fontWeight: 700 }}>Price range</Typography>
      <Slider value={filters.priceRange} min={0} max={320} valueLabelDisplay="auto" onChange={(_, value) => setFilters({ ...filters, priceRange: value as [number, number] })} sx={{ color: '#06d373' }} />
      <Typography variant="caption" color="text.secondary">{filters.priceRange[0]}–{filters.priceRange[1]} PLN</Typography>
      <Divider sx={{ my: 2, borderColor: '#e9e7ed' }} />
      <FormControlLabel control={<Checkbox checked={filters.accessibleOnly} onChange={(e) => setFilters({ ...filters, accessibleOnly: e.target.checked })} sx={{ color: '#71717a', '&.Mui-checked': { color: '#06d373' } }} />} label="Accessible only" />
      <FormControlLabel control={<Checkbox checked={filters.adjacentOnly} onChange={(e) => setFilters({ ...filters, adjacentOnly: e.target.checked })} sx={{ color: '#71717a', '&.Mui-checked': { color: '#06d373' } }} />} label="Only adjacent seats" />
      <FormControlLabel control={<Checkbox checked={filters.hideLimitedView} onChange={(e) => setFilters({ ...filters, hideLimitedView: e.target.checked })} sx={{ color: '#71717a', '&.Mui-checked': { color: '#06d373' } }} />} label="Hide limited view" />
      <Divider sx={{ my: 2, borderColor: '#e9e7ed' }} />
      <Typography fontWeight={800} sx={{ mb: 1 }}>{accessCodeLabel}</Typography>
      <Stack direction="row" spacing={1}>
        <TextField size="small" placeholder={accessCodeLabel} value={accessCode} onChange={(e) => setAccessCode(e.target.value)} InputProps={{ sx: { color: '#11002b' } }} />
        <M3Button onClick={applyAccessCode} buttonType="accent" size="sm" sx={{ minWidth: 48 }}><LockOpen /></M3Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">Prototype codes: CREW, PRESS, PHANTOM</Typography>
      <Divider sx={{ my: 2, borderColor: '#e9e7ed' }} />
      <Typography fontWeight={800} sx={{ mb: 1 }}>Legend</Typography>
      {[['Available', '#11002b'], ['Selected', '#06d373'], ['Sold / locked', '#a99db6'], ['Held by others', '#84738f'], ['Resale', '#ec4899']].map(([label, color]) => <Stack key={label} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}><Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: color }} /><Typography variant="caption">{label}</Typography></Stack>)}
    </>
  );

  const renderOverview = () => {
    const overviewVB = fanLayout ? `${animVB[0]} ${animVB[1]} ${animVB[2]} ${animVB[3]}` : '0 0 900 720';
    return (
    <svg width="100%" height="100%" viewBox={overviewVB} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="stageGradient" x1="0" x2="1">
          <stop offset="0%" stopColor="#e4e4e7" />
          <stop offset="100%" stopColor="#06d373" />
        </linearGradient>
        <filter id="softShadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.10" /></filter>
        {/* Per-v3-sector clip paths so seat dots stay inside the sector outline */}
        {fanLayout && sectorsV3.filter((s) => s.path).map((s) => (
          <clipPath id={`sectorClip-${s.id}`} key={s.id}><path d={s.path!} /></clipPath>
        ))}
      </defs>

      {fanLayout ? (
        <>
          {/* v3 — logical grey hierarchy:
              outer "outside venue" → no fill (uses the Paper white behind)
              walls / structure     → gray-100 #f4f2f5
              audience floor        → gray-50  #f8f8fa (subtle lift over walls)
              stage slice           → brand dark navy #11002b */}
          <rect width="1280" height="900" fill="#ffffff" />
          <polygon points="0,0 330,0 640,130 1165,120 1280,360 1280,900 0,900" fill="#f4f2f5" />
          <polygon points="0,98 96,0 285,0 620,120 620,772 310,892 108,892 0,782" fill="#f8f8fa" />
          <polygon points="624,120 1165,120 1235,240 1235,620 1165,760 624,760" fill="#f8f8fa" />
          {/* stage block on the left — brand navy with "STAGE" label so direction is always clear */}
          <g>
            <path d="M0 250 L42 285 C76 400 76 500 42 615 L0 650 Z" fill="#11002b" />
            <text x="22" y="450" fill="#ffffff" fontSize="20" fontWeight="900" letterSpacing="5" textAnchor="middle" transform="rotate(-90 22 450)">STAGE</text>
          </g>
          {/* box callouts — muted brand purple-grey instead of pure grey */}
          <g>
            <path d="M121 17 L294 17 L315 69 L252 68 C234 75 217 74 202 66 C176 72 152 70 137 58 C128 48 122 33 121 17 Z" fill="#84738f" />
            <text x="217" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">BALCONY</text>
            <text x="217" y="50" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">BOX RIGHT</text>
            <path d="M130 85 L215 85 L236 136 L172 136 C150 132 136 116 130 85 Z" fill="#84738f" />
            <text x="183" y="108" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">MEZZANINE</text>
            <text x="183" y="122" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">BOX RIGHT</text>
            <path d="M130 797 L215 797 L238 746 L171 746 C150 750 137 766 130 797 Z" fill="#84738f" />
            <text x="184" y="768" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">MEZZANINE</text>
            <text x="184" y="782" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">BOX LEFT</text>
            <path d="M121 864 L294 864 L315 813 L253 814 C235 807 217 808 202 816 C177 810 153 813 138 824 C128 834 122 849 121 864 Z" fill="#84738f" />
            <text x="217" y="831" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">BALCONY</text>
            <text x="217" y="848" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">BOX LEFT</text>
          </g>
          {/* overhang guide lines — subtle, only readable on close inspection */}
          <g>
            <path d="M322 37 H966 V151" stroke="#c1bacb" strokeWidth="1" fill="none" />
            <polygon points="310,37 322,30 322,44" fill="#a99db6" />
            <text x="540" y="33" fontSize="11" fontWeight="700" fill="#84738f" letterSpacing="0.5">BALCONY OVERHANG</text>
            <path d="M244 110 H622 V151" stroke="#c1bacb" strokeWidth="1" fill="none" />
            <polygon points="232,110 244,103 244,117" fill="#a99db6" />
            <text x="323" y="106" fontSize="11" fontWeight="700" fill="#84738f" letterSpacing="0.5">MEZZANINE OVERHANG</text>
            <path d="M244 771 H622 V738" stroke="#c1bacb" strokeWidth="1" fill="none" />
            <polygon points="232,771 244,764 244,778" fill="#a99db6" />
            <text x="323" y="787" fontSize="11" fontWeight="700" fill="#84738f" letterSpacing="0.5">MEZZANINE OVERHANG</text>
            <path d="M322 843 H966 V730" stroke="#c1bacb" strokeWidth="1" fill="none" />
            <polygon points="310,843 322,836 322,850" fill="#a99db6" />
            <text x="540" y="861" fontSize="11" fontWeight="700" fill="#84738f" letterSpacing="0.5">BALCONY OVERHANG</text>
          </g>
        </>
      ) : gridLayout ? (
        <>
          {/* v2: curved proscenium stage at the very top */}
          <rect x="0" y="0" width="900" height="720" fill="#ffffff" />
          <path
            d="M 220 80 Q 220 30 280 30 L 620 30 Q 680 30 680 80 L 680 80 Z"
            fill="#11002b"
          />
          <text x="450" y="62" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="800" letterSpacing="2">STAGE</text>
          <path d="M 110 110 Q 450 86 790 110" stroke="#e9e7ed" strokeWidth="1.5" fill="none" />
          <path d="M 220 660 Q 450 640 680 660" stroke="#f4f2f5" strokeWidth="2" fill="none" />
        </>
      ) : (
        <>
          <rect x="0" y="0" width="900" height="720" fill="#ffffff" />
          <text x="450" y="34" textAnchor="middle" fill="#5a5062" fontSize="14" fontWeight="700">Click a section to drill down</text>
          <rect x="250" y="58" width="400" height="58" rx="18" fill="url(#stageGradient)" filter="url(#softShadow)" />
          <text x="450" y="94" textAnchor="middle" fill="white" fontSize="22" fontWeight="800">STAGE / SCREEN</text>
          <path d="M90 190 C240 105, 660 105, 810 190" stroke="#a855f7" strokeWidth="2" fill="none" opacity="0.45" />
          <path d="M70 690 C220 610, 680 610, 830 690" stroke="#d4d4d8" strokeWidth="4" fill="none" opacity="0.8" />
        </>
      )}

      {visibleSectors.map((sector) => {
        const disabled = sectorFiltered(sector);
        const match = matchingBySector[sector.id] ?? { available: 0, resale: 0 };
        const noMatches = !disabled && match.available === 0 && !sector.isGA;
        const isHovered = hoveredSectorId === sector.id;
        // v3 fan layout uses the Piletilevi brand purple palette
        const v3BaseColor = sector.id === 'mezzanine' ? '#7b5aa8' : sector.id === 'orchestra' || sector.id === 'balcony' ? '#9d85d0' : '#5a5062';
        const v3HoverColor = sector.id === 'mezzanine' ? '#54426e' : sector.id === 'orchestra' || sector.id === 'balcony' ? '#7b5aa8' : '#5a5062';
        const v3Color = isHovered ? v3HoverColor : v3BaseColor;
        const isSelectedInFan = fanLayout && selectedSector?.id === sector.id;
        // For the selected sector in v3, render a very light tint so seats stand out.
        const baseFill = disabled || noMatches ? '#d4d4d8' : fanLayout ? v3Color : colors[sector.priceCategory];
        const fill = isSelectedInFan ? '#f3f2fc' : baseFill;
        const matchRatio = Math.min(1, match.available / maxMatching);
        let tileOpacity = disabled ? 0.18 : noMatches ? 0.22 : 0.55 + matchRatio * 0.45;
        // v3: when a sector is selected, fade out the others so seats can read over them
        if (fanLayout && selectedSector && selectedSector.id !== sector.id) tileOpacity = allSeatsVisible ? 0 : 0.15;
        if (isSelectedInFan) tileOpacity = 1; // very light fill, fully opaque — acts as a clean background
        // v4: in overview, render sectors as a soft outline only so the seats are the focus
        if (allSeatsVisible && !selectedSector) tileOpacity = hiddenSectorIds.has(sector.id) ? 0.04 : 0.08;
        const labelCx = sector.path ? sector.x + sector.width / 2 : sector.width / 2;
        const labelCy = sector.path ? sector.y + sector.height / 2 : sector.height / 2;
        return (
          <g
            key={sector.id}
            role="button"
            tabIndex={0}
            transform={sector.path ? undefined : `translate(${sector.x} ${sector.y}) rotate(${sector.rotation} ${sector.width / 2} ${sector.height / 2})`}
            onClick={() => openSector(sector)}
            onKeyDown={(e) => e.key === 'Enter' && openSector(sector)}
            onMouseEnter={() => setHoveredSectorId(sector.id)}
            onMouseLeave={() => setHoveredSectorId((id) => (id === sector.id ? null : id))}
            style={{ cursor: disabled || noMatches ? 'not-allowed' : 'pointer', transition: 'opacity 150ms' }}
          >
            {sector.path ? (
              <path
                d={sector.path}
                fill={fill}
                opacity={tileOpacity}
                stroke={isSelectedInFan ? '#7b5aa8' : sector.accessible ? '#06d373' : 'transparent'}
                strokeWidth={isSelectedInFan ? 2.5 : fanLayout ? 2 : 1}
              />
            ) : (
              <rect width={sector.width} height={sector.height} rx={gridLayout ? 14 : 12} fill={fill} opacity={tileOpacity} stroke={sector.accessible ? '#06d373' : 'transparent'} strokeWidth={gridLayout ? 1 : 1.5} filter={gridLayout ? undefined : 'url(#softShadow)'} />
            )}
            {fanLayout ? (
              isSelectedInFan ? null : allSeatsVisible ? (
                // v4: dark-grey sector label tucked above the seats. Font sizes are larger than
                // they look on desktop because the SVG (1280×900) scales down hard on mobile —
                // these end up readable on a 360px viewport.
                !hiddenSectorIds.has(sector.id) && (
                  <g style={{ pointerEvents: 'none' }}>
                    <text x={labelCx} y={176} textAnchor="middle" fill="#3f3146" fontSize="28" fontWeight="900" letterSpacing="2">{sector.name.toUpperCase()}</text>
                    <text x={labelCx} y={198} textAnchor="middle" fill="#7a6e88" fontSize="16" fontWeight="700">
                      {`${match.available} tickets · from ${sector.startingPrice} PLN`}
                    </text>
                  </g>
                )
              ) : (
                <>
                  <text x={labelCx} y={labelCy - 6} textAnchor="middle" fill="white" fontSize="30" fontWeight="700" letterSpacing="1">{sector.name.toUpperCase()}</text>
                  <text x={labelCx} y={labelCy + 22} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="16" fontWeight="600">
                    {sector.locked && !unlockedCrew ? 'Code required' : `${match.available}+ tickets · from ${sector.startingPrice} PLN`}
                  </text>
                </>
              )
            ) : gridLayout ? (
              <>
                <text x={labelCx} y={labelCy - 2} textAnchor="middle" fill="white" fontSize="13" fontWeight="800" letterSpacing="0.5">{sector.name}</text>
                <text x={labelCx} y={labelCy + 14} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="10" fontWeight="600">
                  {sector.locked && !unlockedCrew ? 'Code required' : sector.isGA ? `from ${sector.startingPrice} PLN` : `${match.available} seats · from ${sector.startingPrice} PLN`}
                </text>
              </>
            ) : (
              <>
                <text x={labelCx} y={labelCy + 1} textAnchor="middle" fill="white" fontSize="13" fontWeight="800">{sector.name}</text>
                <text x={labelCx} y={labelCy + 16} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="10" fontWeight="600">
                  {sector.locked && !unlockedCrew ? 'Code required' : sector.isGA ? `GA · from ${sector.startingPrice} PLN` : `${match.available} · from ${sector.startingPrice} PLN`}
                </text>
              </>
            )}
            {/* Resale dot: positioned at the top-right of either the bbox (path) or the local rect */}
            {match.resale > 0 && !disabled && !noMatches && (
              sector.path
                ? <circle cx={sector.x + sector.width - 14} cy={sector.y + 14} r={fanLayout ? 10 : 7} fill={RESALE_COLOR} stroke="white" strokeWidth="2" />
                : <circle cx={sector.width - 18} cy={18} r="7" fill={RESALE_COLOR} stroke="white" strokeWidth="2" />
            )}
            {/* Accessible glyph */}
            {sector.accessible && (
              sector.path
                ? <text x={sector.x + 16} y={sector.y + 24} fill="white" fontSize={fanLayout ? 22 : 17}>♿</text>
                : <text x="18" y="24" fill="white" fontSize="17">♿</text>
            )}
            {sector.tableLayout && !sector.path && <text x={sector.width - 26} y="25" fill="white" fontSize="16">▦</text>}
          </g>
        );
      })}

      {fanLayout && (
        <>
          {/* aisles between sectors — match the "floor" colour so they read as gaps in seating */}
          {!selectedSector && <>
            <path d="M600 151 C648 285 649 506 600 730 L624 730 C686 574 698 311 625 151 Z" fill="#f8f8fa" pointerEvents="none" />
            <path d="M946 151 C998 279 1002 528 946 730 L967 730 C1049 574 1057 312 967 151 Z" fill="#f8f8fa" pointerEvents="none" />
            <path d="M466 643 L630 643 C621 678 610 708 599 730 L438 730 Z" fill="#e9e7ed" pointerEvents="none" />
            <path d="M893 630 L997 630 C985 670 968 704 946 730 L846 730 C866 697 882 664 893 630 Z" fill="#e9e7ed" pointerEvents="none" />
          </>}
          {/* v4 overview: render seats from every sector at once, each clipped to its own sector path */}
          {allSeatsVisible && !selectedSector && (() => {
            const SRC = { x0: 96, x1: 96 + 13 * 31, y0: 96, y1: 96 + 7 * 32 };
            const sectorsWithSeats = sectorsV3.filter((s) => (s as V3Sector).seatsBBox && (!s.locked || unlockedCrew) && !hiddenSectorIds.has(s.id));
            return sectorsWithSeats.map((sector) => {
              const bbox = (sector as V3Sector).seatsBBox!;
              const project = (sx: number, sy: number) => ({
                x: bbox.x + ((sx - SRC.x0) / (SRC.x1 - SRC.x0)) * bbox.w,
                y: bbox.y + ((sy - SRC.y0) / (SRC.y1 - SRC.y0)) * bbox.h,
              });
              const sectorSeats = seats.filter((s) => s.sectorId === sector.id && !seatFiltered(s));
              return (
                <g
                  key={`overview-${sector.id}`}
                  clipPath={`url(#sectorClip-${sector.id})`}
                  onClick={() => openSector(sector)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* invisible hit area so users can click empty parts of the sector to zoom */}
                  <path d={sector.path!} fill="transparent" />
                  {sectorSeats.map((seat) => {
                    const p = project(seat.x, seat.y);
                    const selected = selectedIds.has(seat.id);
                    const loading = preReserving.includes(seat.id);
                    const failed = failedSeats.includes(seat.id);
                    const claimedByOther = dynamicReservedByOthers.has(seat.id) || seat.status === 'reserved-by-other';
                    const flashing = flashSeats.has(seat.id);
                    const isResale = seat.resale && seat.status === 'available' && !claimedByOther;
                    const effectivelyAvailable = seat.status === 'available' && !claimedByOther;
                    const seatFill = flashing ? '#ff0032' : failed ? '#ef4444' : loading ? '#c084fc' : selected ? '#06d373' : seat.status === 'unavailable' ? '#a99db6' : claimedByOther ? '#84738f' : '#11002b';
                    const seatStroke = selected ? '#11002b' : isResale ? RESALE_COLOR : 'transparent';
                    return (
                      <g
                        key={seat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (effectivelyAvailable) reserveSeat(seat);
                        }}
                        style={{ cursor: effectivelyAvailable ? 'pointer' : 'not-allowed', transition: 'fill 200ms' }}
                      >
                        <circle cx={p.x} cy={p.y} r={selected ? 4.5 : 3.5} fill={seatFill} stroke={seatStroke} strokeWidth={isResale && !selected ? 1.2 : 1} />
                        {flashing && <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#ff0032" strokeWidth="1.5" opacity="0.6" />}
                      </g>
                    );
                  })}
                </g>
              );
            });
          })()}
          {/* Seat dots overlay — shown when a v3 sector is selected (zoom-in reveal) */}
          {selectedSector && (selectedSector as V3Sector).seatsBBox && (() => {
            const bbox = (selectedSector as V3Sector).seatsBBox!;
            // Source seat coordinate ranges from generateSeats (renderSeats coord space)
            const SRC = { x0: 96, x1: 96 + 13 * 31, y0: 96, y1: 96 + 7 * 32 };
            const project = (sx: number, sy: number) => ({
              x: bbox.x + ((sx - SRC.x0) / (SRC.x1 - SRC.x0)) * bbox.w,
              y: bbox.y + ((sy - SRC.y0) / (SRC.y1 - SRC.y0)) * bbox.h,
            });
            return (
              <g clipPath={`url(#sectorClip-${selectedSector.id})`}>
                {seats.filter((s) => !seatFiltered(s)).map((seat) => {
                  const p = project(seat.x, seat.y);
                  const selected = selectedIds.has(seat.id);
                  const loading = preReserving.includes(seat.id);
                  const failed = failedSeats.includes(seat.id);
                  const claimedByOther = dynamicReservedByOthers.has(seat.id) || seat.status === 'reserved-by-other';
                  const flashing = flashSeats.has(seat.id);
                  const isResale = seat.resale && seat.status === 'available' && !claimedByOther;
                  const effectivelyAvailable = seat.status === 'available' && !claimedByOther;
                  const seatFill = flashing ? '#ff0032' : failed ? '#ef4444' : loading ? '#c084fc' : selected ? '#06d373' : seat.status === 'unavailable' ? '#a99db6' : claimedByOther ? '#84738f' : '#11002b';
                  const seatStroke = selected ? '#11002b' : isResale ? RESALE_COLOR : 'transparent';
                  return (
                    <g
                      key={seat.id}
                      onClick={() => effectivelyAvailable && reserveSeat(seat)}
                      style={{ cursor: effectivelyAvailable ? 'pointer' : 'not-allowed', transition: 'fill 200ms' }}
                    >
                      <circle cx={p.x} cy={p.y} r={selected ? 7 : 6} fill={seatFill} stroke={seatStroke} strokeWidth={isResale && !selected ? 2 : 1.5} />
                      {loading && <circle cx={p.x} cy={p.y} r="10" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="3 3"><animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="1s" repeatCount="indefinite" /></circle>}
                      {flashing && <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="#ff0032" strokeWidth="2" opacity="0.6" />}
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </>
      )}

      {fanLayout ? null : gridLayout ? (
        <>
          {/* v2/v3 venue annotations — small grey labels with arrow hints */}
          <text x="60" y="350" fill="#84738f" fontSize="11" fontWeight="600" letterSpacing="0.5">← ENTRANCE B</text>
          <line x1="60" y1="358" x2="100" y2="358" stroke="#dbd7e2" strokeWidth="1" />
          <text x="840" y="350" fill="#84738f" fontSize="11" fontWeight="600" letterSpacing="0.5" textAnchor="end">STAIRS →</text>
          <line x1="800" y1="358" x2="840" y2="358" stroke="#dbd7e2" strokeWidth="1" />
          <text x="60" y="600" fill="#84738f" fontSize="11" fontWeight="600" letterSpacing="0.5">← BAR</text>
          <line x1="60" y1="608" x2="100" y2="608" stroke="#dbd7e2" strokeWidth="1" />
          <text x="450" y="710" textAnchor="middle" fill="#84738f" fontSize="11" fontWeight="600" letterSpacing="0.5">MAIN ENTRANCE</text>
        </>
      ) : (
        <>
          <text x="116" y="562" fill="#9ca3af" fontSize="12">Entrance B</text>
          <text x="725" y="562" fill="#9ca3af" fontSize="12">Stairs</text>
          <text x="418" y="684" fill="#9ca3af" fontSize="12">Main entrance</text>
        </>
      )}
    </svg>
    );
  };

  const renderPureMap = () => (
    <svg width="100%" height="100%" viewBox="0 0 900 720">
      <rect width="900" height="720" fill="#f4f4f5" />
      <text x="450" y="44" textAnchor="middle" fill="#3f3f46" fontSize="18" fontWeight="800">Pure full-venue map</text>
      <rect x="250" y="64" width="400" height="54" rx="16" fill="#d4d4d8" stroke="#a855f7" />
      <text x="450" y="98" textAnchor="middle" fill="#0a0a0a" fontSize="20" fontWeight="800">STAGE</text>
      {[...sectors].filter((s) => !s.locked || unlockedCrew).map((sector) => (
        <g key={sector.id} transform={`translate(${sector.x} ${sector.y}) rotate(${sector.rotation} ${sector.width / 2} ${sector.height / 2})`} onClick={() => openSector(sector)} style={{ cursor: 'pointer' }}>
          <rect width={sector.width} height={sector.height} rx="18" fill="#d4d4d8" stroke="#52525b" strokeWidth="2" />
          <text x={sector.width / 2} y={sector.height / 2 + 5} textAnchor="middle" fill="#0a0a0a" fontSize="14" fontWeight="700">{sector.name}</text>
        </g>
      ))}
      <circle cx="84" cy="590" r="10" fill="#a855f7" /><text x="104" y="594" fill="#3f3f46" fontSize="13">Entrance B</text>
      <rect x="780" y="560" width="34" height="70" fill="#d4d4d8" stroke="#52525b" /><text x="746" y="650" fill="#3f3f46" fontSize="13">Stairs</text>
    </svg>
  );

  const renderSeats = () => (
    <svg width="100%" height="100%" viewBox="0 0 620 470">
      <rect width="620" height="470" fill="#fafafa" />
      <rect x="166" y="24" width="288" height="44" rx="14" fill="#e9e7ed" stroke="#06d373" />
      <text x="310" y="52" textAnchor="middle" fill="#0a0a0a" fontSize="18" fontWeight="800">STAGE</text>
      <text x="310" y="86" textAnchor="middle" fill="#a1a1aa" fontSize="13">{selectedSector?.name} · select individual seats</text>

      {Array.from(new Set(seats.map((seat) => seat.row))).map((row) => {
        const rowSeat = seats.find((seat) => seat.row === row);
        return <text key={row} x="60" y={(rowSeat?.y ?? 0) + 4} fill="#71717a" fontSize="12" fontWeight="800">{row}</text>;
      })}

      {seats.map((seat) => {
        const selected = selectedIds.has(seat.id);
        const loading = preReserving.includes(seat.id);
        const failed = failedSeats.includes(seat.id);
        const filtered = seatFiltered(seat);
        const claimedByOther = dynamicReservedByOthers.has(seat.id) || seat.status === 'reserved-by-other';
        const flashing = flashSeats.has(seat.id);
        const fill = flashing ? '#ff0032' : failed ? '#ef4444' : loading ? '#c084fc' : selected ? '#f5f3ff' : seat.status === 'unavailable' ? '#3f3f46' : claimedByOther ? '#52525b' : filtered ? '#d4d4d8' : colors[seat.priceCategory];
        const isResale = seat.resale && !filtered && seat.status === 'available' && !claimedByOther;
        const isFocused = keyboardNav && focusedSeatId === seat.id;
        const effectivelyAvailable = !filtered && !claimedByOther && seat.status === 'available';
        const stroke = isFocused ? '#11002b' : selected ? '#06d373' : failed ? '#fecaca' : isResale ? RESALE_COLOR : '#3f3f46';
        const strokeWidth = isFocused ? 3 : isResale && !selected ? 2.5 : 2;
        return (
          <Tooltip
            key={seat.id}
            title={`${seat.sectorName} · Row ${seat.row}, Seat ${seat.number} · ${seat.price} PLN${claimedByOther ? ' · Held by another user' : ''}${seat.resale && !claimedByOther ? ' · Resale' : ''}${seat.note ? ` · ${seat.note}` : ''}${seat.categories ? ' · multiple prices' : ''}`}
            arrow
          >
            <g
              onClick={() => effectivelyAvailable && reserveSeat(seat)}
              aria-label={`${seat.sectorName} Row ${seat.row} Seat ${seat.number}, ${claimedByOther ? 'held by another user' : seat.status}, ${seat.price} PLN`}
              style={{ cursor: effectivelyAvailable ? 'pointer' : 'not-allowed', opacity: filtered ? 0.35 : 1, transition: 'fill 200ms' }}
            >
              {isFocused && <circle cx={seat.x} cy={seat.y} r={14} fill="none" stroke="#11002b" strokeWidth="1.5" strokeDasharray="3 2" />}
              <circle cx={seat.x} cy={seat.y} r={selected ? 11 : 9} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
              {flashing && <circle cx={seat.x} cy={seat.y} r={14} fill="none" stroke="#ff0032" strokeWidth="2" opacity="0.6" />}
              {isResale && <circle cx={seat.x + 7} cy={seat.y - 7} r="3" fill={RESALE_COLOR} stroke="white" strokeWidth="1" />}
              {loading && <circle cx={seat.x} cy={seat.y} r="15" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="5 5"><animateTransform attributeName="transform" type="rotate" from={`0 ${seat.x} ${seat.y}`} to={`360 ${seat.x} ${seat.y}`} dur="1s" repeatCount="indefinite" /></circle>}
              {seat.accessible && <text x={seat.x + 8} y={seat.y - 8} fill="#ddd6fe" fontSize="9">♿</text>}
              {seat.limitedView && <text x={seat.x - 14} y={seat.y - 8} fill="#fbbf24" fontSize="10">!</text>}
            </g>
          </Tooltip>
        );
      })}
    </svg>
  );

  useImperativeHandle(ref, () => ({
    selectBestAvailable,
    buyFullTable,
    clearBasket: () => updateSelection([]),
    claimRandomSeat: () => {
      if (!selectedSector && !allSeatsVisible) return null;
      // Pick a random available seat in the open sector that isn't already in someone else's set,
      // isn't pre-reserving, and isn't already in the user's cart.
      const pool = seats.filter((s) =>
        s.status === 'available' &&
        !dynamicReservedByOthers.has(s.id) &&
        !preReserving.includes(s.id) &&
        !selectedIds.has(s.id)
      );
      if (!pool.length) return null;
      const seat = pool[Math.floor(Math.random() * pool.length)];
      setDynamicReservedByOthers((prev) => {
        const next = new Set(prev);
        next.add(seat.id);
        return next;
      });
      setFlashSeats((prev) => {
        const next = new Set(prev);
        next.add(seat.id);
        return next;
      });
      window.setTimeout(() => {
        setFlashSeats((prev) => {
          const next = new Set(prev);
          next.delete(seat.id);
          return next;
        });
      }, 700);
      return { seatId: seat.id, label: `${seat.sectorName} · Row ${seat.row}, Seat ${seat.number}` };
    },
  }), [selectBestAvailable, buyFullTable, updateSelection, seats, dynamicReservedByOthers, preReserving, selectedIds, selectedSector]);

  useEffect(() => {
    onMapStateChange?.({
      selectedSectorName: selectedSector?.name ?? null,
      view,
      tableLayoutAvailable: !!selectedSector?.tableLayout,
    });
    setListSheetExpanded(false);
  }, [selectedSector, view, onMapStateChange]);

  // Animate the v3 SVG viewBox between full venue and the selected sector's focus rectangle.
  useEffect(() => {
    if (!fanLayout) return;
    const target: [number, number, number, number] = (() => {
      const sv3 = selectedSector as V3Sector | null;
      if (sv3?.focusBBox) return [sv3.focusBBox.x, sv3.focusBBox.y, sv3.focusBBox.w, sv3.focusBBox.h];
      return [0, 0, 1280, 900];
    })();
    const start: [number, number, number, number] = [...animVB] as [number, number, number, number];
    if (start.every((v, i) => Math.abs(v - target[i]) < 0.5)) return;
    const duration = 280;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimVB([
        start[0] + (target[0] - start[0]) * eased,
        start[1] + (target[1] - start[1]) * eased,
        start[2] + (target[2] - start[2]) * eased,
        start[3] + (target[3] - start[3]) * eased,
      ]);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fanLayout, selectedSector?.id]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#ffffff', color: '#11002b', position: 'relative' }}>
      <Box sx={{ px: { xs: 1.25, md: 1.5 }, py: { xs: 0.5, md: 0.75 }, borderBottom: '1px solid #e9e7ed', bgcolor: '#ffffff' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', md: 'wrap' } }}>
          {(view === 'detail' || (fanLayout && !!selectedSector)) && (
            isMobile ? (
              <IconButton size="small" onClick={() => { setView('overview'); setSelectedSector(null); resetMap(); }} sx={{ bgcolor: '#ffffff', border: '1px solid #e9e7ed' }}>
                <Icon name="tailless-line-arrow-left-5" size={16} color="#11002b" />
              </IconButton>
            ) : (
              <M3Button startIcon={<Icon name="tailless-line-arrow-left-5" size={16} />} onClick={() => { setView('overview'); setSelectedSector(null); resetMap(); }} buttonType="outlined" size="sm" rounded={false}>Back to overview</M3Button>
            )
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 13, md: 14 } }} noWrap>{selectedSector ? selectedSector.name : view === 'pure' ? 'Pure map' : 'Venue overview'}</Typography>
          </Box>
          {!isMobile && (
            <PillToggleGroup
              size="sm"
              grouped
              value={view === 'pure' ? 'pure' : 'shopping'}
              onChange={(val) => setView(val === 'pure' ? 'pure' : selectedSector ? 'detail' : 'overview')}
              options={[
                {
                  value: 'shopping',
                  label: (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Icon name="shopping-cart-1" size={14} />
                      <span>Shopping map</span>
                    </Stack>
                  ),
                },
                {
                  value: 'pure',
                  label: (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Icon name="fit-screen-streamline-core" size={14} />
                      <span>Pure map</span>
                    </Stack>
                  ),
                },
              ]}
            />
          )}
          {isMobile ? (
            <>
              <IconButton size="small" onClick={() => setView(view === 'pure' ? (selectedSector ? 'detail' : 'overview') : 'pure')} sx={{ bgcolor: view === 'pure' ? '#06d373' : '#ffffff', color: '#11002b', border: '1px solid #e9e7ed' }}>
                <Icon name="fit-screen-streamline-core" size={16} />
              </IconButton>
              <IconButton size="small" onClick={() => setFindOpen(!findOpen)} sx={{ bgcolor: findOpen ? '#06d373' : '#ffffff', color: '#11002b', border: '1px solid #e9e7ed' }}>
                <Icon name="search-plus" size={16} />
              </IconButton>
              <IconButton size="small" onClick={() => setFiltersOpen(!filtersOpen)} sx={{ bgcolor: filtersOpen ? '#06d373' : '#ffffff', color: '#11002b', border: '1px solid #e9e7ed' }}>
                <Icon name="filter-text" size={16} />
              </IconButton>
            </>
          ) : (
            <>
              <M3Button startIcon={<Icon name="search-plus" size={16} />} onClick={() => setFindOpen(!findOpen)} buttonType="outlined" size="sm" rounded={false}>Find seats</M3Button>
              <M3Button startIcon={<Icon name="filter-text" size={16} />} onClick={() => setFiltersOpen(!filtersOpen)} buttonType={filtersOpen ? 'accent' : 'outlined'} size="sm" rounded={false}>Filters</M3Button>
            </>
          )}
        </Stack>
      </Box>

      {!hideToolbarFilters && <Box sx={{ px: { xs: 1, md: 1.5 }, py: 0.75, bgcolor: '#ffffff', overflowX: { xs: 'auto', md: 'visible' } }}>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: { xs: 'nowrap', md: 'wrap' }, rowGap: 0.75, minWidth: { xs: 'max-content', md: 'auto' } }}>
          {(() => {
            const ALL_CATS: PriceCategory[] = ['vip', 'premium', 'standard', 'balcony', 'ga'];
            const allSelected = filters.categories.length === ALL_CATS.length && !filters.accessibleOnly;
            const setSingle = (cat: PriceCategory) => {
              const onlyThis = filters.categories.length === 1 && filters.categories[0] === cat && !filters.accessibleOnly;
              if (onlyThis) setFilters({ ...filters, categories: ALL_CATS, accessibleOnly: false });
              else setFilters({ ...filters, categories: [cat], accessibleOnly: false });
            };
            const catChip = (id: PriceCategory, name: string, icon: string, price: string) => {
              const isOnly = filters.categories.length === 1 && filters.categories[0] === id && !filters.accessibleOnly;
              return (
                <M3Chip
                  key={id}
                  size="sm"
                  selected={isOnly}
                  leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: isOnly ? '#ffffff' : '#11002b' }}><Icon name={icon} size={14} /></Box>}
                  onClick={() => setSingle(id)}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>{name}</Box>
                      <Box component="span" sx={{ opacity: 0.65, fontWeight: 600, fontSize: 10 }}>{price}</Box>
                    </Box>
                  }
                />
              );
            };
            return (
              <>
                <M3Chip
                  size="sm"
                  selected={allSelected}
                  leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: allSelected ? '#ffffff' : '#11002b' }}><Icon name="thumbnail-view" size={14} /></Box>}
                  onClick={() => setFilters({ ...filters, categories: ALL_CATS, accessibleOnly: false })}
                  label={<Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>All</Box>}
                />
                {catChip('vip', 'VIP', 'star-1', '299 PLN')}
                {catChip('premium', 'Premium', 'gift-2', '199 PLN')}
                {catChip('standard', 'Standard', 'chair-3', '149 PLN')}
                {catChip('balcony', 'Balcony', 'few-tickets', '99 PLN')}
                {catChip('ga', 'Standing', 'user-multiple-group', '79 PLN')}
                <Box sx={{ width: 1, height: 22, bgcolor: '#e9e7ed', mx: 0.5 }} />
                <M3Chip
                  label="Accessible"
                  size="sm"
                  leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: filters.accessibleOnly ? '#ffffff' : '#11002b' }}><Icon name="house-key-access" size={14} /></Box>}
                  selected={filters.accessibleOnly}
                  onClick={() => setFilters((prev) => ({ ...prev, accessibleOnly: !prev.accessibleOnly }))}
                />
                <M3Chip
                  label="Hide limited view"
                  size="sm"
                  selected={filters.hideLimitedView}
                  onClick={() => setFilters((prev) => ({ ...prev, hideLimitedView: !prev.hideLimitedView }))}
                />
              </>
            );
          })()}
          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
          <Typography variant="caption" color="text.secondary" sx={{ pr: 0.5, whiteSpace: 'nowrap', display: { xs: 'none', md: 'block' } }}>
            {Object.values(matchingBySector).reduce((sum, e) => sum + e.available, 0)} matching
          </Typography>
        </Stack>
      </Box>}

      {findOpen && (
        <Box sx={{ px: 2, py: 1.25, bgcolor: '#ffffff', borderBottom: '1px solid #e9e7ed' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <SearchField
              size="sm"
              placeholder="Search by Name, ID or venue"
              onSubmit={() => setSnackbar('Search kept as secondary path. Matching rows would highlight on the map.')}
            />
            <M3Button buttonType="accent" size="sm" onClick={() => setSnackbar('Search kept as secondary path. Matching rows would highlight on the map.')}>Search</M3Button>
          </Stack>
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: `${filtersOpen && !isMobile ? '300px ' : ''}1fr${(((view === 'detail' || (fanLayout && !!selectedSector))) && selectedSector) || (allSeatsVisible && !isMobile) ? ' 340px' : ''}` }, gridTemplateRows: '1fr', minHeight: 0, overflow: 'hidden' }}>
        {filtersOpen && !isMobile && (
          <Box sx={{ p: 2, bgcolor: '#ffffff', color: '#11002b', borderRight: '1px solid #e9e7ed', overflow: 'auto' }}>
            {renderFilterPanel()}
          </Box>
        )}

        <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: 0, minWidth: 0, height: '100%' }} onMouseDown={(e) => startDrag(e.clientX, e.clientY)} onMouseMove={(e) => moveDrag(e.clientX, e.clientY)} onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)} onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)} onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)} onTouchEnd={() => setDragging(false)}>
          <Box sx={{ position: 'absolute', inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center', transition: dragging ? 'none' : 'transform 180ms ease' }}>
            {view === 'pure' ? renderPureMap() : view === 'detail' ? renderSeats() : renderOverview()}
          </Box>

          {/* Always-visible STAGE marker — anchored to the left of the map area so users never lose the orientation, even when zoomed in */}
          {fanLayout && (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                left: { xs: 6, md: 10 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 4,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  bgcolor: '#11002b',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: { xs: 9, md: 10 },
                  letterSpacing: { xs: 3, md: 4 },
                  px: { xs: 0.5, md: 0.75 },
                  py: { xs: 1.25, md: 1.75 },
                  borderRadius: 1,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  boxShadow: '0 2px 6px rgba(17,0,43,0.18)',
                }}
              >
                STAGE
              </Box>
            </Box>
          )}

          {(zoom > 1.0 || (fanLayout && !!selectedSector)) && (
            <Box
              role="button"
              tabIndex={0}
              aria-label="Back to full venue"
              onClick={() => { setView('overview'); setSelectedSector(null); resetMap(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setView('overview'); setSelectedSector(null); resetMap(); } }}
              sx={{
                position: 'absolute',
                right: 12,
                bottom: { xs: 'auto', md: 16 },
                top: { xs: 12, md: 'auto' },
                width: { xs: 96, md: 120 },
                height: { xs: 64, md: 80 },
                bgcolor: '#ffffff',
                border: '1px solid #e9e7ed',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(17,0,43,0.08), 0 1px 3px rgba(17,0,43,0.06)',
                overflow: 'hidden',
                zIndex: 5,
                cursor: 'pointer',
                transition: 'box-shadow 150ms, transform 150ms',
                '&:hover': { boxShadow: '0 6px 20px rgba(17,0,43,0.14), 0 1px 3px rgba(17,0,43,0.08)', transform: 'translateY(-1px)' },
                '&::after': {
                  content: '"Back to venue"',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textAlign: 'center',
                  color: '#11002b',
                  bgcolor: 'rgba(255,255,255,0.92)',
                  py: 0.25,
                  borderTop: '1px solid #e9e7ed',
                },
              }}
            >
              <svg width="100%" height="100%" viewBox={fanLayout ? '0 0 1280 900' : '0 0 900 720'} preserveAspectRatio="xMidYMid meet">
                <rect width="100%" height="100%" fill={fanLayout ? '#e7e7e7' : '#f8f8fa'} />
                {/* Stage marker */}
                {fanLayout ? (
                  <path d="M0 287 L24 287 C58 391 58 492 24 594 L0 594 Z" fill="#222" />
                ) : (
                  <rect x={gridLayout ? 220 : 250} y={gridLayout ? 30 : 58} width={gridLayout ? 460 : 400} height={gridLayout ? 50 : 58} rx="8" fill="#11002b" />
                )}
                {/* Sector thumbnails */}
                {visibleSectors.map((sector) => (
                  sector.path ? (
                    <path
                      key={sector.id}
                      d={sector.path}
                      fill={sector.id === 'mezzanine' ? '#7b5aa8' : sector.id === 'orchestra' || sector.id === 'balcony' ? '#9d85d0' : '#5a5062'}
                      opacity={0.85}
                    />
                  ) : (
                    <rect
                      key={sector.id}
                      x={sector.x}
                      y={sector.y}
                      width={sector.width}
                      height={sector.height}
                      rx={gridLayout ? 14 : 12}
                      transform={sector.rotation ? `rotate(${sector.rotation} ${sector.x + sector.width / 2} ${sector.y + sector.height / 2})` : undefined}
                      fill={colors[sector.priceCategory]}
                      opacity={0.85}
                    />
                  )
                ))}
                {/* Viewport indicator */}
                {(() => {
                  const vbCanvasW = fanLayout ? 1280 : 900;
                  const vbCanvasH = fanLayout ? 900 : 720;
                  const vbW = vbCanvasW / zoom;
                  const vbH = vbCanvasH / zoom;
                  const cx = vbCanvasW / 2 - pan.x * (vbCanvasW / 700);
                  const cy = vbCanvasH / 2 - pan.y * (vbCanvasH / 540);
                  const x = Math.max(0, Math.min(vbCanvasW - vbW, cx - vbW / 2));
                  const y = Math.max(0, Math.min(vbCanvasH - vbH, cy - vbH / 2));
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={vbW}
                      height={vbH}
                      fill="rgba(123,90,168,0.22)"
                      stroke="#7b5aa8"
                      strokeWidth={6}
                      rx="6"
                    />
                  );
                })()}
              </svg>
            </Box>
          )}

          <Stack
            spacing={0.75}
            sx={{
              position: 'absolute',
              right: { xs: 12, md: zoom > 1.0 || (fanLayout && !!selectedSector) ? 148 : 16 },
              bottom: { xs: 12, md: 16 },
              zIndex: 5,
              transition: 'right 200ms',
            }}
          >
            <IconButton onClick={resetMap} aria-label="Reset zoom" sx={{ width: 36, height: 36, bgcolor: '#ffffff', color: '#11002b', border: '1px solid #e9e7ed', boxShadow: '0 1px 3px rgba(17,0,43,0.06)', '&:hover': { bgcolor: '#f4f2f5' } }}>
              <MyLocation fontSize="small" />
            </IconButton>
            <IconButton onClick={() => setZoom((z) => Math.min(2.8, z + 0.25))} aria-label="Zoom in" sx={{ width: 36, height: 36, bgcolor: '#ffffff', color: '#11002b', border: '1px solid #e9e7ed', boxShadow: '0 1px 3px rgba(17,0,43,0.06)', '&:hover': { bgcolor: '#f4f2f5' } }}>
              <ZoomIn fontSize="small" />
            </IconButton>
            <IconButton onClick={() => setZoom((z) => Math.max(0.7, z - 0.25))} aria-label="Zoom out" sx={{ width: 36, height: 36, bgcolor: '#ffffff', color: '#11002b', border: '1px solid #e9e7ed', boxShadow: '0 1px 3px rgba(17,0,43,0.06)', '&:hover': { bgcolor: '#f4f2f5' } }}>
              <ZoomOut fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {(view === 'detail' || (fanLayout && !!selectedSector)) && selectedSector && !isMobile && (
          <Box sx={{ minHeight: 0, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TicketList
              sector={selectedSector}
              seats={seats.filter((s) => !seatFiltered(s))}
              selectedIds={selectedIds}
              onReserve={reserveSeat}
              onBestInSection={selectBestAvailable}
              resaleColor={RESALE_COLOR}
            />
          </Box>
        )}

        {/* v4 desktop overview: advanced filter panel (section toggles + filters + legend) */}
        {allSeatsVisible && !selectedSector && !isMobile && (
          <Box sx={{ minHeight: 0, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #e9e7ed', bgcolor: '#ffffff' }}>
            {renderAdvancedFilters()}
          </Box>
        )}
      </Box>

      {/* Mobile bottom-sheet overlay: peek by default, tap to expand */}
      {isMobile && (view === 'detail' || (fanLayout && !!selectedSector)) && selectedSector && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: listSheetExpanded ? '65%' : 64,
            bgcolor: '#ffffff',
            borderTop: '1px solid #e9e7ed',
            boxShadow: '0 -8px 24px rgba(17,0,43,0.08)',
            zIndex: 6,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 240ms ease',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            onClick={() => setListSheetExpanded((v) => !v)}
            sx={{ px: 1.5, py: 1, cursor: 'pointer', flexShrink: 0 }}
          >
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: '#c1bacb', mx: 'auto', position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)' }} />
            <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.15 }} noWrap>
                {selectedSector.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {seats.filter((s) => s.status === 'available' && !seatFiltered(s)).length} tickets available · from {selectedSector.startingPrice} PLN
              </Typography>
            </Box>
            <IconButton size="small" sx={{ flexShrink: 0 }} aria-label={listSheetExpanded ? 'Collapse list' : 'Expand list'}>
              <Icon name={listSheetExpanded ? 'tailless-line-arrow-down-5' : 'tailless-line-arrow-up-5'} size={16} color="#11002b" />
            </IconButton>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0, display: listSheetExpanded ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden', p: 1, pt: 0 }}>
            <TicketList
              sector={selectedSector}
              seats={seats.filter((s) => !seatFiltered(s))}
              selectedIds={selectedIds}
              onReserve={reserveSeat}
              onBestInSection={selectBestAvailable}
              resaleColor={RESALE_COLOR}
            />
          </Box>
        </Box>
      )}

      {!hideActionBar && <Box sx={{ px: { xs: 1.5, md: 2 }, py: { xs: 1, md: 1.25 }, bgcolor: '#ffffff', color: '#11002b', borderTop: '1px solid #e9e7ed', position: 'sticky', bottom: 0, zIndex: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              flex: { xs: 1, md: 'none' },
              minWidth: 0,
              px: 1.25,
              py: 0.5,
              borderRadius: 100,
              bgcolor: selectedSeats.length > 0 ? '#f1fdf6' : '#f4f2f5',
              border: `1px solid ${selectedSeats.length > 0 ? '#06d373' : '#e9e7ed'}`,
              transition: 'all 200ms',
            }}
          >
            <Icon name="shopping-cart-1" size={16} color={selectedSeats.length > 0 ? '#19633d' : '#5a5062'} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '0.1px',
                  color: selectedSeats.length > 0 ? '#11002b' : '#5a5062',
                }}
              >
                {selectedSeats.length} selected · {selectedTotal} PLN
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ flex: 1 }} />
          {isMobile ? (
            <>
              {selectedSector?.tableLayout && (
                <Tooltip title="Buy VIP table">
                  <IconButton size="small" onClick={buyFullTable} sx={{ bgcolor: '#fafafa', border: '1px solid #d4d4d8' }}>
                    <ConfirmationNumber fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Best 2 seats">
                <IconButton size="small" onClick={() => selectBestAvailable(2)} sx={{ bgcolor: '#fafafa', border: '1px solid #d4d4d8' }}>
                  <AutoAwesome fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View preview">
                <IconButton size="small" onClick={() => setSnackbar('View from seat preview would open as a side panel / mobile bottom sheet.')} sx={{ bgcolor: '#fafafa', border: '1px solid #d4d4d8' }}>
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              <M3Button size="xs" onClick={() => updateSelection([])} disabled={!selectedSeats.length} buttonType="filled" sx={{ minWidth: 0, px: 1.5 }}>Clear</M3Button>
            </>
          ) : (
            <>
              {selectedSector?.tableLayout && <M3Button onClick={buyFullTable} buttonType="outlined" size="sm" rounded={false}>Buy VIP table</M3Button>}
              <M3Button startIcon={<AutoAwesome />} onClick={() => selectBestAvailable(2)} buttonType="outlined" size="sm" rounded={false}>Best 2 seats</M3Button>
              <M3Button startIcon={<Visibility />} onClick={() => setSnackbar('View from seat preview would open as a side panel / mobile bottom sheet.')} buttonType="outlined" size="sm" rounded={false}>View preview</M3Button>
              <M3Button onClick={() => updateSelection([])} disabled={!selectedSeats.length} buttonType="filled" size="sm">Clear basket</M3Button>
            </>
          )}
        </Stack>
      </Box>}

      <Dialog open={isMobile && filtersOpen} onClose={() => setFiltersOpen(false)} fullScreen>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9e7ed' }}>
          Advanced filters
          <IconButton onClick={() => setFiltersOpen(false)} size="small" aria-label="Close filters"><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>{renderFilterPanel()}</DialogContent>
        <DialogActions>
          <M3Button onClick={() => setFiltersOpen(false)} buttonType="accent" size="md" fullWidth>Apply</M3Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!categorySeat} onClose={() => setCategorySeat(null)} fullWidth maxWidth="xs">
        <DialogTitle>Choose ticket category</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>This physical seat has multiple price categories. Pick one for the mini-cart.</Typography>
          <Select fullWidth value={categorySeat?.selectedCategory ?? ''} onChange={(e) => changeSeatCategory(e.target.value)}>
            {categorySeat?.categories?.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.label} · {cat.price} PLN</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions><Button onClick={() => setCategorySeat(null)} variant="contained">Done</Button></DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3200}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: isMobile ? 'top' : 'bottom', horizontal: 'center' }}
        sx={{ mt: { xs: 8, md: 0 } }}
      >
        <Alert severity="info" icon={<InfoOutlined />} sx={{ bgcolor: '#f8f8fa', color: '#11002b', border: '1px solid #06d373' }}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  );
});
