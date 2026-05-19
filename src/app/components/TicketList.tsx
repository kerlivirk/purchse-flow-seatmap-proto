import { useMemo } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { ConfirmationNumber, Accessible, WarningAmber } from '@mui/icons-material';
import type { PriceCategory, Seat, Sector } from './VenueMap';

interface TicketListProps {
  sector: Sector | null;
  seats: Seat[];
  selectedIds: Set<string>;
  onReserve: (seat: Seat) => void;
  resaleColor?: string;
}

const categoryColor: Record<PriceCategory, string> = {
  vip: '#a855f7',
  premium: '#7c3aed',
  standard: '#6b7280',
  balcony: '#9ca3af',
  ga: '#4b5563',
};

export function TicketList({ sector, seats, selectedIds, onReserve, resaleColor = '#ec4899' }: TicketListProps) {
  const available = useMemo(
    () =>
      seats
        .filter((seat) => seat.status === 'available')
        .sort((a, b) => (a.row > b.row ? 1 : a.row < b.row ? -1 : Number(a.number) - Number(b.number))),
    [seats]
  );

  const byRow = useMemo(() => {
    const map = new Map<string, Seat[]>();
    available.forEach((seat) => {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
    });
    return map;
  }, [available]);

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        border: '1px solid #d4d4d8',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #d4d4d8', bgcolor: '#fafafa' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <ConfirmationNumber fontSize="small" sx={{ color: '#7c3aed' }} />
          <Typography fontWeight={900}>{sector?.name ?? 'Tickets'}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {available.length} matching ticket{available.length === 1 ? '' : 's'} · pick from map or list
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {available.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No tickets match your current filters.
            </Typography>
          </Box>
        )}

        {Array.from(byRow.entries()).map(([row, rowSeats]) => (
          <Box key={row} sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ pl: 1, color: '#52525b', fontWeight: 800, letterSpacing: 0.5 }}>
              ROW {row}
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {rowSeats.map((seat) => {
                const selected = selectedIds.has(seat.id);
                const accent = seat.resale ? resaleColor : categoryColor[seat.priceCategory];
                return (
                  <Stack
                    key={seat.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      px: 1,
                      py: 0.75,
                      borderRadius: 1,
                      border: `1px solid ${selected ? '#7c3aed' : '#e4e4e7'}`,
                      bgcolor: selected ? '#f5f3ff' : '#ffffff',
                      transition: 'background-color 120ms, border-color 120ms',
                      '&:hover': { bgcolor: '#f4f4f5' },
                    }}
                  >
                    <Box sx={{ width: 4, height: 28, borderRadius: 1, bgcolor: accent, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography fontWeight={800} fontSize={14}>
                          Seat {seat.number}
                        </Typography>
                        {seat.resale && (
                          <Chip
                            label="Resale"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: resaleColor,
                              color: 'white',
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                        )}
                        {seat.accessible && <Accessible sx={{ fontSize: 14, color: '#7c3aed' }} />}
                        {seat.limitedView && <WarningAmber sx={{ fontSize: 14, color: '#f59e0b' }} />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {seat.priceCategory.toUpperCase()}
                        {seat.limitedView ? ' · Limited view' : ''}
                        {seat.categories && seat.categories.length > 1 ? ' · multi-price' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography fontWeight={900} fontSize={14}>
                        {seat.price} PLN
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant={selected ? 'outlined' : 'contained'}
                      onClick={() => onReserve(seat)}
                      sx={{
                        minWidth: 64,
                        py: 0.25,
                        fontSize: 11,
                        bgcolor: selected ? 'transparent' : '#7c3aed',
                        borderColor: selected ? '#7c3aed' : undefined,
                        color: selected ? '#7c3aed' : 'white',
                        '&:hover': { bgcolor: selected ? '#f5f3ff' : '#6d28d9' },
                      }}
                    >
                      {selected ? 'Remove' : 'Select'}
                    </Button>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
