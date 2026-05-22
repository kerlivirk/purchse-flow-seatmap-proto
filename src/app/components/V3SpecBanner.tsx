import { useState } from 'react';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Icon } from './Icon';

type Status = 'done' | 'partial' | 'todo';

interface SpecItem {
  label: string;
  status: Status;
  note?: string;
}

interface SpecGroup {
  tier: 'Must have' | 'Should have' | 'Nice to have';
  items: SpecItem[];
}

const SPEC: SpecGroup[] = [
  {
    tier: 'Must have',
    items: [
      { label: 'Two-level map · venue overview → drill-down to seats', status: 'done' },
      { label: 'Zoom in/out controls + minimap when zoomed', status: 'done' },
      { label: 'Sectors color-coded by price tier and match-density', status: 'done' },
      { label: 'Pick individual seats from the map', status: 'done' },
      { label: 'Pre-reservation on click with visible loading state', status: 'done' },
      { label: 'GA sector — one-click adds 1 GA ticket', status: 'done' },
      { label: 'Orphan-seat prevention (no single seat left between selections)', status: 'done' },
      { label: 'Seat states: available · sold · selected · pre-reserving · failed · reserved-by-other', status: 'done' },
      { label: 'Seat tooltip with sector, row, seat, price, note', status: 'done' },
      { label: 'Live summary box with selected count + total', status: 'done' },
      { label: 'Wheelchair pictogram on accessible seats', status: 'done' },
      { label: 'Free-text annotations on the map (Entrance B, Stairs, …)', status: 'partial', note: 'v1 only; v3 grid layout drops them — to be re-added' },
      { label: 'Localised sector / category names', status: 'partial', note: 'data model carries localName; UI still shows English' },
      { label: 'WCAG: contrast, aria-labels on seats, keyboard nav', status: 'done' },
      { label: 'Sector-level access code unlock', status: 'done' },
      { label: 'Keyboard arrow-key seat navigation (Enter / Space to reserve)', status: 'done', note: 'v3 only' },
      { label: 'Mobile-first responsive layout', status: 'done' },
    ],
  },
  {
    tier: 'Should have',
    items: [
      { label: 'Alternative full-venue (pure) map view', status: 'done' },
      { label: '"Starting at X PLN" badge per sector', status: 'done' },
      { label: 'Best-available-seats picker (1 / 2 / 4 in section)', status: 'done' },
      { label: 'Best in row picker', status: 'done' },
      { label: 'Filters panel: price-range slider, accessible toggle, hide-limited-view', status: 'done' },
      { label: 'Filter state dims non-matching sectors/seats', status: 'done' },
      { label: 'Price hidden behind access code', status: 'done' },
    ],
  },
  {
    tier: 'Nice to have',
    items: [
      { label: 'Per-seat notes (e.g. "limited view")', status: 'done' },
      { label: 'Multi-category overlap per seat (post-click category picker)', status: 'done' },
      { label: 'Custom label for the access-code field', status: 'done', note: 'v3 only via accessCodeLabel prop' },
      { label: 'Configurable stage name (Stage / Screen / Ring)', status: 'todo' },
      { label: 'View-from-seat preview', status: 'todo' },
    ],
  },
];

const STATUS_COLOR: Record<Status, { bg: string; fg: string; label: string }> = {
  done: { bg: '#ddfbea', fg: '#19633d', label: 'Done' },
  partial: { bg: '#fffac1', fg: '#A76002', label: 'Partial' },
  todo: { bg: '#f4f2f5', fg: '#5a5062', label: 'To do' },
};

export function V3SpecBanner() {
  const [open, setOpen] = useState(false);
  const counts = SPEC.flatMap((g) => g.items).reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { done: 0, partial: 0, todo: 0 } as Record<Status, number>
  );
  const total = counts.done + counts.partial + counts.todo;

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 0.5,
          bgcolor: '#ddfbea',
          border: '1px solid #06d373',
          borderRadius: 100,
          width: 'fit-content',
          alignSelf: 'flex-start',
          cursor: 'pointer',
          '&:hover': { bgcolor: '#bef6d7' },
        }}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}
      >
        <Box
          component="span"
          sx={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.8,
            bgcolor: '#11002b',
            color: '#ffffff',
            px: 0.75,
            py: 0.25,
            borderRadius: 100,
          }}
        >
          V3
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#11002b' }}>
          Must-haves checklist · {counts.done}/{total} done
        </Typography>
        {counts.partial > 0 && (
          <Typography sx={{ fontWeight: 700, fontSize: 11, color: '#A76002' }}>· {counts.partial} partial</Typography>
        )}
        {counts.todo > 0 && (
          <Typography sx={{ fontWeight: 700, fontSize: 11, color: '#5a5062' }}>· {counts.todo} to do</Typography>
        )}
        <Box sx={{ display: 'inline-flex', color: '#11002b' }}>
          <Icon name="tailless-line-arrow-right-5" size={12} />
        </Box>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9e7ed', pb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              component="span"
              sx={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.8,
                bgcolor: '#11002b',
                color: '#ffffff',
                px: 1,
                py: 0.5,
                borderRadius: 100,
              }}
            >
              V3
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Spec coverage</Typography>
            <Typography variant="caption" color="text.secondary">
              {counts.done} done · {counts.partial} partial · {counts.todo} to do
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close"><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {SPEC.map((group) => (
            <Box key={group.tier} sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 12, letterSpacing: 1, color: '#5a5062', mb: 1 }}>
                {group.tier.toUpperCase()}
              </Typography>
              <Stack spacing={0.5}>
                {group.items.map((item, idx) => {
                  const s = STATUS_COLOR[item.status];
                  return (
                    <Stack
                      key={idx}
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                      sx={{ py: 0.75, borderBottom: idx < group.items.length - 1 ? '1px solid #f4f2f5' : 'none' }}
                    >
                      <Box
                        sx={{
                          flexShrink: 0,
                          mt: 0.25,
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: 0.5,
                          bgcolor: s.bg,
                          color: s.fg,
                          px: 0.85,
                          py: 0.3,
                          borderRadius: 100,
                          minWidth: 56,
                          textAlign: 'center',
                        }}
                      >
                        {s.label.toUpperCase()}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#11002b' }}>{item.label}</Typography>
                        {item.note && (
                          <Typography variant="caption" color="text.secondary">{item.note}</Typography>
                        )}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
