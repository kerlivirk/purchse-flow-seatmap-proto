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
import { Close, Menu as MenuIcon, ShoppingCart, TimerOutlined } from '@mui/icons-material';

import { EventHeader } from './components/EventHeader';
import { TicketTypeSelector } from './components/TicketTypeSelector';
import { VenueMap } from './components/VenueMap';
import { ReferenceGallery } from './components/ReferenceGallery';
import type { SelectedSeat } from './components/VenueMap';

const RESERVATION_SECONDS = 10 * 60;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a855f7' },
    secondary: { main: '#7c3aed' },
    background: { default: '#050507', paper: '#111113' },
    text: { primary: '#f5f5f5', secondary: '#a1a1aa' },
    divider: '#27272a',
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h6: { fontWeight: 800 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 999, fontWeight: 800 },
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
      <Box sx={{ width: { xs: '100vw', sm: 430 }, p: 2, bgcolor: '#0b0b0f', minHeight: '100%', color: 'white' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">Mini-cart</Typography>
            {secondsLeft !== null && (
              <Stack direction="row" spacing={0.75} alignItems="center" color="#c4b5fd">
                <TimerOutlined fontSize="small" />
                <Typography variant="caption">Reserved for {formatTimer(secondsLeft)}</Typography>
              </Stack>
            )}
          </Box>
          <IconButton onClick={onClose} aria-label="Close cart" sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Stack>

        {selectedSeats.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#18181b', borderColor: '#27272a' }}>
            <Typography color="text.secondary">No seats selected yet. Browse the map freely — the timer starts only after a ticket is reserved.</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {selectedSeats.map((seat) => (
              <Paper key={seat.id} variant="outlined" sx={{ p: 1.5, bgcolor: '#18181b', borderColor: '#27272a' }}>
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
            <Button variant="contained" size="large" fullWidth sx={{ bgcolor: '#7c3aed' }}>
              Continue to checkout
            </Button>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

export default function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

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
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(5,5,7,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #27272a' }}>
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" color="inherit" aria-label="Open menu" sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1, letterSpacing: -0.5 }}>
              TicketPro Map Lab
            </Typography>
            {secondsLeft !== null && !isMobile && (
              <Chip icon={<TimerOutlined />} label={`Reserved for ${formatTimer(secondsLeft)}`} sx={{ mr: 2, bgcolor: '#18181b', color: '#c4b5fd', border: '1px solid #7c3aed' }} />
            )}
            {!isMobile && selectedSeats.length > 0 && (
              <Typography variant="body2" sx={{ mr: 2, fontWeight: 800 }}>
                {selectedSeats.length} ticket{selectedSeats.length === 1 ? '' : 's'} · {selectedTotal} PLN
              </Typography>
            )}
            <IconButton color="inherit" aria-label="Open selected tickets" onClick={() => setCartOpen(true)}>
              <Badge badgeContent={selectedSeats.length} color="primary">
                <ShoppingCart />
              </Badge>
            </IconButton>
          </Toolbar>
          {secondsLeft !== null && <LinearProgress variant="determinate" value={progress} sx={{ height: 3, bgcolor: '#27272a', '& .MuiLinearProgress-bar': { bgcolor: '#a855f7' } }} />}
        </AppBar>

        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: { xs: 1, md: 2 }, pb: { xs: selectedSeats.length > 0 ? 11 : 2, md: 2 } }}>
          <Container maxWidth="xl" disableGutters={isMobile} sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <EventHeader />
            <TicketTypeSelector />
            <Paper elevation={0} sx={{ flex: 1, minHeight: { xs: 680, md: 760 }, position: 'relative', overflow: 'hidden', border: '1px solid #27272a', bgcolor: '#0b0b0f' }}>
              <VenueMap selectedSeats={selectedSeats} onSelectionChange={setSelectedSeats} />
            </Paper>
          </Container>
        </Box>

        {isMobile && selectedSeats.length > 0 && (
          <Paper elevation={12} sx={{ position: 'fixed', left: 8, right: 8, bottom: 8, zIndex: theme.zIndex.drawer - 1, p: 1.5, borderRadius: 4, bgcolor: '#18181b', border: '1px solid #7c3aed' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography fontWeight={900}>{selectedSeats.length} selected · {selectedTotal} PLN</Typography>
                {secondsLeft !== null && <Typography variant="body2" color="#c4b5fd">Reserved for {formatTimer(secondsLeft)}</Typography>}
              </Box>
              <Button variant="contained" onClick={() => setCartOpen(true)} sx={{ bgcolor: '#7c3aed' }}>
                Cart
              </Button>
            </Stack>
          </Paper>
        )}

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} selectedSeats={selectedSeats} secondsLeft={secondsLeft} />
        <ReferenceGallery />
      </Box>
    </ThemeProvider>
  );
}
