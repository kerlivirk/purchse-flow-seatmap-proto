import { useMemo, useState } from 'react';
import { Box, Button, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import {
  Accessible,
  AutoAwesome,
  ConfirmationNumber,
  ExpandLess,
  ExpandMore,
  WarningAmber,
} from '@mui/icons-material';
import type { PriceCategory, Seat, Sector } from './VenueMap';

interface TicketListProps {
  sector: Sector | null;
  seats: Seat[];
  selectedIds: Set<string>;
  onReserve: (seat: Seat) => void;
  onBestInSection?: (count: number) => void;
  resaleColor?: string;
}

const categoryColor: Record<PriceCategory, string> = {
  vip: '#a855f7',
  premium: '#7c3aed',
  standard: '#6b7280',
  balcony: '#9ca3af',
  ga: '#4b5563',
};

interface RowGroup {
  row: string;
  seats: Seat[];
  count: number;
  minPrice: number;
  maxPrice: number;
  resaleCount: number;
  accessibleCount: number;
  category: PriceCategory;
}

function bestSeatsIn(seats: Seat[], count: number): Seat[] {
  // Center-most first (closest to seat #7), then cheapest, then non-resale preferred
  return [...seats]
    .sort((a, b) => {
      const aDist = Math.abs(Number(a.number) - 7);
      const bDist = Math.abs(Number(b.number) - 7);
      if (aDist !== bDist) return aDist - bDist;
      if (a.price !== b.price) return a.price - b.price;
      return Number(!!a.resale) - Number(!!b.resale);
    })
    .slice(0, count);
}

export function TicketList({
  sector,
  seats,
  selectedIds,
  onReserve,
  onBestInSection,
  resaleColor = '#ec4899',
}: TicketListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const rows = useMemo<RowGroup[]>(() => {
    const map = new Map<string, Seat[]>();
    seats
      .filter((seat) => seat.status === 'available')
      .forEach((seat) => {
        if (!map.has(seat.row)) map.set(seat.row, []);
        map.get(seat.row)!.push(seat);
      });
    const result: RowGroup[] = [];
    map.forEach((rowSeats, row) => {
      const sorted = [...rowSeats].sort((a, b) => Number(a.number) - Number(b.number));
      const prices = sorted.map((s) => s.price);
      result.push({
        row,
        seats: sorted,
        count: sorted.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        resaleCount: sorted.filter((s) => s.resale).length,
        accessibleCount: sorted.filter((s) => s.accessible).length,
        category: sorted[0].priceCategory,
      });
    });
    return result.sort((a, b) => a.row.localeCompare(b.row));
  }, [seats]);

  const totalAvailable = rows.reduce((sum, r) => sum + r.count, 0);

  const toggleRow = (row: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });

  const reserveBestInRow = (group: RowGroup, count: number) => {
    const picks = bestSeatsIn(
      group.seats.filter((s) => !selectedIds.has(s.id)),
      count
    );
    picks.forEach((seat, i) => window.setTimeout(() => onReserve(seat), i * 120));
    setExpandedRows((prev) => new Set(prev).add(group.row));
  };

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
      <Box sx={{ px: { xs: 1.25, md: 2 }, py: { xs: 1, md: 1.5 }, borderBottom: '1px solid #d4d4d8', bgcolor: '#fafafa', flexShrink: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: onBestInSection ? 1 : 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <ConfirmationNumber fontSize="small" sx={{ color: '#7c3aed' }} />
            <Typography fontWeight={900} noWrap>{sector?.name ?? 'Tickets'}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {rows.length} rows · {totalAvailable} tickets
          </Typography>
        </Stack>
        {onBestInSection && totalAvailable > 0 && (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#52525b' }}>Best in section:</Typography>
            {[1, 2, 4].map((n) => (
              <Button
                key={n}
                size="small"
                variant="outlined"
                onClick={() => onBestInSection(n)}
                startIcon={n === 1 ? undefined : <AutoAwesome sx={{ fontSize: 14 }} />}
                sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11, borderColor: '#d4d4d8', color: '#52525b', '&:hover': { borderColor: '#7c3aed', color: '#7c3aed', bgcolor: '#f5f3ff' } }}
              >
                {n}
              </Button>
            ))}
          </Stack>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {totalAvailable === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No tickets match your current filters.
            </Typography>
          </Box>
        )}

        {rows.map((group) => {
          const expanded = expandedRows.has(group.row);
          const accent = categoryColor[group.category];
          const selectedInRow = group.seats.filter((s) => selectedIds.has(s.id)).length;
          return (
            <Box key={group.row} sx={{ mb: 0.75, border: '1px solid #e4e4e7', borderRadius: 1.5, overflow: 'hidden' }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                onClick={() => toggleRow(group.row)}
                sx={{
                  px: 1,
                  py: 0.75,
                  cursor: 'pointer',
                  bgcolor: expanded ? '#f5f3ff' : '#ffffff',
                  '&:hover': { bgcolor: expanded ? '#ede9fe' : '#f4f4f5' },
                }}
              >
                <Box sx={{ width: 4, height: 28, borderRadius: 1, bgcolor: accent, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography fontWeight={900} fontSize={14}>Row {group.row}</Typography>
                    <Typography variant="caption" sx={{ color: '#52525b', fontWeight: 700 }}>
                      · {group.count} ticket{group.count === 1 ? '' : 's'}
                    </Typography>
                    {selectedInRow > 0 && (
                      <Chip
                        label={`${selectedInRow} selected`}
                        size="small"
                        sx={{ height: 18, fontSize: 10, fontWeight: 800, bgcolor: '#7c3aed', color: 'white', '& .MuiChip-label': { px: 0.75 } }}
                      />
                    )}
                    {group.resaleCount > 0 && (
                      <Chip
                        label={`${group.resaleCount} resale`}
                        size="small"
                        sx={{ height: 18, fontSize: 10, fontWeight: 800, bgcolor: resaleColor, color: 'white', '& .MuiChip-label': { px: 0.75 } }}
                      />
                    )}
                    {group.accessibleCount > 0 && <Accessible sx={{ fontSize: 14, color: '#7c3aed' }} />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {group.minPrice === group.maxPrice
                      ? `${group.minPrice} PLN`
                      : `${group.minPrice}–${group.maxPrice} PLN`}
                    {' · '}
                    {group.category.toUpperCase()}
                  </Typography>
                </Box>
                <Tooltip title="Best 2 in this row">
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); reserveBestInRow(group, 2); }}
                      disabled={group.count - selectedInRow < 2}
                      sx={{
                        color: '#7c3aed',
                        '&:hover': { bgcolor: '#f5f3ff' },
                        '&.Mui-disabled': { color: '#d4d4d8' },
                      }}
                    >
                      <AutoAwesome fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <IconButton size="small" sx={{ color: '#52525b' }}>
                  {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </IconButton>
              </Stack>

              {expanded && (
                <Box sx={{ borderTop: '1px solid #e4e4e7', bgcolor: '#fafafa' }}>
                  {group.seats.map((seat) => {
                    const selected = selectedIds.has(seat.id);
                    const seatAccent = seat.resale ? resaleColor : categoryColor[seat.priceCategory];
                    return (
                      <Stack
                        key={seat.id}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderTop: '1px solid #f4f4f5',
                          bgcolor: selected ? '#f5f3ff' : 'transparent',
                          '&:first-of-type': { borderTop: 'none' },
                        }}
                      >
                        <Box sx={{ width: 3, height: 20, borderRadius: 1, bgcolor: seatAccent, flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontWeight={700} fontSize={13}>Seat {seat.number}</Typography>
                            {seat.resale && (
                              <Chip
                                label="Resale"
                                size="small"
                                sx={{ height: 15, fontSize: 9, fontWeight: 800, bgcolor: resaleColor, color: 'white', '& .MuiChip-label': { px: 0.5 } }}
                              />
                            )}
                            {seat.accessible && <Accessible sx={{ fontSize: 12, color: '#7c3aed' }} />}
                            {seat.limitedView && <WarningAmber sx={{ fontSize: 12, color: '#f59e0b' }} />}
                          </Stack>
                        </Box>
                        <Typography fontWeight={800} fontSize={13}>{seat.price} PLN</Typography>
                        <Button
                          size="small"
                          variant={selected ? 'outlined' : 'contained'}
                          onClick={() => onReserve(seat)}
                          sx={{
                            minWidth: 56,
                            py: 0.1,
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
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
