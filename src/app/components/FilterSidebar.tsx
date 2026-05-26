import { Box, Divider, Slider, Stack, Typography } from '@mui/material';
import { M3Chip } from './M3Chip';
import { Icon } from './Icon';
import type { PriceCategory, VenueFilters } from './VenueMap';

const ALL_CATS: PriceCategory[] = ['vip', 'premium', 'standard', 'balcony', 'ga'];

const CAT_META: Array<{ id: PriceCategory; name: string; icon: string; price: number }> = [
  { id: 'vip', name: 'VIP', icon: 'star-1', price: 299 },
  { id: 'premium', name: 'Premium', icon: 'gift-2', price: 199 },
  { id: 'standard', name: 'Standard', icon: 'chair-3', price: 149 },
  { id: 'balcony', name: 'Balcony', icon: 'few-tickets', price: 99 },
  { id: 'ga', name: 'Standing', icon: 'user-multiple-group', price: 79 },
];

interface Props {
  filters: VenueFilters;
  onFiltersChange: (next: VenueFilters) => void;
  matchingCount: number | null;
}

export function FilterSidebar({ filters, onFiltersChange, matchingCount }: Props) {
  const allSelected = filters.categories.length === ALL_CATS.length && !filters.accessibleOnly;

  const selectOne = (cat: PriceCategory) => {
    const onlyThis = filters.categories.length === 1 && filters.categories[0] === cat && !filters.accessibleOnly;
    if (onlyThis) onFiltersChange({ ...filters, categories: ALL_CATS, accessibleOnly: false });
    else onFiltersChange({ ...filters, categories: [cat], accessibleOnly: false });
  };

  const resetAll = () => onFiltersChange({ ...filters, categories: ALL_CATS, accessibleOnly: false });

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.8, color: '#11002b' }}>FILTERS</Typography>
        {matchingCount !== null && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {matchingCount} matching
          </Typography>
        )}
      </Stack>

      <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>TICKET TYPE</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
        <M3Chip
          size="sm"
          selected={allSelected}
          leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: allSelected ? '#ffffff' : '#11002b' }}><Icon name="thumbnail-view" size={14} /></Box>}
          onClick={resetAll}
          label={<Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>All</Box>}
        />
        {CAT_META.map((c) => {
          const isOnly = filters.categories.length === 1 && filters.categories[0] === c.id && !filters.accessibleOnly;
          return (
            <M3Chip
              key={c.id}
              size="sm"
              selected={isOnly}
              leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: isOnly ? '#ffffff' : '#11002b' }}><Icon name={c.icon} size={14} /></Box>}
              onClick={() => selectOne(c.id)}
              label={
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>{c.name}</Box>
                  <Box component="span" sx={{ opacity: 0.65, fontWeight: 600, fontSize: 10 }}>{c.price} PLN</Box>
                </Box>
              }
            />
          );
        })}
      </Box>

      <Divider sx={{ my: 1.5, borderColor: '#e9e7ed' }} />

      <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>ACCESSIBILITY</Typography>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
        <M3Chip
          size="sm"
          selected={filters.accessibleOnly}
          leadingIcon={<Box sx={{ display: 'flex', alignItems: 'center', color: filters.accessibleOnly ? '#ffffff' : '#11002b' }}><Icon name="house-key-access" size={14} /></Box>}
          onClick={() => onFiltersChange({ ...filters, accessibleOnly: !filters.accessibleOnly })}
          label={<Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>Accessible only</Box>}
        />
        <M3Chip
          size="sm"
          selected={filters.hideLimitedView}
          onClick={() => onFiltersChange({ ...filters, hideLimitedView: !filters.hideLimitedView })}
          label={<Box component="span" sx={{ fontWeight: 800, fontSize: 12 }}>Hide limited view</Box>}
        />
      </Stack>

      <Divider sx={{ my: 1.5, borderColor: '#e9e7ed' }} />

      <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>PRICE RANGE</Typography>
      <Box sx={{ px: 0.5 }}>
        <Slider
          value={filters.priceRange}
          min={0}
          max={320}
          valueLabelDisplay="auto"
          onChange={(_, value) => onFiltersChange({ ...filters, priceRange: value as [number, number] })}
          sx={{ color: '#7b5aa8' }}
        />
        <Typography variant="caption" color="text.secondary">
          {filters.priceRange[0]}–{filters.priceRange[1]} PLN
        </Typography>
      </Box>

      <Divider sx={{ my: 1.5, borderColor: '#e9e7ed' }} />

      <Typography variant="caption" sx={{ fontWeight: 800, color: '#5a5062', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>LEGEND</Typography>
      <Stack spacing={0.5}>
        {[
          ['Available', '#9d85d0'],
          ['Selected', '#06d373'],
          ['Taken (sold / held)', '#d4d4d8'],
          ['Resale', '#ec4899'],
        ].map(([label, color]) => (
          <Stack key={label as string} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color as string }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
