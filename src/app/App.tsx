import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogContent,
  DialogTitle,
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
import { Tooltip, Snackbar, Alert } from '@mui/material';
import { Routes, Route, Link, useLocation } from 'react-router';

import { EventHeader } from './components/EventHeader';
import { VenueMap, DEFAULT_FILTERS } from './components/VenueMap';
import { ReferenceGallery } from './components/ReferenceGallery';
import { M3Button } from './components/M3Button';
import { Icon } from './components/Icon';
import { V3SpecBanner } from './components/V3SpecBanner';
import { FilterSidebar } from './components/FilterSidebar';
import phantomPoster from '../assets/phantom-poster.png';
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
  onRemoveSeat,
}: {
  open: boolean;
  onClose: () => void;
  selectedSeats: SelectedSeat[];
  secondsLeft: number | null;
  onRemoveSeat: (seatId: string) => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [lostSeat, setLostSeat] = useState<SelectedSeat | null>(null);
  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleCheckout = () => {
    if (!selectedSeats.length || verifying) return;
    setLostSeat(null);
    setVerifying(true);
    // Simulate "verify availability with server before payment"
    window.setTimeout(() => {
      // 35% chance one of the held seats has been lost in the meantime
      if (Math.random() < 0.35) {
        const victim = selectedSeats[Math.floor(Math.random() * selectedSeats.length)];
        setLostSeat(victim);
        onRemoveSeat(victim.id);
      } else {
        setLostSeat(null);
      }
      setVerifying(false);
    }, 1100);
  };

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

        {selectedSeats.length === 0 && !lostSeat ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#ffffff', borderColor: '#e9e7ed' }}>
            <Typography color="text.secondary">No seats selected yet. Browse the map freely — the timer starts only after a ticket is reserved.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {lostSeat && (
              <Alert
                severity="warning"
                onClose={() => setLostSeat(null)}
                sx={{ bgcolor: '#fffac1', color: '#A76002', border: '1px solid #efb100', fontWeight: 600 }}
              >
                <Typography sx={{ fontWeight: 800, mb: 0.25 }}>One seat is no longer available</Typography>
                <Typography variant="caption">
                  {getSeatLabel(lostSeat)} was just taken by another user and removed from your cart.
                  {selectedSeats.length > 0 ? ' Your remaining seats are still held.' : ' Please select new seats.'}
                </Typography>
              </Alert>
            )}
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

            {selectedSeats.length > 0 && (
              <>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={900}>Total</Typography>
                  <Typography fontWeight={900} color="primary.main">{total} PLN</Typography>
                </Stack>
                <M3Button buttonType="accent" size="md" fullWidth onClick={handleCheckout} disabled={verifying}>
                  {verifying ? 'Verifying availability…' : 'Continue to checkout'}
                </M3Button>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
                  We re-check the server before payment so you never pay for an unavailable seat.
                </Typography>
              </>
            )}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

function VersionSwitch() {
  const { pathname } = useLocation();
  const current = pathname.startsWith('/v4') ? 'v4' : pathname.startsWith('/v3') ? 'v3' : pathname.startsWith('/v2') ? 'v2' : 'v1';
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
      <Box component={Link} to="/v4" sx={{ ...baseSx, ...(current === 'v4' ? active : {}) }}>v4</Box>
    </Stack>
  );
}

function MapLab({ variant }: { variant: 'v1' | 'v2' | 'v3' | 'v4' }) {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [filters, setFilters] = useState<VenueFilters>(DEFAULT_FILTERS);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [checkoutPulse, setCheckoutPulse] = useState(false);
  const prevCountRef = useRef(0);
  const mapRef = useRef<MapHandle | null>(null);
  const [mapState, setMapState] = useState<MapState>({ selectedSectorName: null, view: 'overview', tableLayoutAvailable: false });
  // Demo simulation: another user claims a random available seat every few seconds
  const [simulateOthers, setSimulateOthers] = useState(false);
  const [simToast, setSimToast] = useState<string | null>(null);
  // Demo restore: when the user lands and we have a persisted cart, show a one-shot toast
  const [restoredCount, setRestoredCount] = useState(0);

  // Load persisted cart from sessionStorage on first mount
  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;
    try {
      const raw = sessionStorage.getItem('phantom-cart');
      if (!raw) return;
      const parsed = JSON.parse(raw) as SelectedSeat[];
      if (Array.isArray(parsed) && parsed.length) {
        setSelectedSeats(parsed);
        setRestoredCount(parsed.length);
        window.setTimeout(() => setRestoredCount(0), 5000);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist selectedSeats to sessionStorage
  useEffect(() => {
    try {
      if (selectedSeats.length) sessionStorage.setItem('phantom-cart', JSON.stringify(selectedSeats));
      else sessionStorage.removeItem('phantom-cart');
    } catch { /* ignore */ }
  }, [selectedSeats]);

  // Simulate-others-clicking-seats interval
  useEffect(() => {
    if (!simulateOthers) return;
    const id = window.setInterval(() => {
      const claimed = mapRef.current?.claimRandomSeat();
      if (claimed) setSimToast(`Another user just took ${claimed.label}`);
      window.setTimeout(() => setSimToast(null), 2500);
    }, 3000);
    return () => window.clearInterval(id);
  }, [simulateOthers]);

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
      <Box sx={{ height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e9e7ed', color: '#11002b' }}>
          <Toolbar sx={{ minHeight: { xs: 56, md: 64 }, px: { xs: 1.5, md: 3 }, gap: 1.5 }}>
            {(variant === 'v3' || variant === 'v4') ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                <Box component="img" src={phantomPoster} alt="" sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', flexShrink: 0, border: '1px solid #e9e7ed' }} />
                <Box sx={{ minWidth: 0, lineHeight: 1.1 }}>
                  <Typography sx={{ fontFamily: '"Panel Sans", Mulish, sans-serif', fontWeight: 900, fontSize: { xs: 13, md: 16 } }} noWrap>
                    The Phantom of the Opera
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#5a5062', display: { xs: 'none', sm: 'flex' } }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Icon name="location-pin-1" size={11} color="#06d373" />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>Gliwice Arena</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Icon name="blank-calendar" size={11} color="#06d373" />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>Fri, May 29 · 19:00</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Icon name="ticket-extra" size={11} color="#06d373" />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 11 }}>290 left</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            ) : (
              <>
                <Typography variant="h6" component="h1" sx={{ letterSpacing: -0.5, fontSize: { xs: 16, md: 20 }, mr: 2 }}>
                  TicketPro Map Lab
                </Typography>
                <VersionSwitch />
                <Box sx={{ flexGrow: 1 }} />
              </>
            )}
            {(variant === 'v3' || variant === 'v4') && (
              <Tooltip title={simulateOthers ? 'Stop simulating other users' : 'Simulate other users claiming seats'}>
                <IconButton
                  size="small"
                  onClick={() => setSimulateOthers((v) => !v)}
                  aria-label="Toggle simulate other users"
                  sx={{
                    width: 32, height: 32,
                    bgcolor: simulateOthers ? '#ff0032' : '#ffffff',
                    color: simulateOthers ? '#ffffff' : '#5a5062',
                    border: '1px solid #e9e7ed',
                    '&:hover': { bgcolor: simulateOthers ? '#cc0028' : '#f4f2f5' },
                  }}
                >
                  <Icon name="user-multiple-group" size={14} />
                </IconButton>
              </Tooltip>
            )}
            {(variant === 'v3' || variant === 'v4') && (
              <M3Button
                buttonType="outlined"
                size="sm"
                rounded={false}
                startIcon={<Icon name="filter-text" size={14} />}
                onClick={() => setFilterDialogOpen(true)}
                sx={{ flexShrink: 0 }}
              >
                {isMobile ? '' : 'Filter'}
              </M3Button>
            )}
            {(variant === 'v3' || variant === 'v4') && <VersionSwitch />}
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

        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            p: (variant === 'v3' || variant === 'v4') ? 0 : { xs: 1, md: 2 },
            pb: (variant === 'v3' || variant === 'v4')
              ? `calc(56px + env(safe-area-inset-bottom))`
              : { xs: 10, md: 9 },
          }}
        >
          {(variant === 'v3' || variant === 'v4') ? (
            <Box sx={{ flex: 1, minHeight: 0, bgcolor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
              <VenueMap
                ref={mapRef}
                selectedSeats={selectedSeats}
                onSelectionChange={setSelectedSeats}
                filters={filters}
                onFiltersChange={setFilters}
                variant={variant}
                hideActionBar
                hideToolbarFilters
                onMapStateChange={setMapState}
              />
            </Box>
          ) : (
            <Container maxWidth="xl" disableGutters={isMobile} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            </Container>
          )}
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

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          selectedSeats={selectedSeats}
          secondsLeft={secondsLeft}
          onRemoveSeat={(seatId) => setSelectedSeats((seats) => seats.filter((s) => s.id !== seatId))}
        />
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          fullScreen={isMobile}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: { xs: 0, md: 2 } } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9e7ed', py: 1.5, fontSize: 16, fontWeight: 800 }}>
            Filters
            <IconButton size="small" onClick={() => setFilterDialogOpen(false)} aria-label="Close filters"><Close /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <FilterSidebar filters={filters} onFiltersChange={setFilters} matchingCount={null} />
          </DialogContent>
        </Dialog>
        <ReferenceGallery />

        <Snackbar
          open={!!simToast}
          autoHideDuration={2500}
          onClose={() => setSimToast(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }}
        >
          <Alert severity="warning" variant="filled" sx={{ bgcolor: '#ff0032', color: '#ffffff', fontWeight: 700, '& .MuiAlert-icon': { color: '#ffffff' } }}>
            {simToast}
          </Alert>
        </Snackbar>

        <Snackbar
          open={restoredCount > 0}
          autoHideDuration={5000}
          onClose={() => setRestoredCount(0)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }}
        >
          <Alert severity="info" sx={{ bgcolor: '#f1fdf6', color: '#19633d', border: '1px solid #06d373', fontWeight: 700 }}>
            We restored your basket from your previous session ({restoredCount} {restoredCount === 1 ? 'seat' : 'seats'}).
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/v4" element={<MapLab variant="v4" />} />
      <Route path="/v3" element={<MapLab variant="v3" />} />
      <Route path="/v2" element={<MapLab variant="v2" />} />
      <Route path="*" element={<MapLab variant="v1" />} />
    </Routes>
  );
}
