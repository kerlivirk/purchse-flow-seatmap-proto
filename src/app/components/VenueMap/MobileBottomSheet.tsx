import { Box, IconButton, Stack, Typography } from '@mui/material';
import { Icon } from '../Icon';
import { TicketList } from '../TicketList';
import { generateSeats, sectorsV3, type V3Sector } from '../../data/sectors';
import { RESALE_COLOR, type Seat, type Sector, type SelectedSeat } from '../../types';

interface MobileBottomSheetProps {
  /** Drawer state controlled by the parent so its useEffect can collapse on view change. */
  expanded: boolean;
  setExpanded: (next: boolean | ((prev: boolean) => boolean)) => void;
  /** v4 (all-seats-visible) gets the chip strip + multi-sector list.
   *  v3 falls back to the single-sector single-list pattern. */
  allSeatsVisible: boolean;
  /** The selectedSector lets the v4 sheet highlight the active chip and reuses
   *  the parent's pre-computed seats array for the focused sector. */
  selectedSector: Sector | null;
  /** Pre-generated seats for the selected sector (saves a duplicate generateSeats). */
  seats: Seat[];
  /** Per-sector match counts so chips can show "215 · from 149 PLN" without recomputing. */
  matchingBySector: Record<string, { available: number; resale: number }>;
  /** Cart membership for the green "Remove" / "Select" toggle inside TicketList. */
  selectedIds: Set<string>;
  /** Filter predicate — same one used by the main map. */
  seatFiltered: (seat: Seat) => boolean;
  /** Toggle a seat in the cart. */
  reserveSeat: (seat: Seat) => void;
  /** Sector-level navigation (chip tap zooms the map to that sector). */
  openSector: (sector: Sector) => void;
  /** "Best in section" handler used when the currently focused sector is the one rendered. */
  selectBestAvailable: (count: number) => void;
  /** Type alias for the cart so the parent can swap SelectedSeat → Seat freely. */
  _selectedSeats?: SelectedSeat[]; // kept for symmetry / future use
  /** Whether the v3 single-sector sheet should render (only triggers when selected). */
  showV3Sheet: boolean;
}

/** Mobile bottom sheet renderer for v3 and v4.
 *  - v4: floating "SHOW ALL SEATS" pill straddling the drawer edge, section chips,
 *        and a flowing multi-sector TicketList stack when expanded.
 *  - v3: single-sector list with drag handle, only visible when a sector is zoomed. */
export function MobileBottomSheet(props: MobileBottomSheetProps) {
  const {
    expanded, setExpanded,
    allSeatsVisible, selectedSector,
    seats, matchingBySector, selectedIds,
    seatFiltered, reserveSeat, openSector, selectBestAvailable,
    showV3Sheet,
  } = props;

  if (allSeatsVisible) {
    const fanSectors = sectorsV3.filter((s) => !s.locked && (s as V3Sector).seatsBBox);
    return (
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: expanded ? '70%' : 84,
          bgcolor: '#ffffff',
          borderTop: '1px solid #e9e7ed',
          boxShadow: '0 -8px 24px rgba(17,0,43,0.08)',
          zIndex: 6,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          transition: 'height 240ms ease',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        {/* Floating "Show seats" pill — straddles the drawer's top edge */}
        <Box
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v); }}
          aria-label={expanded ? 'Hide seat list' : 'Show all seats'}
          sx={{
            position: 'absolute',
            top: -18,
            left: '50%',
            transform: 'translateX(-50%)',
            height: 36,
            px: 1.75,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            bgcolor: '#11002b',
            color: '#ffffff',
            borderRadius: 100,
            boxShadow: '0 6px 16px rgba(17,0,43,0.22), 0 1px 2px rgba(17,0,43,0.12)',
            cursor: 'pointer',
            zIndex: 2,
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 0.4,
            whiteSpace: 'nowrap',
            transition: 'background-color 150ms',
            '&:hover': { bgcolor: '#2a1850' },
            '&:active': { transform: 'translateX(-50%) translateY(1px)' },
          }}
        >
          <Icon name={expanded ? 'tailless-line-arrow-down-5' : 'tailless-line-arrow-up-5'} size={14} color="#ffffff" />
          {expanded ? 'HIDE SEATS' : 'SHOW ALL SEATS'}
        </Box>

        {/* Sector chips strip — always visible so users see all sections without scrolling */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            px: 1,
            pb: 0.75,
            pt: 2.25,
            flexShrink: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {fanSectors.map((s) => {
            const accent = s.id === 'mezzanine' ? '#7b5aa8' : '#9d85d0';
            const isActive = selectedSector?.id === s.id;
            const avail = matchingBySector[s.id]?.available ?? 0;
            return (
              <Box
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); openSector(s); }}
                sx={{
                  flex: '1 1 0',
                  minWidth: 92,
                  px: 1,
                  py: 0.75,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: isActive ? accent : '#e9e7ed',
                  bgcolor: isActive ? `${accent}1F` : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accent, flexShrink: 0 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: 12, lineHeight: 1.1, color: '#11002b' }} noWrap>
                    {s.name}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10, color: '#5a5062', lineHeight: 1.1 }} noWrap>
                  {avail} · from {s.startingPrice} PLN
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* Expanded list */}
        <Box sx={{ flex: 1, minHeight: 0, display: expanded ? 'block' : 'none', overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', borderTop: '1px solid #e9e7ed' }}>
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
                onSectorClick={() => { openSector(s); setExpanded(false); }}
                resaleColor={RESALE_COLOR}
              />
            );
          })}
        </Box>
      </Box>
    );
  }

  // v3 fallback — single-sector sheet only when a sector is zoomed in
  if (!showV3Sheet || !selectedSector) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: expanded ? '65%' : 64,
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
        onClick={() => setExpanded((v) => !v)}
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
        <IconButton size="small" sx={{ flexShrink: 0 }} aria-label={expanded ? 'Collapse list' : 'Expand list'}>
          <Icon name={expanded ? 'tailless-line-arrow-down-5' : 'tailless-line-arrow-up-5'} size={16} color="#11002b" />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, display: expanded ? 'flex' : 'none', flexDirection: 'column', overflow: 'hidden', p: 1, pt: 0 }}>
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
  );
}
