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
import { StageMarker } from './VenueMap/StageMarker';
import { Minimap } from './VenueMap/Minimap';
import { MobileBottomSheet } from './VenueMap/MobileBottomSheet';
import { M3Button } from './M3Button';
import { M3Chip } from './M3Chip';
import { Icon } from './Icon';
import { SearchField } from './SearchField';
import { PillToggleGroup } from './PillToggleGroup';

// Types + the RESALE_COLOR constant moved to src/app/types.ts. Re-exported here
// so existing imports (`import type { Sector } from './VenueMap'`) keep working.
import {
  RESALE_COLOR,
  type MapHandle,
  type MapState,
  type PriceCategory,
  type Seat,
  type SeatStatus,
  type SelectedSeat,
  type Sector,
  type VenueFilters,
} from '../types';
export {
  DEFAULT_FILTERS,
  RESALE_COLOR,
  type MapHandle,
  type MapState,
  type PriceCategory,
  type Seat,
  type SeatStatus,
  type SelectedSeat,
  type Sector,
  type VenueFilters,
} from '../types';

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

// Sector data, seat generation, and the brand colour palette now live in
// src/app/data/sectors.ts. Editing that single file is how you swap layouts
// or onboard a new venue — VenueMap stays focused on rendering + interaction.
import {
  categoryColors as colors,
  sectorsV1,
  sectorsV2,
  sectorsV3,
  generateSeats,
  type V3Sector,
} from '../data/sectors';

import { formatTimer } from '../utils';

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
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [hoveredSectorId, setHoveredSectorId] = useState<string | null>(null);
  const [dynamicReservedByOthers, setDynamicReservedByOthers] = useState<Set<string>>(new Set());
  const [flashSeats, setFlashSeats] = useState<Set<string>>(new Set());
  // Smoothly animated SVG viewBox for v3 zoom-to-sector
  const [animVB, setAnimVB] = useState<[number, number, number, number]>([0, 0, 1280, 900]);
  const [listSheetExpanded, setListSheetExpanded] = useState(false);
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
      {[['Available', '#9d85d0'], ['Selected', '#06d373'], ['Taken (sold / held)', '#d4d4d8'], ['Resale', '#ec4899']].map(([label, color]) => <Stack key={label} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}><Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: color }} /><Typography variant="caption">{label}</Typography></Stack>)}
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
        if (allSeatsVisible && !selectedSector) tileOpacity = 0.08;
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
                (
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
            {/* Resale dot: signals "section has resale tickets" before the user zooms in.
                Hidden on v4 because the seats themselves are already visible with pink
                resale strokes, which makes the section-level dot redundant. */}
            {match.resale > 0 && !disabled && !noMatches && !allSeatsVisible && (
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
            const sectorsWithSeats = sectorsV3.filter((s) => (s as V3Sector).seatsBBox && (!s.locked || unlockedCrew));
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
                    const isTaken = !effectivelyAvailable && !selected && !loading && !failed && !flashing;
                    const seatFill = flashing ? '#ff0032' : failed ? '#ef4444' : loading ? '#c084fc' : selected ? '#06d373' : isTaken ? '#d4d4d8' : '#9d85d0';
                    const seatStroke = selected ? '#11002b' : isResale ? RESALE_COLOR : 'transparent';
                    const hovered = hoveredSeatId === seat.id;
                    return (
                      <g
                        key={seat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (effectivelyAvailable) reserveSeat(seat);
                          else setSnackbar('This seat is already taken');
                        }}
                        onMouseEnter={() => setHoveredSeatId(seat.id)}
                        onMouseLeave={() => setHoveredSeatId((s) => (s === seat.id ? null : s))}
                        style={{ cursor: effectivelyAvailable ? 'pointer' : 'not-allowed', transition: 'fill 200ms' }}
                      >
                        <circle cx={p.x} cy={p.y} r={selected ? 4.5 : 3.5} fill={seatFill} stroke={seatStroke} strokeWidth={isResale && !selected ? 1.2 : 1} />
                        {isTaken && <line x1={p.x - 4} y1={p.y} x2={p.x + 4} y2={p.y} stroke="#84738f" strokeWidth="1.2" pointerEvents="none" />}
                        {flashing && <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#ff0032" strokeWidth="1.5" opacity="0.6" />}
                        {(hovered || selected) && (
                          <g pointerEvents="none">
                            <rect x={p.x - 24} y={p.y - 26} width={48} height={16} rx={3} fill="#11002b" />
                            <text x={p.x} y={p.y - 14} textAnchor="middle" fill="#ffffff" fontSize={11} fontWeight={800}>
                              {seat.price} PLN
                            </text>
                          </g>
                        )}
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
                  const isTaken = !effectivelyAvailable && !selected && !loading && !failed && !flashing;
                  const seatFill = flashing ? '#ff0032' : failed ? '#ef4444' : loading ? '#c084fc' : selected ? '#06d373' : isTaken ? '#d4d4d8' : '#9d85d0';
                  const seatStroke = selected ? '#11002b' : isResale ? RESALE_COLOR : 'transparent';
                  const hovered = hoveredSeatId === seat.id;
                  return (
                    <g
                      key={seat.id}
                      onClick={() => {
                        if (effectivelyAvailable) reserveSeat(seat);
                        else setSnackbar('This seat is already taken');
                      }}
                      onMouseEnter={() => setHoveredSeatId(seat.id)}
                      onMouseLeave={() => setHoveredSeatId((s) => (s === seat.id ? null : s))}
                      style={{ cursor: effectivelyAvailable ? 'pointer' : 'not-allowed', transition: 'fill 200ms' }}
                    >
                      <circle cx={p.x} cy={p.y} r={selected ? 7 : 6} fill={seatFill} stroke={seatStroke} strokeWidth={isResale && !selected ? 2 : 1.5} />
                      {isTaken && <line x1={p.x - 6} y1={p.y} x2={p.x + 6} y2={p.y} stroke="#84738f" strokeWidth="1.5" pointerEvents="none" />}
                      {loading && <circle cx={p.x} cy={p.y} r="10" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="3 3"><animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="1s" repeatCount="indefinite" /></circle>}
                      {flashing && <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="#ff0032" strokeWidth="2" opacity="0.6" />}
                      {(hovered || selected) && (
                        <g pointerEvents="none">
                          <rect x={p.x - 28} y={p.y - 30} width={56} height={18} rx={3} fill="#11002b" />
                          <text x={p.x} y={p.y - 17} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight={800}>
                            {seat.price} PLN
                          </text>
                        </g>
                      )}
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
        const isResale = seat.resale && !filtered && seat.status === 'available' && !claimedByOther;
        const isFocused = keyboardNav && focusedSeatId === seat.id;
        const effectivelyAvailable = !filtered && !claimedByOther && seat.status === 'available';
        const isTaken = !filtered && !effectivelyAvailable && !selected && !loading && !failed && !flashing;
        const fill = flashing ? '#ff0032' : failed ? '#ef4444' : loading ? '#c084fc' : selected ? '#06d373' : isTaken ? '#d4d4d8' : filtered ? '#d4d4d8' : '#9d85d0';
        const stroke = isFocused ? '#11002b' : selected ? '#11002b' : failed ? '#fecaca' : isResale ? RESALE_COLOR : 'transparent';
        const strokeWidth = isFocused ? 3 : isResale && !selected ? 2.5 : selected ? 2 : 1;
        return (
          <Tooltip
            key={seat.id}
            title={`${seat.sectorName} · Row ${seat.row}, Seat ${seat.number} · ${seat.price} PLN${claimedByOther ? ' · Held by another user' : ''}${seat.resale && !claimedByOther ? ' · Resale' : ''}${seat.note ? ` · ${seat.note}` : ''}${seat.categories ? ' · multiple prices' : ''}`}
            arrow
          >
            <g
              onClick={() => {
                if (effectivelyAvailable) reserveSeat(seat);
                else if (!filtered) setSnackbar('This seat is already taken');
              }}
              aria-label={`${seat.sectorName} Row ${seat.row} Seat ${seat.number}, ${claimedByOther ? 'held by another user' : seat.status}, ${seat.price} PLN`}
              style={{ cursor: effectivelyAvailable ? 'pointer' : 'not-allowed', opacity: filtered ? 0.35 : 1, transition: 'fill 200ms' }}
            >
              {isFocused && <circle cx={seat.x} cy={seat.y} r={14} fill="none" stroke="#11002b" strokeWidth="1.5" strokeDasharray="3 2" />}
              <circle cx={seat.x} cy={seat.y} r={selected ? 11 : 9} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
              {isTaken && <line x1={seat.x - 7} y1={seat.y} x2={seat.x + 7} y2={seat.y} stroke="#84738f" strokeWidth="2" pointerEvents="none" />}
              {flashing && <circle cx={seat.x} cy={seat.y} r={14} fill="none" stroke="#ff0032" strokeWidth="2" opacity="0.6" />}
              {isResale && <circle cx={seat.x + 7} cy={seat.y - 7} r="3" fill={RESALE_COLOR} stroke="white" strokeWidth="1" />}
              {loading && <circle cx={seat.x} cy={seat.y} r="15" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="5 5"><animateTransform attributeName="transform" type="rotate" from={`0 ${seat.x} ${seat.y}`} to={`360 ${seat.x} ${seat.y}`} dur="1s" repeatCount="indefinite" /></circle>}
              {seat.accessible && <text x={seat.x + 8} y={seat.y - 8} fill="#ddd6fe" fontSize="9">♿</text>}
              {seat.limitedView && <text x={seat.x - 14} y={seat.y - 8} fill="#fbbf24" fontSize="10">!</text>}
              {selected && (
                <g pointerEvents="none">
                  <rect x={seat.x - 28} y={seat.y - 30} width={56} height={18} rx={3} fill="#11002b" />
                  <text x={seat.x} y={seat.y - 17} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight={800}>
                    {seat.price} PLN
                  </text>
                </g>
              )}
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

          {fanLayout && <StageMarker />}

          {(zoom > 1.0 || (fanLayout && !!selectedSector)) && (
            <Minimap
              sectors={visibleSectors}
              selectedSector={selectedSector}
              fanLayout={fanLayout}
              gridLayout={gridLayout}
              zoom={zoom}
              pan={pan}
              onBackToVenue={() => { setView('overview'); setSelectedSector(null); resetMap(); }}
            />
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

        {/* v3 single-sector list (only when not v4 — v4 has its own multi-sector list below) */}
        {!allSeatsVisible && (view === 'detail' || (fanLayout && !!selectedSector)) && selectedSector && !isMobile && (
          <Box sx={{ minHeight: 0, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #e9e7ed' }}>
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

        {/* v4 desktop: one continuous scroll with every sector's full row list,
            sticky section headers, visible in both overview and zoomed states */}
        {allSeatsVisible && !isMobile && (() => {
          const fanSectors = sectorsV3.filter((s) => !s.locked && (s as V3Sector).seatsBBox);
          const totalAvailable = fanSectors.reduce((sum, s) => sum + (matchingBySector[s.id]?.available ?? 0), 0);
          return (
            <Box sx={{ minHeight: 0, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #e9e7ed', bgcolor: '#ffffff' }}>
              <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid #e9e7ed', bgcolor: '#ffffff', flexShrink: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.5 }}>ALL TICKETS</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{totalAvailable} matching</Typography>
                </Stack>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                {fanSectors.map((s) => {
                  const accent = s.id === 'mezzanine' ? '#7b5aa8' : '#9d85d0';
                  const sectorSeats = (selectedSector?.id === s.id ? seats : generateSeats(s)).filter((seat) => !seatFiltered(seat));
                  return (
                    <TicketList
                      key={s.id}
                      flowing
                      initiallyExpanded
                      accentColor={accent}
                      sector={s}
                      seats={sectorSeats}
                      selectedIds={selectedIds}
                      onReserve={reserveSeat}
                      onBestInSection={selectedSector?.id === s.id ? selectBestAvailable : undefined}
                      onSectorClick={() => openSector(s)}
                      resaleColor={RESALE_COLOR}
                    />
                  );
                })}
              </Box>
            </Box>
          );
        })()}
      </Box>

      {isMobile && (allSeatsVisible || ((view === 'detail' || (fanLayout && !!selectedSector)) && !!selectedSector)) && (
        <MobileBottomSheet
          expanded={listSheetExpanded}
          setExpanded={setListSheetExpanded}
          allSeatsVisible={allSeatsVisible}
          selectedSector={selectedSector}
          seats={seats}
          matchingBySector={matchingBySector}
          selectedIds={selectedIds}
          seatFiltered={seatFiltered}
          reserveSeat={reserveSeat}
          openSector={openSector}
          selectBestAvailable={selectBestAvailable}
          showV3Sheet={(view === 'detail' || (fanLayout && !!selectedSector)) && !!selectedSector}
        />
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
