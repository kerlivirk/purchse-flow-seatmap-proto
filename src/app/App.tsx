import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
  useMediaQuery,
} from '@mui/material';
import { Close, TimerOutlined } from '@mui/icons-material';
import { Routes, Route, Link, useLocation } from 'react-router';

import { EventHeader } from './components/EventHeader';
import { VenueMap, DEFAULT_FILTERS } from './components/VenueMap';
import { ReferenceGallery } from './components/ReferenceGallery';
import { M3Button } from './components/M3Button';
import { Icon } from './components/Icon';
import { V3SpecBanner } from './components/V3SpecBanner';
import { FilterSidebar } from './components/FilterSidebar';
import type { SelectedSeat, VenueFilters, MapHandle, MapState } from './components/VenueMap';
import { AutoAwesome, Visibility } from '@mui/icons-material';

const RESERVATION_SECONDS = 10 * 60;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#06d373', contrastText: '#11002b' },
    secondary: { main: '#9d85d0' },
    background: { default: '#f8f8fa', paper: '#ffffff' },
    text: { primary: '#11002b', secondary: '#5a5062' },
    divider: '#e9e7ed',
    error: { main: '#ff0032' },
    warning: { main: '#efb100' },
  },
  typography: {
    fontFamily: 'Mulish, "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Panel Sans", Mulish, sans-serif', fontWeight: 900 },
    h2: { fontFamily: '"Panel Sans", Mulish, sans-serif', fontWeight: 900 },
    h3: { fontFamily: '"Panel Sans", Mulish, sans-serif', fontWeight: 900 },
    h4: { fontFamily: '"Panel Sans", Mulish, sans-serif', fontWeight: 900 },
    h5: { fontFamily: 'Mulish, sans-serif', fontWeight: 700 },
    h6: { fontFamily: 'Mulish, sans-serif', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.1px' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 100, fontWeight: 700 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
  },
});

function getSeatLabel(seat: SelectedSeat) {
  if (seat.priceCategory === 'ga') return `${seat.sectorName} · General Admission`;
  return `${seat.sectorName}, Row ${seat.row}, Seat ${seat.number}`;
}

function formatTimer(seconds: number) {
  const mins = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
  const secs = Math.max(0, seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function CartDrawer({
  open,
  onClose,
  selectedSeats,
  secondsLeft,
}: {
  open: boolean;
  onClose: () => void;
  selectedSeats: SelectedSeat[];
  secondsLeft: number | null;
}) {
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 430 }, p: 2, bgcolor: '#fafafa', minHeight: '100%', color: '#0a0a0a' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">Mini-cart</Typography>
            {secondsLeft !== null && (
              <Stack direction="row" spacing={0.75} alignItems="center" color="#19633d">
                <TimerOutlined fontSize="small" />
                <Typography variant="caption">Reserved for {formatTimer(secondsLeft)}</Typography>
              </Stack>
            )}
          </Box>
          <IconButton onClick={onClose} aria-label="Close cart" sx={{ color: '#0a0a0a' }}>
            <Close />
          </IconButton>
        </Stack>

        {selectedSeats.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#ffffff', borderColor: '#e9e7ed' }}>
            <Typography color="text.secondary">No seats selected yet. Browse the map freely — the timer starts only after a ticket is reserved.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {selectedSeats.map((seat) => (
              <Paper key={seat.id} variant="outlined" sx={{ p: 1.5, bgcolor: '#ffffff', borderColor: '#e9e7ed' }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography fontWeight={800}>{getSeatLabel(seat)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {seat.selectedCategoryLabel ?? seat.priceCategory.toUpperCase()}
                      {seat.limitedView ? ' · Limited view' : ''}
                      {seat.accessible ? ' · Accessible' : ''}
                    </Typography>
                  </Box>
                  <Typography fontWeight={900}>{seat.price} PLN</Typography>
                </Stack>
              </Paper>
            ))}

            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={900}>Total</Typography>
              <Typography fontWeight={900} color="primary.main">{total} PLN</Typography>
            </Stack>
            <M3Button buttonType="accent" size="md" fullWidth>
              Continue to checkout
            </M3Button>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

function VersionSwitch() {
  const { pathname } = useLocation();
  const current = pathname.startsWith('/v3') ? 'v3' : pathname.startsWith('/v2') ? 'v2' : 'v1';
  const baseSx = {
    px: 1.5,
    py: 0.5,
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 100,
    textTransform: 'none' as const,
    border: '1px solid #e9e7ed',
    color: '#11002b',
    textDecoration: 'none',
    lineHeight: 1.6,
  };
  const active = { bgcolor: '#11002b', color: '#ffffff', borderColor: '#11002b' };
  return (
    <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
      <Box component={Link} to="/" sx={{ ...baseSx, ...(current === 'v1' ? active : {}) }}>v1</Box>
      <Box component={Link} to="/v2" sx={{ ...baseSx, ...(current === 'v2' ? active : {}) }}>v2</Box>
      <Box component={Link} to="/v3" sx={{ ...baseSx, ...(current === 'v3' ? active : {}) }}>v3</Box>
    </Stack>
  );
}

function MapLab({ variant }: { variant: 'v1' | 'v2' | 'v3' }) {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [filters, setFilters] = useState<VenueFilters>(DEFAULT_FILTERS);
  const [checkoutPulse, setCheckoutPulse] = useState(false);
  const prevCountRef = useRef(0);
  const mapRef = useRef<MapHandle | null>(null);
  const [mapState, setMapState] = useState<MapState>({ selectedSectorName: null, view: 'overview', tableLayoutAvailable: false });

  useEffect(() => {
    if (selectedSeats.length > prevCountRef.current) {
      setCheckoutPulse(true);
      const t = window.setTimeout(() => setCheckoutPulse(false), 1400);
      prevCountRef.current = selectedSeats.length;
      return () => window.clearTimeout(t);
    }
    prevCountRef.current = selectedSeats.length;
  }, [selectedSeats.length]);

  const selectedTotal = useMemo(() => selectedSeats.reduce((sum, seat) => sum + seat.price, 0), [selectedSeats]);

  useEffect(() => {
    if (selectedSeats.length > 0 && timerStartedAt === null) setTimerStartedAt(Date.now());
    if (selectedSeats.length === 0 && timerStartedAt !== null) setTimerStartedAt(null);
  }, [selectedSeats.length, timerStartedAt]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const secondsLeft = timerStartedAt === null ? null : Math.max(0, RESERVATION_SECONDS - Math.floor((now - timerStartedAt) / 1000));
  const progress = secondsLeft === null ? 0 : (secondsLeft / RESERVATION_SECONDS) * 100;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #d4d4d8', color: '#0a0a0a' }}>
          <Toolbar sx={{ minHeight: { xs: 52, md: 64 }, px: { xs: 1.5, md: 3 } }}>
            <Typography variant="h6" component="h1" sx={{ letterSpacing: -0.5, fontSize: { xs: 16, md: 20 }, mr: 2 }}>
              TicketPro Map Lab
            </Typography>
            <VersionSwitch />
            <Box sx={{ flexGrow: 1 }} />
            {secondsLeft !== null && isMobile && (
              <Chip icon={<TimerOutlined />} label={formatTimer(secondsLeft)} size="small" sx={{ mr: 1, bgcolor: '#ddfbea', color: '#19633d', border: '1px solid #06d373', fontWeight: 800 }} />
            )}
            {secondsLeft !== null && !isMobile && (
              <Chip icon={<TimerOutlined />} label={`Reserved for ${formatTimer(secondsLeft)}`} sx={{ mr: 2, bgcolor: '#ddfbea', color: '#19633d', border: '1px solid #06d373' }} />
            )}
            {!isMobile && selectedSeats.length > 0 ? (
              <Box
                role="button"
                tabIndex={0}
                onClick={() => setCartOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCartOpen(true); }}
                aria-label="Open basket and checkout"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  height: 36,
                  borderRadius: 100,
                  border: '1px solid #06d373',
                  bgcolor: '#06d373',
                  color: '#11002b',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  boxShadow: checkoutPulse ? '0 0 0 6px rgba(6,211,115,0.25)' : '0 0 0 0 rgba(6,211,115,0)',
                  transform: checkoutPulse ? 'scale(1.05)' : 'scale(1)',
                  '&:hover': { bgcolor: '#05b863', borderColor: '#05b863' },
                  '@keyframes nudge': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(3px)' },
                    '75%': { transform: 'translateX(-2px)' },
                  },
                }}
              >
                <Badge badgeContent={selectedSeats.length} color="primary" sx={{ '& .MuiBadge-badge': { bgcolor: '#11002b', color: '#ffffff' } }}>
                  <Icon name="shopping-cart-1" size={18} color="#11002b" />
                </Badge>
                <Typography sx={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.1px' }}>
                  Checkout · {selectedTotal} PLN
                </Typography>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    animation: checkoutPulse ? 'nudge 600ms ease' : 'none',
                  }}
                >
                  <Icon name="tailless-line-arrow-right-5" size={16} color="#11002b" />
                </Box>
              </Box>
            ) : (
              <IconButton color="inherit" aria-label="Open selected tickets" onClick={() => setCartOpen(true)}>
                <Badge badgeContent={selectedSeats.length} color="primary">
                  <Icon name="shopping-cart-1" size={22} color="#11002b" />
                </Badge>
              </IconButton>
            )}
          </Toolbar>
          {secondsLeft !== null && <LinearProgress variant="determinate" value={progress} sx={{ height: 3, bgcolor: '#d4d4d8', '& .MuiLinearProgress-bar': { bgcolor: '#a855f7' } }} />}
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 1, md: 2 }, pb: { xs: 10, md: 9 } }}>
          <Container maxWidth="xl" disableGutters={isMobile} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {variant === 'v3' && <V3SpecBanner />}
            {variant === 'v3' ? (
              <>
                <EventHeader variant="v3" />
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'stretch' }}>
                  <Paper elevation={0} sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0, border: '1px solid #e9e7ed', borderRadius: 2, bgcolor: '#ffffff', overflow: 'hidden', alignSelf: 'flex-start' }}>
                    <FilterSidebar filters={filters} onFiltersChange={setFilters} matchingCount={null} />
                  </Paper>
                  <Paper elevation={0} sx={{ flex: 1, height: { xs: 'calc(100vh - 360px)', md: 'calc(100vh - 240px)' }, minHeight: 540, border: '1px solid #e9e7ed', borderRadius: 2, overflow: 'hidden', bgcolor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                    <VenueMap
                      ref={mapRef}
                      selectedSeats={selectedSeats}
                      onSelectionChange={setSelectedSeats}
                      filters={filters}
                      onFiltersChange={setFilters}
                      variant={variant}
                      hideActionBar
                      hideToolbarFilters={!isMobile}
                      onMapStateChange={setMapState}
                    />
                  </Paper>
                </Box>
              </>
            ) : (
              <>
                <EventHeader variant={variant} />
                <Paper elevation={0} sx={{ height: { xs: 'calc(100vh - 240px)', md: 'calc(100vh - 220px)' }, minHeight: 540, border: '1px solid #e9e7ed', borderRadius: 2, overflow: 'hidden', bgcolor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                  <VenueMap
                    ref={mapRef}
                    selectedSeats={selectedSeats}
                    onSelectionChange={setSelectedSeats}
                    filters={filters}
                    onFiltersChange={setFilters}
                    variant={variant}
                    hideActionBar
                    onMapStateChange={setMapState}
                  />
                </Paper>
              </>
            )}
          </Container>
        </Box>

        <Paper
          elevation={0}
          square
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: theme.zIndex.appBar - 1,
            borderTop: '1px solid #e9e7ed',
            bgcolor: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            px: { xs: 1.5, md: 3 },
            py: { xs: 0.75, md: 1 },
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
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
            </Stack>
            {mapState.selectedSectorName && (
              <Typography variant="caption" sx={{ display: { xs: 'none', md: 'block' }, color: '#5a5062', pl: 1 }} noWrap>
                in <strong style={{ color: '#11002b' }}>{mapState.selectedSectorName}</strong>
              </Typography>
            )}
            <Box sx={{ flex: 1 }} />
            {mapState.tableLayoutAvailable && !isMobile && (
              <M3Button onClick={() => mapRef.current?.buyFullTable()} buttonType="outlined" size="sm" rounded={false}>
                Buy VIP table
              </M3Button>
            )}
            <M3Button
              startIcon={!isMobile ? <AutoAwesome /> : undefined}
              onClick={() => mapRef.current?.selectBestAvailable(2)}
              buttonType="outlined"
              size="sm"
              rounded={false}
              sx={isMobile ? { minWidth: 0, px: 1.25 } : undefined}
            >
              {isMobile ? <AutoAwesome fontSize="small" /> : 'Best 2 seats'}
            </M3Button>
            {!isMobile && (
              <M3Button
                startIcon={<Visibility />}
                onClick={() => mapRef.current?.selectBestAvailable(2)}
                buttonType="outlined"
                size="sm"
                rounded={false}
              >
                View preview
              </M3Button>
            )}
            <M3Button
              onClick={() => mapRef.current?.clearBasket()}
              disabled={!selectedSeats.length}
              buttonType="filled"
              size="sm"
            >
              {isMobile ? 'Clear' : 'Clear basket'}
            </M3Button>
          </Stack>
        </Paper>

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} selectedSeats={selectedSeats} secondsLeft={secondsLeft} />
        <ReferenceGallery />
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/v3" element={<MapLab variant="v3" />} />
      <Route path="/v2" element={<MapLab variant="v2" />} />
      <Route path="*" element={<MapLab variant="v1" />} />
    </Routes>
  );
}
