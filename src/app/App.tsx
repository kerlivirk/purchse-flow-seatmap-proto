import { useEffect, useMemo, useState } from 'react';
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
import { TicketTypeSelector } from './components/TicketTypeSelector';
import { VenueMap, DEFAULT_FILTERS } from './components/VenueMap';
import { ReferenceGallery } from './components/ReferenceGallery';
import { M3Button } from './components/M3Button';
import { Icon } from './components/Icon';
import type { SelectedSeat, VenueFilters } from './components/VenueMap';

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
  const isV2 = pathname.startsWith('/v2');
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
      <Box component={Link} to="/" sx={{ ...baseSx, ...(!isV2 ? active : {}) }}>v1</Box>
      <Box component={Link} to="/v2" sx={{ ...baseSx, ...(isV2 ? active : {}) }}>v2</Box>
    </Stack>
  );
}

function MapLab({ variant }: { variant: 'v1' | 'v2' }) {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [filters, setFilters] = useState<VenueFilters>(DEFAULT_FILTERS);

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
      <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
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
            {!isMobile && selectedSeats.length > 0 && (
              <Typography variant="body2" sx={{ mr: 2, fontWeight: 800 }}>
                {selectedSeats.length} ticket{selectedSeats.length === 1 ? '' : 's'} · {selectedTotal} PLN
              </Typography>
            )}
            <IconButton color="inherit" aria-label="Open selected tickets" onClick={() => setCartOpen(true)}>
              <Badge badgeContent={selectedSeats.length} color="primary">
                <Icon name="shopping-cart-1" size={22} color="#11002b" />
              </Badge>
            </IconButton>
          </Toolbar>
          {secondsLeft !== null && <LinearProgress variant="determinate" value={progress} sx={{ height: 3, bgcolor: '#d4d4d8', '& .MuiLinearProgress-bar': { bgcolor: '#a855f7' } }} />}
        </AppBar>

        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: { xs: 1, md: 2 }, pb: { xs: selectedSeats.length > 0 ? 11 : 2, md: 2 } }}>
          <Container maxWidth="xl" disableGutters={isMobile} sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <EventHeader variant={variant} />
            <Paper elevation={0} sx={{ border: '1px solid #e9e7ed', borderRadius: 2, overflow: 'hidden', bgcolor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
              <TicketTypeSelector filters={filters} onFiltersChange={setFilters} />
              <Box sx={{ height: { xs: 680, md: 760 }, position: 'relative', borderTop: '1px solid #e9e7ed', bgcolor: '#ffffff', overflow: 'hidden' }}>
                <VenueMap selectedSeats={selectedSeats} onSelectionChange={setSelectedSeats} filters={filters} onFiltersChange={setFilters} variant={variant} />
              </Box>
            </Paper>
          </Container>
        </Box>

        {isMobile && selectedSeats.length > 0 && (
          <Paper elevation={2} sx={{ position: 'fixed', left: 8, right: 8, bottom: 8, zIndex: theme.zIndex.drawer - 1, p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #06d373' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography fontWeight={900}>{selectedSeats.length} selected · {selectedTotal} PLN</Typography>
                {secondsLeft !== null && <Typography variant="body2" color="#19633d">Reserved for {formatTimer(secondsLeft)}</Typography>}
              </Box>
              <M3Button buttonType="accent" size="sm" onClick={() => setCartOpen(true)}>
                Cart
              </M3Button>
            </Stack>
          </Paper>
        )}

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} selectedSeats={selectedSeats} secondsLeft={secondsLeft} />
        <ReferenceGallery />
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/v2" element={<MapLab variant="v2" />} />
      <Route path="*" element={<MapLab variant="v1" />} />
    </Routes>
  );
}
