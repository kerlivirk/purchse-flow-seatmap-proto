import { useMemo, useRef, useState } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Accessible,
  ArrowBack,
  AutoAwesome,
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
  note?: string;
  categories?: Array<{ id: string; label: string; price: number }>;
}

export interface SelectedSeat extends Seat {
  selectedCategory?: string;
  selectedCategoryLabel?: string;
}

interface VenueMapProps {
  selectedSeats?: SelectedSeat[];
  onSelectionChange?: (seats: SelectedSeat[]) => void;
}

const colors: Record<PriceCategory, string> = {
  vip: '#a855f7',
  premium: '#7c3aed',
  standard: '#6b7280',
  balcony: '#9ca3af',
  ga: '#4b5563',
};

const sectors: Sector[] = [
  { id: 'balcony', name: 'Balcony', localName: 'Balkon', x: 220, y: 132, width: 460, height: 72, rotation: 0, priceCategory: 'balcony', startingPrice: 99, totalSeats: 148, availableSeats: 118, accessible: true },
  { id: 'standard-left', name: 'Standard Left', localName: 'Standard vasak', x: 105, y: 250, width: 210, height: 112, rotation: -12, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 61 },
  { id: 'standard-center', name: 'Standard Center', localName: 'Standard kesk', x: 332, y: 238, width: 236, height: 118, rotation: 0, priceCategory: 'standard', startingPrice: 149, totalSeats: 126, availableSeats: 82, accessible: true },
  { id: 'standard-right', name: 'Standard Right', localName: 'Standard parem', x: 585, y: 250, width: 210, height: 112, rotation: 12, priceCategory: 'standard', startingPrice: 149, totalSeats: 96, availableSeats: 57 },
  { id: 'premium-left', name: 'Premium Left', localName: 'Premium vasak', x: 165, y: 390, width: 205, height: 118, rotation: -8, priceCategory: 'premium', startingPrice: 199, totalSeats: 72, availableSeats: 31, accessible: true },
  { id: 'premium-right', name: 'Premium Right', localName: 'Premium parem', x: 530, y: 390, width: 205, height: 118, rotation: 8, priceCategory: 'premium', startingPrice: 199, totalSeats: 72, availableSeats: 28, accessible: true },
  { id: 'vip-center', name: 'VIP Center', localName: 'VIP kesk', x: 350, y: 410, width: 200, height: 128, rotation: 0, priceCategory: 'vip', startingPrice: 299, totalSeats: 54, availableSeats: 18, accessible: true, tableLayout: true },
  { id: 'ga-floor', name: 'Standing GA', localName: 'Seisuala', x: 310, y: 560, width: 280, height: 88, rotation: 0, priceCategory: 'ga', startingPrice: 79, totalSeats: 220, availableSeats: 156, isGA: true },
  { id: 'crew-hidden', name: 'Press / Crew Hold', localName: 'Press / Crew', x: 720, y: 470, width: 120, height: 72, rotation: 18, priceCategory: 'vip', startingPrice: 0, totalSeats: 24, availableSeats: 24, locked: true },
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

      output.push({
        id: `${sector.id}-${row}-${n}`,
        sectorId: sector.id,
        sectorName: sector.name,
        row,
        number: n,
        x: 96 + seatIndex * 31,
        y: 96 + rowIndex * 32 + curve,
        price: limitedView ? Math.max(49, basePrice - 30) : basePrice,
        priceCategory: sector.priceCategory,
        status,
        accessible,
        limitedView,
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

export function VenueMap({ selectedSeats = [], onSelectionChange }: VenueMapProps) {
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
  const [filters, setFilters] = useState({
    priceRange: [0, 320] as [number, number],
    categories: ['vip', 'premium', 'standard', 'balcony', 'ga'] as PriceCategory[],
    accessibleOnly: false,
    adjacentOnly: false,
    hideLimitedView: false,
  });

  const seats = useMemo(() => (selectedSector ? generateSeats(selectedSector) : []), [selectedSector]);
  const selectedIds = new Set(selectedSeats.map((seat) => seat.id));
  const selectedTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const visibleSectors = sectors.filter((sector) => !sector.locked || unlockedCrew);

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
    setView('detail');
    setZoom(1);
    setPan({ x: 0, y: 0 });
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

  const selectBestAvailable = (count: number) => {
    if (!selectedSector) {
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

  const renderOverview = () => (
    <svg width="100%" height="100%" viewBox="0 0 900 720">
      <defs>
        <linearGradient id="stageGradient" x1="0" x2="1">
          <stop offset="0%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="softShadow"><feDropShadow dx="0" dy="10" stdDeviation="10" floodOpacity="0.25" /></filter>
      </defs>

      <rect x="0" y="0" width="900" height="720" fill="#0b0b0f" />
      <text x="450" y="38" textAnchor="middle" fill="#d1d5db" fontSize="16" fontWeight="700">Venue overview · click a section to drill down</text>
      <rect x="250" y="58" width="400" height="58" rx="18" fill="url(#stageGradient)" filter="url(#softShadow)" />
      <text x="450" y="94" textAnchor="middle" fill="white" fontSize="22" fontWeight="800">STAGE / SCREEN</text>

      <path d="M90 190 C240 105, 660 105, 810 190" stroke="#a855f7" strokeWidth="2" fill="none" opacity="0.45" />
      <path d="M70 690 C220 610, 680 610, 830 690" stroke="#27272a" strokeWidth="4" fill="none" opacity="0.8" />

      {visibleSectors.map((sector) => {
        const disabled = sectorFiltered(sector);
        const fill = disabled ? '#27272a' : colors[sector.priceCategory];
        const availability = Math.round((sector.availableSeats / sector.totalSeats) * 100);
        return (
          <g
            key={sector.id}
            role="button"
            tabIndex={0}
            transform={`translate(${sector.x} ${sector.y}) rotate(${sector.rotation} ${sector.width / 2} ${sector.height / 2})`}
            onClick={() => openSector(sector)}
            onKeyDown={(e) => e.key === 'Enter' && openSector(sector)}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1 }}
          >
            <rect width={sector.width} height={sector.height} rx="20" fill={fill} opacity="0.88" stroke={sector.accessible ? '#c4b5fd' : '#3f3f46'} strokeWidth="2" filter="url(#softShadow)" />
            <rect x="8" y="8" width={sector.width - 16} height={sector.height - 16} rx="14" fill="rgba(255,255,255,0.06)" />
            <text x={sector.width / 2} y={sector.height / 2 - 8} textAnchor="middle" fill="white" fontSize="15" fontWeight="800">{sector.name}</text>
            <text x={sector.width / 2} y={sector.height / 2 + 12} textAnchor="middle" fill="#f5f3ff" fontSize="12">{sector.isGA ? 'GA · add ticket' : `${availability}% available`}</text>
            <rect x={sector.width / 2 - 58} y={sector.height - 26} width="116" height="20" rx="10" fill="#0b0b0f" opacity="0.82" />
            <text x={sector.width / 2} y={sector.height - 12} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
              {sector.locked && !unlockedCrew ? 'Code required' : `from ${sector.startingPrice} PLN`}
            </text>
            {sector.accessible && <text x="18" y="24" fill="white" fontSize="17">♿</text>}
            {sector.tableLayout && <text x={sector.width - 26} y="25" fill="white" fontSize="16">▦</text>}
          </g>
        );
      })}

      <text x="116" y="562" fill="#9ca3af" fontSize="12">Entrance B</text>
      <text x="725" y="562" fill="#9ca3af" fontSize="12">Stairs</text>
      <text x="418" y="684" fill="#9ca3af" fontSize="12">Main entrance</text>
    </svg>
  );

  const renderPureMap = () => (
    <svg width="100%" height="100%" viewBox="0 0 900 720">
      <rect width="900" height="720" fill="#111113" />
      <text x="450" y="44" textAnchor="middle" fill="#fafafa" fontSize="18" fontWeight="800">Pure full-venue map</text>
      <rect x="250" y="64" width="400" height="54" rx="16" fill="#27272a" stroke="#a855f7" />
      <text x="450" y="98" textAnchor="middle" fill="#e5e7eb" fontSize="20" fontWeight="800">STAGE</text>
      {[...sectors].filter((s) => !s.locked || unlockedCrew).map((sector) => (
        <g key={sector.id} transform={`translate(${sector.x} ${sector.y}) rotate(${sector.rotation} ${sector.width / 2} ${sector.height / 2})`} onClick={() => openSector(sector)} style={{ cursor: 'pointer' }}>
          <rect width={sector.width} height={sector.height} rx="18" fill="#27272a" stroke="#52525b" strokeWidth="2" />
          <text x={sector.width / 2} y={sector.height / 2 + 5} textAnchor="middle" fill="#e5e7eb" fontSize="14" fontWeight="700">{sector.name}</text>
        </g>
      ))}
      <circle cx="84" cy="590" r="10" fill="#a855f7" /><text x="104" y="594" fill="#d1d5db" fontSize="13">Entrance B</text>
      <rect x="780" y="560" width="34" height="70" fill="#27272a" stroke="#52525b" /><text x="746" y="650" fill="#d1d5db" fontSize="13">Stairs</text>
    </svg>
  );

  const renderSeats = () => (
    <svg width="100%" height="100%" viewBox="0 0 620 470">
      <rect width="620" height="470" fill="#0b0b0f" />
      <rect x="166" y="24" width="288" height="44" rx="14" fill="#18181b" stroke="#7c3aed" />
      <text x="310" y="52" textAnchor="middle" fill="white" fontSize="18" fontWeight="800">STAGE</text>
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
        const fill = failed ? '#ef4444' : loading ? '#c084fc' : selected ? '#f5f3ff' : seat.status === 'unavailable' ? '#3f3f46' : seat.status === 'reserved-by-other' ? '#52525b' : filtered ? '#27272a' : colors[seat.priceCategory];
        const stroke = selected ? '#a855f7' : failed ? '#fecaca' : '#111113';
        return (
          <Tooltip
            key={seat.id}
            title={`${seat.sectorName} · Row ${seat.row}, Seat ${seat.number} · ${seat.price} PLN${seat.note ? ` · ${seat.note}` : ''}${seat.categories ? ' · multiple prices' : ''}`}
            arrow
          >
            <g onClick={() => !filtered && reserveSeat(seat)} style={{ cursor: filtered || seat.status !== 'available' ? 'not-allowed' : 'pointer', opacity: filtered ? 0.35 : 1 }}>
              <circle cx={seat.x} cy={seat.y} r={selected ? 11 : 9} fill={fill} stroke={stroke} strokeWidth="2" />
              {loading && <circle cx={seat.x} cy={seat.y} r="15" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="5 5"><animateTransform attributeName="transform" type="rotate" from={`0 ${seat.x} ${seat.y}`} to={`360 ${seat.x} ${seat.y}`} dur="1s" repeatCount="indefinite" /></circle>}
              {seat.accessible && <text x={seat.x + 8} y={seat.y - 8} fill="#ddd6fe" fontSize="9">♿</text>}
              {seat.limitedView && <text x={seat.x - 14} y={seat.y - 8} fill="#fbbf24" fontSize="10">!</text>}
            </g>
          </Tooltip>
        );
      })}
    </svg>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0b0b0f', color: '#f5f5f5' }}>
      <Paper elevation={0} sx={{ m: 1, p: 1.25, bgcolor: '#18181b', color: 'white', border: '1px solid #27272a' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
          {view === 'detail' && <Button startIcon={<ArrowBack />} onClick={() => { setView('overview'); setSelectedSector(null); resetMap(); }} variant="outlined" color="inherit">Back to overview</Button>}
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={900}>{view === 'overview' ? 'Venue overview' : view === 'pure' ? 'Pure map' : selectedSector?.name}</Typography>
            <Typography variant="caption" color="#a1a1aa">Browse freely. Timer starts only after first successful reservation.</Typography>
          </Box>
          <ToggleButtonGroup value={view === 'pure' ? 'pure' : 'shopping'} exclusive size="small" onChange={(_, val) => val && setView(val === 'pure' ? 'pure' : selectedSector ? 'detail' : 'overview')}>
            <ToggleButton value="shopping" sx={{ color: 'white', borderColor: '#3f3f46' }}><ShoppingCart fontSize="small" sx={{ mr: 0.5 }} />Shopping map</ToggleButton>
            <ToggleButton value="pure" sx={{ color: 'white', borderColor: '#3f3f46' }}><Fullscreen fontSize="small" sx={{ mr: 0.5 }} />Pure map</ToggleButton>
          </ToggleButtonGroup>
          <Button startIcon={<Search />} onClick={() => setFindOpen(!findOpen)} variant="outlined" color="inherit">Find seats</Button>
          <Button startIcon={<FilterList />} onClick={() => setFiltersOpen(!filtersOpen)} variant={filtersOpen ? 'contained' : 'outlined'} sx={{ bgcolor: filtersOpen ? '#7c3aed' : undefined }}>Filters</Button>
        </Stack>
      </Paper>

      {findOpen && (
        <Paper sx={{ mx: 1, mb: 1, p: 1.5, bgcolor: '#18181b', color: 'white', border: '1px solid #27272a' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField size="small" placeholder="Search row, seat or section" fullWidth InputProps={{ sx: { color: 'white' } }} />
            <Button variant="contained" sx={{ bgcolor: '#7c3aed' }} onClick={() => setSnackbar('Search kept as secondary path. Matching rows would highlight on the map.')}>Search</Button>
          </Stack>
        </Paper>
      )}

      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: filtersOpen ? '300px 1fr' : '1fr' }, minHeight: 0 }}>
        {filtersOpen && (
          <Paper square elevation={0} sx={{ p: 2, bgcolor: '#111113', color: 'white', borderRight: '1px solid #27272a', overflow: 'auto' }}>
            <Typography fontWeight={900} sx={{ mb: 2 }}>Filters & access</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Price range</Typography>
            <Slider value={filters.priceRange} min={0} max={320} valueLabelDisplay="auto" onChange={(_, value) => setFilters({ ...filters, priceRange: value as [number, number] })} sx={{ color: '#a855f7' }} />
            <Typography variant="caption" color="#a1a1aa">{filters.priceRange[0]}–{filters.priceRange[1]} PLN</Typography>
            <Divider sx={{ my: 2, borderColor: '#27272a' }} />
            {(['vip', 'premium', 'standard', 'balcony', 'ga'] as PriceCategory[]).map((cat) => (
              <FormControlLabel key={cat} control={<Checkbox checked={filters.categories.includes(cat)} onChange={() => setFilters({ ...filters, categories: filters.categories.includes(cat) ? filters.categories.filter((c) => c !== cat) : [...filters.categories, cat] })} sx={{ color: '#71717a', '&.Mui-checked': { color: colors[cat] } }} />} label={cat.toUpperCase()} />
            ))}
            <FormControlLabel control={<Checkbox checked={filters.accessibleOnly} onChange={(e) => setFilters({ ...filters, accessibleOnly: e.target.checked })} sx={{ color: '#71717a', '&.Mui-checked': { color: '#a855f7' } }} />} label="Accessible only" />
            <FormControlLabel control={<Checkbox checked={filters.adjacentOnly} onChange={(e) => setFilters({ ...filters, adjacentOnly: e.target.checked })} sx={{ color: '#71717a', '&.Mui-checked': { color: '#a855f7' } }} />} label="Only adjacent seats" />
            <FormControlLabel control={<Checkbox checked={filters.hideLimitedView} onChange={(e) => setFilters({ ...filters, hideLimitedView: e.target.checked })} sx={{ color: '#71717a', '&.Mui-checked': { color: '#a855f7' } }} />} label="Hide limited view" />
            <Divider sx={{ my: 2, borderColor: '#27272a' }} />
            <Typography fontWeight={800} sx={{ mb: 1 }}>Sector access code</Typography>
            <Stack direction="row" spacing={1}>
              <TextField size="small" placeholder="Crew code" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} InputProps={{ sx: { color: 'white' } }} />
              <Button onClick={applyAccessCode} variant="contained" sx={{ bgcolor: '#7c3aed' }}><LockOpen /></Button>
            </Stack>
            <Typography variant="caption" color="#a1a1aa">Prototype codes: CREW, PRESS, PHANTOM</Typography>
            <Divider sx={{ my: 2, borderColor: '#27272a' }} />
            <Typography fontWeight={800} sx={{ mb: 1 }}>Legend</Typography>
            {[['Available', '#a855f7'], ['Selected', '#f5f3ff'], ['Sold/locked', '#52525b'], ['Loading', '#c084fc']].map(([label, color]) => <Stack key={label} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}><Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: color }} /><Typography variant="caption">{label}</Typography></Stack>)}
          </Paper>
        )}

        <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: { xs: 540, md: 'auto' } }} onMouseDown={(e) => startDrag(e.clientX, e.clientY)} onMouseMove={(e) => moveDrag(e.clientX, e.clientY)} onMouseUp={() => setDragging(false)} onMouseLeave={() => setDragging(false)} onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)} onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)} onTouchEnd={() => setDragging(false)}>
          <Box sx={{ position: 'absolute', inset: 0, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center', transition: dragging ? 'none' : 'transform 180ms ease' }}>
            {view === 'pure' ? renderPureMap() : view === 'detail' ? renderSeats() : renderOverview()}
          </Box>

          <Stack spacing={1} sx={{ position: 'absolute', right: 12, top: 12, zIndex: 5 }}>
            <IconButton onClick={() => setZoom((z) => Math.min(2.8, z + 0.25))} sx={{ bgcolor: '#18181b', color: 'white', '&:hover': { bgcolor: '#27272a' } }}><ZoomIn /></IconButton>
            <IconButton onClick={() => setZoom((z) => Math.max(0.7, z - 0.25))} sx={{ bgcolor: '#18181b', color: 'white', '&:hover': { bgcolor: '#27272a' } }}><ZoomOut /></IconButton>
            <IconButton onClick={resetMap} sx={{ bgcolor: '#18181b', color: 'white', '&:hover': { bgcolor: '#27272a' } }}><MyLocation /></IconButton>
          </Stack>

          {zoom > 1.35 && (
            <Paper sx={{ position: 'absolute', right: 12, bottom: 86, width: 150, height: 96, bgcolor: '#18181b', border: '1px solid #3f3f46', p: 1 }}>
              <Typography variant="caption" color="#a1a1aa">Minimap</Typography>
              <Box sx={{ mt: 0.5, height: 58, bgcolor: '#27272a', borderRadius: 1, position: 'relative' }}>
                <Box sx={{ position: 'absolute', left: `${45 + pan.x / 20}%`, top: `${35 + pan.y / 20}%`, width: 34, height: 22, border: '2px solid #a855f7', borderRadius: 0.5 }} />
              </Box>
            </Paper>
          )}
        </Box>
      </Box>

      <Paper elevation={8} sx={{ m: 1, p: 1.5, bgcolor: '#18181b', color: 'white', border: '1px solid #27272a' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            <ShoppingCart />
            <Box>
              <Typography fontWeight={900}>{selectedSeats.length} selected · {selectedTotal} PLN</Typography>
              <Typography variant="caption" color="#a1a1aa">Running total updates live. More seats inherit the same timer.</Typography>
            </Box>
          </Stack>
          {selectedSector?.tableLayout && <Button onClick={buyFullTable} variant="outlined" color="inherit">Buy VIP table</Button>}
          <Button startIcon={<AutoAwesome />} onClick={() => selectBestAvailable(2)} variant="outlined" color="inherit">Best 2 seats</Button>
          <Button startIcon={<Visibility />} onClick={() => setSnackbar('View from seat preview would open as a side panel / mobile bottom sheet.')} variant="outlined" color="inherit">View preview</Button>
          <Button onClick={() => updateSelection([])} disabled={!selectedSeats.length} variant="contained" sx={{ bgcolor: '#7c3aed' }}>Clear basket</Button>
        </Stack>
      </Paper>

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

      <Snackbar open={!!snackbar} autoHideDuration={3200} onClose={() => setSnackbar('')}>
        <Alert severity="info" icon={<InfoOutlined />} sx={{ bgcolor: '#18181b', color: 'white', border: '1px solid #7c3aed' }}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  );
}
